const admin = require("firebase-admin");

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!admin.apps.length) {
  if (!serviceAccountJson) {
    console.warn("FIREBASE_SERVICE_ACCOUNT is not set");
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
    });
  }
}

const db = admin.apps.length ? admin.firestore() : null;
const { FieldValue } = admin.firestore;

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const parseBody = (event) => {
  if (!event.body) {
    return {};
  }
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
};

const requireAuth = async (event) => {
  const header = event.headers.authorization || event.headers.Authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new Error("Missing auth token");
  }
  const token = header.slice(7);
  const decoded = await admin.auth().verifyIdToken(token);
  if (!decoded.email) {
    throw new Error("Missing email in token");
  }
  return decoded;
};

const normalizeTrip = (doc) => {
  const data = doc.data();
  return { id: doc.id, ...data };
};

const roleFromTrip = (trip, email, uid) => {
  if (trip?.memberRoles?.[email]) {
    return trip.memberRoles[email];
  }
  if (trip?.ownerEmail === email || trip?.uid === uid) {
    return "owner";
  }
  return "";
};

const ensureDb = () => {
  if (!db) {
    throw new Error("Firebase admin not initialized");
  }
};

exports.handler = async (event) => {
  try {
    ensureDb();
    const { httpMethod } = event;
    const path = event.path.replace(/^.*\/api/, "/api");
    const decoded = await requireAuth(event);
    const email = decoded.email;
    const uid = decoded.uid;

    if (httpMethod === "GET" && path === "/api/trips") {
      const tripsRef = db.collection("trips");
      const trips = new Map();

      const memberQuery = await tripsRef
        .where("memberEmails", "array-contains", email)
        .orderBy("createdAt", "desc")
        .get();

      memberQuery.forEach((doc) => trips.set(doc.id, normalizeTrip(doc)));

      const legacyQuery = await tripsRef
        .where("uid", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

      legacyQuery.forEach((doc) => trips.set(doc.id, normalizeTrip(doc)));

      return json(200, { trips: Array.from(trips.values()) });
    }

    if (httpMethod === "POST" && path === "/api/trips") {
      const body = parseBody(event);
      if (!body.title) {
        return json(400, { error: "title is required" });
      }
      const payload = {
        title: String(body.title).trim(),
        date: body.date || null,
        location: body.location ? String(body.location).trim() : "",
        note: body.note ? String(body.note).trim() : "",
        uid,
        ownerUid: uid,
        ownerEmail: email,
        memberEmails: [email],
        memberRoles: { [email]: "owner" },
        itemsCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      const docRef = await db.collection("trips").add(payload);
      return json(201, { id: docRef.id });
    }

    const tripMatch = path.match(/^\/api\/trips\/([^/]+)(?:\/(.*))?$/);
    if (tripMatch) {
      const tripId = tripMatch[1];
      const tail = tripMatch[2] || "";
      const tripRef = db.collection("trips").doc(tripId);
      const tripSnap = await tripRef.get();
      if (!tripSnap.exists) {
        return json(404, { error: "Trip not found" });
      }
      const trip = tripSnap.data();
      const role = roleFromTrip(trip, email, uid);
      const isMember =
        trip.memberEmails?.includes(email) || trip.ownerEmail === email || trip.uid === uid;

      if (!isMember) {
        return json(403, { error: "Forbidden" });
      }

      if (tail === "invite" && httpMethod === "POST") {
        if (role !== "owner") {
          return json(403, { error: "Only owner can invite" });
        }
        const body = parseBody(event);
        const inviteEmail = String(body.email || "").trim().toLowerCase();
        const inviteRole = body.role === "viewer" ? "viewer" : "editor";
        if (!inviteEmail) {
          return json(400, { error: "email is required" });
        }
        const updatedRoles = { ...(trip.memberRoles || {}), [inviteEmail]: inviteRole };
        await tripRef.set(
          {
            memberRoles: updatedRoles,
            memberEmails: admin.firestore.FieldValue.arrayUnion(inviteEmail),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return json(200, { ok: true });
      }

      if (!tail) {
        if (httpMethod === "PATCH") {
          const body = parseBody(event);
          if (role === "owner") {
            await tripRef.update({
              title: body.title !== undefined ? String(body.title).trim() : trip.title,
              date: body.date !== undefined ? body.date || null : trip.date || null,
              location:
                body.location !== undefined ? String(body.location).trim() : trip.location || "",
              note: body.note !== undefined ? String(body.note).trim() : trip.note || "",
              updatedAt: FieldValue.serverTimestamp(),
            });
          } else if (role === "editor") {
            await tripRef.update({
              note: body.note !== undefined ? String(body.note).trim() : trip.note || "",
              updatedAt: FieldValue.serverTimestamp(),
            });
          } else {
            return json(403, { error: "Forbidden" });
          }
          return json(200, { ok: true });
        }

        if (httpMethod === "DELETE") {
          if (role !== "owner") {
            return json(403, { error: "Only owner can delete" });
          }
          const itemsSnap = await tripRef.collection("items").get();
          const batch = db.batch();
          itemsSnap.docs.forEach((doc) => batch.delete(doc.ref));
          batch.delete(tripRef);
          await batch.commit();
          return json(200, { ok: true });
        }
      }

      if (tail === "items" && httpMethod === "GET") {
        const itemsSnap = await tripRef.collection("items").orderBy("createdAt", "asc").get();
        const items = itemsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return json(200, { items });
      }

      if (tail === "items" && httpMethod === "POST") {
        if (role !== "owner" && role !== "editor") {
          return json(403, { error: "Only editors can add items" });
        }
        const body = parseBody(event);
        if (!body.text) {
          return json(400, { error: "text is required" });
        }
        const payload = {
          text: String(body.text).trim(),
          note: body.note ? String(body.note).trim() : "",
          category: body.category || "",
          qty: Number(body.qty) || 1,
          unit: body.unit ? String(body.unit).trim() : "",
          goChecked: Boolean(body.goChecked),
          returnChecked: Boolean(body.returnChecked),
          uid,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        await tripRef.collection("items").add(payload);
        await tripRef.update({
          itemsCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return json(201, { ok: true });
      }

      const itemMatch = tail.match(/^items\/([^/]+)$/);
      if (itemMatch) {
        const itemId = itemMatch[1];
        const itemRef = tripRef.collection("items").doc(itemId);
        if (httpMethod === "PATCH") {
          if (role !== "owner" && role !== "editor") {
            return json(403, { error: "Only editors can update items" });
          }
          const body = parseBody(event);
          const updates = { updatedAt: FieldValue.serverTimestamp() };
          ["text", "note", "category", "unit"].forEach((field) => {
            if (body[field] !== undefined) {
              updates[field] = String(body[field]).trim();
            }
          });
          if (body.qty !== undefined) {
            updates.qty = Number(body.qty) || 1;
          }
          if (body.goChecked !== undefined) {
            updates.goChecked = Boolean(body.goChecked);
          }
          if (body.returnChecked !== undefined) {
            updates.returnChecked = Boolean(body.returnChecked);
          }
          await itemRef.update(updates);
          return json(200, { ok: true });
        }

        if (httpMethod === "DELETE") {
          if (role !== "owner" && role !== "editor") {
            return json(403, { error: "Only editors can delete items" });
          }
          await itemRef.delete();
          await tripRef.update({
            itemsCount: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          });
          return json(200, { ok: true });
        }
      }
    }

    return json(404, { error: "Not found" });
  } catch (error) {
    return json(500, { error: error.message || "Server error" });
  }
};
