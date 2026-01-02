<template>
  <div class="page" :class="{ dark: isDark }">
    <AppHeader
      :user="user"
      :current-role="currentRole"
      :role-label="roleLabel"
      @sign-out="signOutUser"
    />

    <ThemeSwitch :is-dark="isDark" @toggle="toggleTheme" />

    <StatusBar
      :user="user"
      :sync-status="syncStatus"
      :auth-status="authStatus"
      :error="statusError"
      :show-diag="showDiag"
      @toggle-diag="showDiag = !showDiag"
    />

    <DiagnosticsPanel
      v-if="showDiag"
      :user="user"
      :current-email="currentEmail"
      :auth-diag="authDiag"
      :auth-status="authStatus"
      :error="statusError"
    />

    <LoginCard v-if="!user" :auth-busy="authBusy" @sign-in="signIn" />

    <main v-else class="single">
      <TripsListView
        v-if="view === 'trips'"
        :trips="trips"
        :selected-trip-id="selectedTripId"
        :trip-avatars="tripAvatars"
        :is-owner-for-trip="isOwnerForTrip"
        :format-date="formatDate"
        @select="handleSelectTrip"
        @new-trip="goToNewTrip"
        @share="openShareForTrip"
        @confirm-delete="confirmDelete"
      />

      <NewTripView
        v-if="view === 'newTrip'"
        v-model:trip="newTrip"
        :loading="loadingTrip"
        @submit="handleAddTrip"
        @back="goToTrips"
      />

      <ChecklistView
        v-if="view === 'checklist'"
        :selected-trip="selectedTrip"
        :selected-trip-id="selectedTripId"
        :grouped-items="groupedItems"
        :can-edit="canEdit"
        :format-date="formatDate"
        @back="goToTrips"
        @edit-trip="showEditTripModal = true"
        @add-item="showAddItemModal = true"
        @toggle-check="toggleCheck"
        @update-note="updateNote"
        @remove-item="removeItem"
      />
    </main>

    <EditTripModal
      v-model:trip="editTrip"
      :open="showEditTripModal"
      :is-owner="isOwner"
      :can-edit="canEdit"
      @close="showEditTripModal = false"
      @save="saveTripEdits"
    />

    <AddItemModal
      v-model:item="newItem"
      :open="showAddItemModal"
      :loading="loadingItem"
      :can-edit="canEdit"
      :categories="categories"
      @close="showAddItemModal = false"
      @submit="addItem"
    />

    <ShareModal
      v-model:invite="invite"
      :open="showShareModal"
      :selected-trip="selectedTrip"
      :member-list="memberList"
      :is-owner="isOwner"
      @close="showShareModal = false"
      @invite="inviteMember"
    />

    <ConfirmDeleteModal
      :open="Boolean(confirmDeleteTripId)"
      @close="confirmDeleteTripId = null"
      @confirm="performDeleteTrip"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "./composables/useAuth";
import { useTrips } from "./composables/useTrips";
import AppHeader from "./components/AppHeader.vue";
import ThemeSwitch from "./components/ThemeSwitch.vue";
import StatusBar from "./components/StatusBar.vue";
import DiagnosticsPanel from "./components/DiagnosticsPanel.vue";
import LoginCard from "./components/LoginCard.vue";
import TripsListView from "./views/TripsListView.vue";
import NewTripView from "./views/NewTripView.vue";
import ChecklistView from "./views/ChecklistView.vue";
import EditTripModal from "./components/modals/EditTripModal.vue";
import AddItemModal from "./components/modals/AddItemModal.vue";
import ShareModal from "./components/modals/ShareModal.vue";
import ConfirmDeleteModal from "./components/modals/ConfirmDeleteModal.vue";

const isDark = ref(false);
const toggleTheme = () => {
  isDark.value = !isDark.value;
};

const router = useRouter();
const route = useRoute();

const {
  user,
  authBusy,
  authStatus,
  authError,
  authDiag,
  showDiag,
  signIn,
  signOutUser,
} = useAuth();

const {
  trips,
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
  loadItems,
  addTrip,
  selectTrip,
  saveTripEdits,
  addItem,
  toggleCheck,
  updateNote,
  removeItem,
  inviteMember,
  formatDate,
  openShareForTrip,
  confirmDelete,
  performDeleteTrip,
  tripAvatars,
  isOwnerForTrip,
} = useTrips(user);

const view = computed(() => {
  if (route.name === "newTrip") {
    return "newTrip";
  }
  if (route.name === "checklist") {
    return "checklist";
  }
  return "trips";
});

const goToTrips = () => {
  router.push({ name: "trips" });
};

const goToNewTrip = () => {
  router.push({ name: "newTrip" });
};

const handleSelectTrip = async (tripId) => {
  selectTrip(tripId);
  await loadItems(tripId);
  router.push({ name: "checklist", params: { tripId } });
};

const handleAddTrip = async () => {
  await addTrip();
  if (selectedTripId.value) {
    router.replace({
      name: "checklist",
      params: { tripId: selectedTripId.value },
    });
  }
};

watch(
  () => [route.name, route.params.tripId, user.value],
  async ([routeName, tripId, currentUser]) => {
    if (!currentUser || routeName !== "checklist") {
      return;
    }
    if (!tripId) {
      return;
    }
    if (tripId !== selectedTripId.value) {
      selectTrip(tripId);
    }
    await loadItems(tripId);
  },
  { immediate: true }
);

const statusError = computed(() => authError.value || dataError.value);
</script>
