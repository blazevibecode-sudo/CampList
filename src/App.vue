<template>
  <div class="page" :class="{ dark: isDark }">
    <header class="hero">
      <div>
        <p class="eyebrow">Checklist Web App</p>
        <h1>露營行程清單</h1>
        <p class="sub">行程卡片 + 分類項目 + 去程/回程雙勾選 + 備註。</p>
      </div>
      <div class="user" v-if="user">
        <span class="label">使用者</span>
        <strong>{{ user.displayName || user.email || user.uid.slice(0, 8) }}</strong>
        <span v-if="currentRole" class="role-tag">{{ roleLabel }}</span>
        <button class="ghost" type="button" @click="handleSignOut">登出</button>
      </div>
    </header>

    <section class="theme-switch">
      <button class="ghost" type="button" @click="toggleTheme">
        {{ isDark ? "切換亮色" : "切換深色" }}
      </button>
    </section>

    <section class="status-bar">
      <span class="badge success" v-if="user">登入成功</span>
      <span class="badge" :class="{ warn: syncStatus !== '已同步' }" v-if="user">
        {{ syncStatus }}
      </span>
      <span class="badge" v-if="authStatus">{{ authStatus }}</span>
      <span class="badge warn" v-if="authError">{{ authError }}</span>
      <button class="ghost" type="button" @click="showDiag = !showDiag">
        {{ showDiag ? "關閉診斷" : "登入診斷" }}
      </button>
    </section>
    <section v-if="showDiag" class="card diag">
      <h3>登入診斷</h3>
      <p class="muted">這些資訊只在本機顯示，不會寫入資料庫。</p>
      <div class="diag-grid">
        <div>
          <span class="diag-label">Auth 狀態</span>
          <strong>{{ user ? "已登入" : "未登入" }}</strong>
        </div>
        <div>
          <span class="diag-label">使用者 Email</span>
          <strong>{{ currentEmail || "無" }}</strong>
        </div>
        <div>
          <span class="diag-label">Auth UID</span>
          <strong>{{ user?.uid || "無" }}</strong>
        </div>
        <div>
          <span class="diag-label">持久化</span>
          <strong>{{ authDiag.persistence }}</strong>
        </div>
        <div>
          <span class="diag-label">最後登入方式</span>
          <strong>{{ authDiag.lastSignInMethod }}</strong>
        </div>
        <div>
          <span class="diag-label">Redirect 結果</span>
          <strong>{{ authDiag.redirectResult }}</strong>
        </div>
        <div>
          <span class="diag-label">Redirect Provider</span>
          <strong>{{ authDiag.redirectProvider }}</strong>
        </div>
        <div>
          <span class="diag-label">Redirect Email</span>
          <strong>{{ authDiag.redirectEmail }}</strong>
        </div>
        <div>
          <span class="diag-label">Auth Domain</span>
          <strong>{{ authDiag.authDomain }}</strong>
        </div>
        <div>
          <span class="diag-label">Origin</span>
          <strong>{{ authDiag.origin }}</strong>
        </div>
        <div>
          <span class="diag-label">Auth 狀態變化</span>
          <strong>{{ authDiag.lastAuthState }}</strong>
        </div>
        <div>
          <span class="diag-label">登入狀態訊息</span>
          <strong>{{ authStatus || "無" }}</strong>
        </div>
        <div>
          <span class="diag-label">錯誤訊息</span>
          <strong>{{ authError || "無" }}</strong>
        </div>
      </div>
    </section>

    <section v-if="!user" class="card login">
      <h2>使用 Google 登入</h2>
      <p class="muted">登入後才能存取自己的露營行程與清單。</p>
      <button type="button" @click="handleSignIn" :disabled="authBusy">
        Google 登入
      </button>
    </section>

    <main v-else class="layout">
      <section class="card">
        <div class="card-header">
          <h2>歷史露營行程</h2>
          <button class="ghost" @click="clearSelection" :disabled="!selectedTripId">
            取消選擇
          </button>
        </div>
        <form class="form" @submit.prevent="addTrip">
          <div class="field">
            <label for="trip-title">行程名稱</label>
            <input
              id="trip-title"
              v-model="newTrip.title"
              type="text"
              placeholder="例如：南投兩天一夜"
              required
            />
          </div>
          <div class="field">
            <label for="trip-date">出發日期</label>
            <input id="trip-date" v-model="newTrip.date" type="date" />
          </div>
          <div class="field">
            <label for="trip-location">地點</label>
            <input
              id="trip-location"
              v-model="newTrip.location"
              type="text"
              placeholder="例如：溪頭"
            />
          </div>
          <div class="field">
            <label for="trip-note">行程備註</label>
            <input
              id="trip-note"
              v-model="newTrip.note"
              type="text"
              placeholder="選填：集合時間、車位"
            />
          </div>
          <button type="submit" :disabled="!user || loadingTrip">新增行程</button>
        </form>

        <div class="trip-list" v-if="trips.length">
          <button
            v-for="trip in trips"
            :key="trip.id"
            class="trip"
            :class="{ active: trip.id === selectedTripId }"
            @click="selectTrip(trip.id)"
          >
            <div>
              <strong>{{ trip.title }}</strong>
              <span v-if="trip.date">{{ formatDate(trip.date) }}</span>
              <span v-if="trip.location">{{ trip.location }}</span>
            </div>
            <span class="meta">{{ trip.itemsCount || 0 }} 項</span>
          </button>
        </div>
        <p v-else class="empty">尚無行程，先新增一筆吧。</p>
      </section>

      <section class="card">
        <div class="card-header">
          <div>
            <h2>Checklist</h2>
            <p v-if="selectedTrip" class="muted">
              {{ selectedTrip.title }}
              <span v-if="selectedTrip.date">・{{ formatDate(selectedTrip.date) }}</span>
              <span v-if="selectedTrip.location">・{{ selectedTrip.location }}</span>
            </p>
          </div>
          <button
            class="ghost danger"
            @click="removeTrip"
            :disabled="!selectedTripId || !isOwner"
          >
            刪除行程
          </button>
        </div>

        <div v-if="!selectedTripId" class="empty">
          請先從左側選擇一個行程。
        </div>

        <div v-else>
          <div class="trip-edit" v-if="isOwner">
            <div class="field">
              <label for="edit-title">行程名稱</label>
              <input id="edit-title" v-model="editTrip.title" type="text" />
            </div>
            <div class="field">
              <label for="edit-date">出發日期</label>
              <input id="edit-date" v-model="editTrip.date" type="date" />
            </div>
            <div class="field">
              <label for="edit-location">地點</label>
              <input id="edit-location" v-model="editTrip.location" type="text" />
            </div>
            <div class="field">
              <label for="edit-note">行程備註</label>
              <input id="edit-note" v-model="editTrip.note" type="text" />
            </div>
            <button class="secondary" @click="saveTripEdits" :disabled="!selectedTripId">
              更新行程資訊
            </button>
          </div>
          <div class="trip-edit" v-else>
            <div class="field">
              <label for="edit-note-only">行程備註</label>
              <input
                id="edit-note-only"
                v-model="editTrip.note"
                type="text"
                :disabled="!canEdit"
              />
            </div>
            <button class="secondary" @click="saveTripEdits" :disabled="!canEdit">
              更新備註
            </button>
          </div>

          <div class="share-panel">
            <div class="card-header">
              <h3>分享與協作</h3>
              <span class="muted" v-if="selectedTrip">
                擁有者：{{ selectedTrip.ownerEmail || selectedTrip.ownerUid }}
              </span>
            </div>
            <form class="form" @submit.prevent="inviteMember" v-if="isOwner">
              <div class="field">
                <label for="invite-email">Email</label>
                <input
                  id="invite-email"
                  v-model="invite.email"
                  type="email"
                  placeholder="請輸入對方的 Google Email"
                  required
                />
              </div>
              <div class="field">
                <label for="invite-role">權限</label>
                <select id="invite-role" v-model="invite.role">
                  <option value="editor">可編輯</option>
                  <option value="viewer">只可閱讀</option>
                </select>
              </div>
              <button type="submit" :disabled="!isOwner">送出邀請</button>
            </form>
            <p v-else class="muted">只有擁有者可以邀請成員。</p>
            <div class="member-list" v-if="memberList.length">
              <div v-for="member in memberList" :key="member.email" class="member">
                <strong>{{ member.email }}</strong>
                <span class="meta">{{ member.roleLabel }}</span>
              </div>
            </div>
          </div>

          <form class="form" @submit.prevent="addItem">
            <div class="field">
              <label for="item-text">項目</label>
              <input
                id="item-text"
                v-model="newItem.text"
                type="text"
                placeholder="例如：帳篷、保暖毯"
                required
                :disabled="!canEdit"
              />
            </div>
            <div class="field">
              <label for="item-category">分類</label>
              <select id="item-category" v-model="newItem.category" :disabled="!canEdit">
                <option value="">未分類</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="item-qty">數量</label>
              <input
                id="item-qty"
                v-model="newItem.qty"
                type="number"
                min="1"
                :disabled="!canEdit"
              />
            </div>
            <div class="field">
              <label for="item-unit">單位</label>
              <input
                id="item-unit"
                v-model="newItem.unit"
                type="text"
                placeholder="例如：個、組"
                :disabled="!canEdit"
              />
            </div>
            <div class="field">
              <label for="item-note">備註</label>
              <input
                id="item-note"
                v-model="newItem.note"
                type="text"
                placeholder="選填：尺寸、數量、提醒"
                :disabled="!canEdit"
              />
            </div>
            <button type="submit" :disabled="loadingItem || !canEdit">新增項目</button>
          </form>

          <div class="list" v-if="groupedItems.length">
            <section v-for="group in groupedItems" :key="group.name" class="group">
              <div class="group-header">
                <h3>{{ group.name }}</h3>
                <span>{{ group.items.length }} 項</span>
              </div>
              <article v-for="item in group.items" :key="item.id" class="todo">
                <div class="todo-main">
                  <strong :class="{ done: item.goChecked && item.returnChecked }">
                    {{ item.text }}
                    <span v-if="item.qty" class="meta">· {{ item.qty }} {{ item.unit }}</span>
                  </strong>
                  <input
                    class="note"
                    type="text"
                    :value="item.note || ''"
                    placeholder="備註"
                    :disabled="!canEdit"
                    @change="updateNote(item, $event.target.value)"
                  />
                </div>
                <div class="todo-actions">
                  <label class="check">
                    <input
                      type="checkbox"
                      :checked="item.goChecked"
                      :disabled="!canEdit"
                      @change="toggleCheck(item, 'goChecked')"
                    />
                    <span>去程</span>
                  </label>
                  <label class="check">
                    <input
                      type="checkbox"
                      :checked="item.returnChecked"
                      :disabled="!canEdit"
                      @change="toggleCheck(item, 'returnChecked')"
                    />
                    <span>回程</span>
                  </label>
                  <button class="ghost" @click="removeItem(item)" :disabled="!canEdit">
                    刪除
                  </button>
                </div>
              </article>
            </section>
          </div>
          <p v-else class="empty">這個行程還沒有項目。</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  setPersistence,
} from "firebase/auth";
import { auth } from "./firebase";

