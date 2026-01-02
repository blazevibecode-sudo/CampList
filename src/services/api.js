export const createApi = (userRef) => {
  const request = async (path, options = {}) => {
    if (!userRef.value) {
      throw new Error("Not authenticated");
    }
    const token = await userRef.value.getIdToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    };
    const response = await fetch(path, { ...options, headers });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || response.statusText);
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  };

  return {
    getTrips: () => request("/api/trips"),
    createTrip: (payload) =>
      request("/api/trips", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    updateTrip: (tripId, payload) =>
      request(`/api/trips/${tripId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteTrip: (tripId) =>
      request(`/api/trips/${tripId}`, { method: "DELETE" }),
    getItems: (tripId) => request(`/api/trips/${tripId}/items`),
    createItem: (tripId, payload) =>
      request(`/api/trips/${tripId}/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    updateItem: (tripId, itemId, payload) =>
      request(`/api/trips/${tripId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteItem: (tripId, itemId) =>
      request(`/api/trips/${tripId}/items/${itemId}`, { method: "DELETE" }),
    inviteMember: (tripId, payload) =>
      request(`/api/trips/${tripId}/invite`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };
};
