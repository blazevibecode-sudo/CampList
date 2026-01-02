import { computed, ref, watch } from "vue";
import { createApi } from "../services/api";

export const useTrips = (user) => {
  const trips = ref([]);
  const items = ref([]);
  const selectedTripId = ref(null);
  const loadingTrip = ref(false);
  const loadingItem = ref(false);
  const syncStatus = ref("尚未登入");
  const dataError = ref("");

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

  const showAddItemModal = ref(false);
  const showEditTripModal = ref(false);
  const showShareModal = ref(false);
  const confirmDeleteTripId = ref(null);

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
      initial: String(email || "?").trim().charAt(0).toUpperCase(),
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

  const api = createApi(user);

  const loadTrips = async () => {
    if (!user.value) {
      return;
    }
    syncStatus.value = "同步中…";
    try {
      const data = await api.getTrips();
      trips.value = data.trips || [];
      syncStatus.value = "已同步";
      if (!selectedTripId.value && trips.value.length) {
        selectedTripId.value = trips.value[0].id;
      }
      if (selectedTripId.value) {
        const exists = trips.value.some(
          (trip) => trip.id === selectedTripId.value
        );
        if (!exists) {
          selectedTripId.value = null;
        }
      }
    } catch (error) {
      syncStatus.value = "同步失敗";
      dataError.value = error.message || "載入行程失敗";
    }
  };

  const loadItems = async (tripId) => {
    if (!user.value || !tripId) {
      items.value = [];
      return;
    }
    syncStatus.value = "同步中…";
    try {
      const data = await api.getItems(tripId);
      items.value = data.items || [];
      syncStatus.value = "已同步";
    } catch (error) {
      syncStatus.value = "同步失敗";
      dataError.value = error.message || "載入清單失敗";
    }
  };

  const addTrip = async () => {
    if (!user.value || !newTrip.value.title.trim()) {
      return;
    }
    loadingTrip.value = true;
    try {
      const result = await api.createTrip({
        title: newTrip.value.title.trim(),
        date: newTrip.value.date || null,
        location: newTrip.value.location.trim(),
        note: newTrip.value.note.trim(),
      });
      newTrip.value = { title: "", date: "", location: "", note: "" };
      await loadTrips();
      if (result?.id) {
        selectedTripId.value = result.id;
        showShareModal.value = false;
      }
    } catch (error) {
      dataError.value = error.message || "新增行程失敗";
    } finally {
      loadingTrip.value = false;
    }
  };

  const selectTrip = (tripId) => {
    selectedTripId.value = tripId;
    showShareModal.value = false;
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
      await api.updateTrip(selectedTripId.value, payload);
      await loadTrips();
      showEditTripModal.value = false;
    } catch (error) {
      dataError.value = error.message || "更新行程失敗";
    }
  };

  const addItem = async () => {
    if (!selectedTripId.value || !newItem.value.text.trim() || !canEdit.value) {
      return;
    }
    loadingItem.value = true;
    try {
      await api.createItem(selectedTripId.value, {
        text: newItem.value.text.trim(),
        note: newItem.value.note.trim(),
        category: newItem.value.category,
        qty: Number(newItem.value.qty) || 1,
        unit: newItem.value.unit.trim(),
      });
      newItem.value = { text: "", category: "", qty: 1, unit: "", note: "" };
      await loadItems(selectedTripId.value);
      await loadTrips();
      showAddItemModal.value = false;
    } catch (error) {
      dataError.value = error.message || "新增項目失敗";
    } finally {
      loadingItem.value = false;
    }
  };

  const toggleCheck = async (item, field) => {
    if (!selectedTripId.value || !canEdit.value) {
      return;
    }
    try {
      await api.updateItem(selectedTripId.value, item.id, {
        [field]: !item[field],
      });
      await loadItems(selectedTripId.value);
    } catch (error) {
      dataError.value = error.message || "更新項目失敗";
    }
  };

  const updateNote = async (item, value) => {
    if (!selectedTripId.value || !canEdit.value) {
      return;
    }
    try {
      await api.updateItem(selectedTripId.value, item.id, {
        note: value.trim(),
      });
      await loadItems(selectedTripId.value);
    } catch (error) {
      dataError.value = error.message || "更新備註失敗";
    }
  };

  const removeItem = async (item) => {
    if (!selectedTripId.value || !canEdit.value) {
      return;
    }
    try {
      await api.deleteItem(selectedTripId.value, item.id);
      await loadItems(selectedTripId.value);
      await loadTrips();
    } catch (error) {
      dataError.value = error.message || "刪除項目失敗";
    }
  };

  const removeTrip = async () => {
    if (!selectedTripId.value || !isOwner.value) {
      return;
    }
    try {
      await api.deleteTrip(selectedTripId.value);
      selectedTripId.value = null;
      await loadTrips();
    } catch (error) {
      dataError.value = error.message || "刪除行程失敗";
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
      await api.inviteMember(selectedTripId.value, {
        email,
        role: invite.value.role,
      });
      invite.value = { email: "", role: "editor" };
      await loadTrips();
    } catch (error) {
      dataError.value = error.message || "邀請成員失敗";
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

  const openShareForTrip = (tripId) => {
    selectedTripId.value = tripId;
    showShareModal.value = true;
  };

  const confirmDelete = (tripId) => {
    confirmDeleteTripId.value = tripId;
  };

  const performDeleteTrip = async () => {
    if (!confirmDeleteTripId.value) {
      return;
    }
    try {
      await api.deleteTrip(confirmDeleteTripId.value);
      if (selectedTripId.value === confirmDeleteTripId.value) {
        selectedTripId.value = null;
      }
      confirmDeleteTripId.value = null;
      await loadTrips();
    } catch (error) {
      dataError.value = error.message || "刪除行程失敗";
    }
  };

  const tripAvatars = (trip) => {
    const emails = Object.keys(trip.memberRoles || {}).length
      ? Object.keys(trip.memberRoles || {})
      : trip.memberEmails || [];
    const unique = Array.from(new Set(emails));
    const limit = 3;
    const list = unique.slice(0, limit).map((email) => ({
      key: email,
      email,
      initial: String(email || "?").trim().charAt(0).toUpperCase(),
    }));
    const extra = unique.length - limit;
    if (extra > 0) {
      list.push({
        key: `extra-${extra}`,
        email: `+${extra}`,
        initial: `+${extra}`,
      });
    }
    return list;
  };

  const isOwnerForTrip = (trip) => {
    if (!currentEmail.value) {
      return false;
    }
    return trip.memberRoles?.[currentEmail.value] === "owner";
  };

  watch(selectedTripId, (tripId) => {
    syncEditTrip(trips.value.find((trip) => trip.id === tripId));
  });

  watch(trips, () => {
    if (selectedTripId.value) {
      syncEditTrip(trips.value.find((trip) => trip.id === selectedTripId.value));
    }
  });

  watch(
    user,
    async (currentUser) => {
      if (currentUser) {
        syncStatus.value = "同步中…";
        await loadTrips();
      } else {
        trips.value = [];
        items.value = [];
        selectedTripId.value = null;
        syncStatus.value = "尚未登入";
      }
    },
    { immediate: true }
  );

  return {
    trips,
    items,
    selectedTripId,
    loadingTrip,
    loadingItem,
    syncStatus,
    dataError,
    newTrip,
    editTrip,
    newItem,
    invite,
    showAddItemModal,
    showEditTripModal,
    showShareModal,
    confirmDeleteTripId,
    categories,
    selectedTrip,
    currentEmail,
    currentRole,
    roleLabel,
    isOwner,
    canEdit,
    memberList,
    groupedItems,
    loadTrips,
    loadItems,
    addTrip,
    selectTrip,
    clearSelection,
    saveTripEdits,
    addItem,
    toggleCheck,
    updateNote,
    removeItem,
    removeTrip,
    inviteMember,
    formatDate,
    openShareForTrip,
    confirmDelete,
    performDeleteTrip,
    tripAvatars,
    isOwnerForTrip,
  };
};