const user = ref(null);
const authBusy = ref(false);
const syncStatus = ref("尚未登入");
const isDark = ref(false);
const authStatus = ref("");
const authError = ref("");
const showDiag = ref(false);
const authDiag = ref({
  persistence: "未設定",
  lastAuthState: "尚未觸發",
  lastAuthUid: "無",
  lastAuthEmail: "無",
  redirectResult: "停用",
  redirectProvider: "停用",
  redirectEmail: "停用",
  lastSignInMethod: "無",
  origin: window.location.origin,
  authDomain: auth?.app?.options?.authDomain || "未知",
});
const trips = ref([]);
const items = ref([]);
const selectedTripId = ref(null);
const loadingTrip = ref(false);
const loadingItem = ref(false);

const newTrip = ref({
  title: "",
  date: "",
  location: "",
  note: "",
});

const editTrip = ref({
  title: "",
  date: "",
  location: "",
  note: "",
});

const newItem = ref({
  text: "",
  category: "",
  qty: 1,
  unit: "",
  note: "",
});

const invite = ref({
  email: "",
  role: "editor",
});

const categories = ["露營裝備", "廚房餐食", "衣物保暖", "安全備用", "其他"];

const selectedTrip = computed(() =>
  trips.value.find((trip) => trip.id === selectedTripId.value)
);

const currentEmail = computed(() => user.value?.email || "");
const currentRole = computed(() => {
  if (!selectedTrip.value || !currentEmail.value) {
    return "";
  }
  return selectedTrip.value.memberRoles?.[currentEmail.value] || "";
});

const roleLabel = computed(() => {
  if (currentRole.value === "owner") {
    return "擁有者";
  }
  if (currentRole.value === "editor") {
    return "可編輯";
  }
  if (currentRole.value === "viewer") {
    return "只讀";
  }
  return "";
});

const isOwner = computed(() => currentRole.value === "owner");
const canEdit = computed(
  () => currentRole.value === "owner" || currentRole.value === "editor"
);

const memberList = computed(() => {
  const roles = selectedTrip.value?.memberRoles || {};
  return Object.entries(roles).map(([email, role]) => ({
    email,
    role,
    roleLabel:
      role === "owner" ? "擁有者" : role === "editor" ? "可編輯" : "只讀",
  }));
});

const groupedItems = computed(() => {
  const groups = new Map();
  items.value.forEach((item) => {
    const name = item.category || "未分類";
    if (!groups.has(name)) {
      groups.set(name, []);
    }
    groups.get(name).push(item);
  });
  return Array.from(groups.entries()).map(([name, list]) => ({
    name,
    items: list,
  }));
});

const api = async (path, options = {}) => {
  if (!user.value) {
    throw new Error("Not authenticated");
  }
  const token = await user.value.getIdToken();
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

const loadTrips = async () => {
  if (!user.value) {
    return;
  }
  syncStatus.value = "同步中…";
  try {
    const data = await api("/api/trips");
    trips.value = data.trips || [];
    syncStatus.value = "已同步";
    if (trips.value.length && !selectedTripId.value) {
      selectedTripId.value = trips.value[0].id;
    }
    if (selectedTripId.value) {
      const exists = trips.value.some(
        (trip) => trip.id === selectedTripId.value
      );
      if (!exists) {
        selectedTripId.value = trips.value[0]?.id || null;
      }
    }
  } catch (error) {
    syncStatus.value = "同步失敗";
    authError.value = error.message || "載入行程失敗";
  }
};

const loadItems = async (tripId) => {
  if (!user.value || !tripId) {
    items.value = [];
    return;
  }
  syncStatus.value = "同步中…";
  try {
    const data = await api(`/api/trips/${tripId}/items`);
    items.value = data.items || [];
    syncStatus.value = "已同步";
  } catch (error) {
    syncStatus.value = "同步失敗";
    authError.value = error.message || "載入清單失敗";
  }
};

const addTrip = async () => {
  if (!user.value || !newTrip.value.title.trim()) {
    return;
  }
  loadingTrip.value = true;
  try {
    await api("/api/trips", {
      method: "POST",
      body: JSON.stringify({
        title: newTrip.value.title.trim(),
        date: newTrip.value.date || null,
        location: newTrip.value.location.trim(),
        note: newTrip.value.note.trim(),
      }),
    });
    newTrip.value = { title: "", date: "", location: "", note: "" };
    await loadTrips();
  } catch (error) {
    authError.value = error.message || "新增行程失敗";
  } finally {
    loadingTrip.value = false;
  }
};

const selectTrip = (tripId) => {
  selectedTripId.value = tripId;
};

const clearSelection = () => {
  selectedTripId.value = null;
};

const syncEditTrip = (trip) => {
  editTrip.value = {
    title: trip?.title || "",
    date: trip?.date || "",
    location: trip?.location || "",
    note: trip?.note || "",
  };
};

const saveTripEdits = async () => {
  if (!selectedTripId.value || !canEdit.value) {
    return;
  }
  const payload = isOwner.value
    ? {
        title: editTrip.value.title.trim(),
        date: editTrip.value.date || null,
        location: editTrip.value.location.trim(),
        note: editTrip.value.note.trim(),
      }
    : { note: editTrip.value.note.trim() };
  try {
    await api(`/api/trips/${selectedTripId.value}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await loadTrips();
  } catch (error) {
    authError.value = error.message || "更新行程失敗";
  }
};

const addItem = async () => {
  if (!selectedTripId.value || !newItem.value.text.trim() || !canEdit.value) {
    return;
  }
  loadingItem.value = true;
  try {
    await api(`/api/trips/${selectedTripId.value}/items`, {
      method: "POST",
      body: JSON.stringify({
        text: newItem.value.text.trim(),
        note: newItem.value.note.trim(),
        category: newItem.value.category,
        qty: Number(newItem.value.qty) || 1,
        unit: newItem.value.unit.trim(),
      }),
    });
    newItem.value = { text: "", category: "", qty: 1, unit: "", note: "" };
    await loadItems(selectedTripId.value);
    await loadTrips();
  } catch (error) {
    authError.value = error.message || "新增項目失敗";
  } finally {
    loadingItem.value = false;
  }
};

const toggleCheck = async (item, field) => {
  if (!selectedTripId.value || !canEdit.value) {
    return;
  }
  try {
    await api(`/api/trips/${selectedTripId.value}/items/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: !item[field] }),
    });
    await loadItems(selectedTripId.value);
  } catch (error) {
    authError.value = error.message || "更新項目失敗";
  }
};

const updateNote = async (item, value) => {
  if (!selectedTripId.value || !canEdit.value) {
    return;
  }
  try {
    await api(`/api/trips/${selectedTripId.value}/items/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ note: value.trim() }),
    });
    await loadItems(selectedTripId.value);
  } catch (error) {
    authError.value = error.message || "更新備註失敗";
  }
};

const removeItem = async (item) => {
  if (!selectedTripId.value || !canEdit.value) {
    return;
  }
  try {
    await api(`/api/trips/${selectedTripId.value}/items/${item.id}`, {
      method: "DELETE",
    });
    await loadItems(selectedTripId.value);
    await loadTrips();
  } catch (error) {
    authError.value = error.message || "刪除項目失敗";
  }
};

const removeTrip = async () => {
  if (!selectedTripId.value || !isOwner.value) {
    return;
  }
  try {
    await api(`/api/trips/${selectedTripId.value}`, { method: "DELETE" });
    selectedTripId.value = null;
    await loadTrips();
  } catch (error) {
    authError.value = error.message || "刪除行程失敗";
  }
};

const inviteMember = async () => {
  if (!selectedTripId.value || !isOwner.value) {
    return;
  }
  const email = invite.value.email.trim().toLowerCase();
  if (!email) {
    return;
  }
  try {
    await api(`/api/trips/${selectedTripId.value}/invite`, {
      method: "POST",
      body: JSON.stringify({
        email,
        role: invite.value.role,
      }),
    });
    invite.value = { email: "", role: "editor" };
    await loadTrips();
  } catch (error) {
    authError.value = error.message || "邀請成員失敗";
  }
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("zh-TW");
};

watch(selectedTripId, (tripId) => {
  loadItems(tripId);
  syncEditTrip(trips.value.find((trip) => trip.id === tripId));
});

watch(trips, () => {
  if (selectedTripId.value) {
    syncEditTrip(trips.value.find((trip) => trip.id === selectedTripId.value));
  }
});

onMounted(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    authDiag.value.persistence = "local";
  } catch (error) {
    authDiag.value.persistence = "設定失敗";
  }

  const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      user.value = currentUser;
      syncStatus.value = "同步中…";
      authDiag.value.lastAuthState = "已登入";
      authDiag.value.lastAuthUid = currentUser.uid;
      authDiag.value.lastAuthEmail = currentUser.email || "無";
      await loadTrips();
    } else {
      user.value = null;
      trips.value = [];
      items.value = [];
      selectedTripId.value = null;
      syncStatus.value = "尚未登入";
      authDiag.value.lastAuthState = "未登入";
      authDiag.value.lastAuthUid = "無";
      authDiag.value.lastAuthEmail = "無";
    }
  });

  onUnmounted(() => {
    unsubscribeAuth();
  });
});

const handleSignIn = async () => {
  authBusy.value = true;
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    authDiag.value.lastSignInMethod = "popup";
    const result = await signInWithPopup(auth, provider);
    if (result?.user) {
      authStatus.value = "登入成功";
      authError.value = "";
    }
  } catch (error) {
    authError.value = `登入失敗：${error?.message || "未知錯誤"}`;
  } finally {
    authBusy.value = false;
  }
};

const handleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    authError.value = `登出失敗：${error?.message || "未知錯誤"}`;
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
};
</script>

<style scoped>
:root {
  color-scheme: light;
}

:global(body) {
  margin: 0;
}

.page {
  min-height: 100vh;
  background: radial-gradient(circle at top, #f2f6ff, #f9f7f1 55%, #f2efe6);
  padding: 40px 20px 60px;
  color: #1f2320;
  font-family: "Noto Sans TC", "Helvetica Neue", Arial, sans-serif;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto 28px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.8rem;
  color: #6c6f76;
  margin: 0 0 8px;
}

h1 {
  margin: 0 0 10px;
  font-size: clamp(2rem, 4vw, 3rem);
}

h2 {
  margin: 0 0 16px;
  font-size: 1.2rem;
}

h3 {
  margin: 0;
  font-size: 1rem;
}

.sub {
  margin: 0;
  color: #5b5f66;
}

.user {
  background: #ffffff;
  border-radius: 999px;
  padding: 10px 16px;
  box-shadow: 0 12px 30px rgba(31, 35, 32, 0.12);
  text-align: right;
}

.user .label {
  display: block;
  font-size: 0.75rem;
  color: #6c6f76;
}

.layout {
  display: grid;
  grid-template-columns: minmax(240px, 340px) minmax(0, 1fr);
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.theme-switch {
  max-width: 1200px;
  margin: 0 auto 16px;
  display: flex;
  justify-content: flex-end;
}

.status-bar {
  max-width: 1200px;
  margin: 0 auto 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1f3c88;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge.success {
  background: #e9f7ef;
  color: #19764b;
}

.badge.warn {
  background: #fff2e0;
  color: #9a5b0b;
}

.login {
  max-width: 520px;
  margin: 0 auto 20px;
  text-align: center;
  display: grid;
  gap: 12px;
}

.login button {
  justify-self: center;
}

.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 18px 40px rgba(22, 24, 22, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
}

.field {
  display: grid;
  gap: 6px;
}

label {
  font-size: 0.85rem;
  color: #5b5f66;
}

input,
select {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #d8dbe2;
  font-size: 0.95rem;
  font-family: inherit;
  background: #ffffff;
}

button {
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: #1f6feb;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.secondary {
  background: #eef2ff;
  color: #1f6feb;
}

.trip-list {
  display: grid;
  gap: 10px;
}

.trip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  background: #f5f7fb;
  border: 1px solid transparent;
  padding: 12px 14px;
  border-radius: 14px;
  cursor: pointer;
  width: 100%;
}

.trip strong {
  display: block;
  font-size: 0.95rem;
}

.trip span {
  display: block;
  font-size: 0.8rem;
  color: #6c6f76;
}

.trip .meta {
  font-size: 0.75rem;
  color: #1f6feb;
}

.trip.active {
  border-color: #1f6feb;
  background: #eaf1ff;
}

.list {
  display: grid;
  gap: 16px;
}

.group {
  display: grid;
  gap: 12px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #5b5f66;
}

.todo {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid #e4e7ee;
}

.todo-main {
  display: grid;
  gap: 8px;
}

.todo-main strong {
  font-size: 1rem;
}

.todo-main strong.done {
  text-decoration: line-through;
  color: #7b8088;
}

.todo-main .meta {
  font-size: 0.85rem;
  color: #7b8088;
  margin-left: 6px;
}

.note {
  width: 100%;
}

.todo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.ghost {
  background: transparent;
  border: none;
  color: #56607a;
  cursor: pointer;
  font-weight: 600;
}

.ghost.danger {
  color: #cf2f2f;
}

.empty {
  color: #7b8088;
  margin: 12px 0 0;
}

.muted {
  color: #7b8088;
  margin: 6px 0 0;
}

.trip-edit {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  background: #f7f9ff;
  margin-bottom: 18px;
}

.diag {
  max-width: 1200px;
  margin: 0 auto 16px;
}

.diag-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.diag-label {
  display: block;
  font-size: 0.8rem;
  color: #6c6f76;
  margin-bottom: 4px;
}

.share-panel {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  background: #f7f9ff;
  margin-bottom: 18px;
}

.member-list {
  display: grid;
  gap: 8px;
}

.member {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border-radius: 12px;
  padding: 8px 12px;
  border: 1px solid #e4e7ee;
}

.role-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1f6feb;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 8px;
}

.page.dark {
  background: radial-gradient(
      circle at 12% 8%,
      rgba(255, 145, 77, 0.18),
      transparent 45%
    ),
    radial-gradient(
      circle at 80% 12%,
      rgba(62, 107, 79, 0.35),
      transparent 52%
    ),
    linear-gradient(160deg, #0c100d, #131a14 60%, #0f1410);
  color: #f6f1e6;
  font-family: "Alegreya Sans", "Helvetica Neue", Arial, sans-serif;
}

.page.dark .hero {
  color: #f6f1e6;
}

.page.dark .eyebrow {
  color: rgba(246, 241, 230, 0.65);
  letter-spacing: 0.18em;
}

.page.dark h1 {
  font-family: "Bebas Neue", "Helvetica Neue", Arial, sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff6e8;
}

.page.dark .sub {
  color: rgba(246, 241, 230, 0.8);
}

.page.dark .user {
  background: rgba(246, 241, 230, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: none;
  backdrop-filter: blur(14px);
  color: #fff6e8;
}

.page.dark .user .label {
  color: rgba(246, 241, 230, 0.7);
}

.page.dark .badge {
  background: rgba(246, 241, 230, 0.2);
  color: rgba(246, 241, 230, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.page.dark .badge.success {
  background: rgba(255, 145, 77, 0.2);
  color: #ffe2c5;
}

.page.dark .badge.warn {
  background: rgba(255, 242, 213, 0.2);
  color: #ffe9c7;
}

.page.dark .card {
  background: #f6f1e6;
  color: #151815;
  box-shadow: 0 24px 60px rgba(15, 20, 16, 0.2);
}

.page.dark label {
  color: #2f3432;
}

.page.dark input,
.page.dark select {
  background: #fffdf7;
  border-color: #d6cec0;
}

.page.dark button {
  background: #ff914d;
  color: #1d120a;
  box-shadow: 0 12px 30px rgba(255, 145, 77, 0.28);
}

.page.dark button.secondary {
  background: rgba(62, 107, 79, 0.15);
  color: #234332;
}

.page.dark .trip {
  background: #fffaf2;
}

.page.dark .trip .meta {
  color: #234332;
}

.page.dark .trip.active {
  border-color: #ff914d;
  background: #fff7e8;
}

.page.dark .todo {
  background: #fffaf2;
  border-color: #d6cec0;
}

.page.dark .ghost {
  color: #2d5a3f;
}

.page.dark .ghost.danger {
  color: #b54a3a;
}

.page.dark .share-panel {
  background: #fffaf2;
}

.page.dark .member {
  background: #fffdf7;
}

.page.dark .role-tag {
  background: rgba(255, 145, 77, 0.2);
  color: #8a4a21;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .page.dark .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
