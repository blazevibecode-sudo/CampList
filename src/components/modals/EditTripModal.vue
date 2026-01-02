<template>
  <div v-if="open" class="modal-overlay">
    <div class="modal">
      <div class="card-header">
        <h3>更新行程資訊</h3>
        <button class="ghost" type="button" @click="emit('close')">關閉</button>
      </div>
      <div class="trip-edit" v-if="isOwner">
        <div class="field">
          <label for="edit-title">行程名稱</label>
          <input id="edit-title" v-model="model.title" type="text" />
        </div>
        <div class="field">
          <label for="edit-date">出發日期</label>
          <input id="edit-date" v-model="model.date" type="date" />
        </div>
        <div class="field">
          <label for="edit-location">地點</label>
          <input id="edit-location" v-model="model.location" type="text" />
        </div>
        <div class="field">
          <label for="edit-note">行程備註</label>
          <input id="edit-note" v-model="model.note" type="text" />
        </div>
        <button class="secondary" @click="emit('save')" :disabled="!canEdit">
          更新行程資訊
        </button>
      </div>
      <div class="trip-edit" v-else>
        <div class="field">
          <label for="edit-note-only">行程備註</label>
          <input id="edit-note-only" v-model="model.note" type="text" :disabled="!canEdit" />
        </div>
        <button class="secondary" @click="emit('save')" :disabled="!canEdit">
          更新備註
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const model = defineModel("trip", { type: Object, required: true });

defineProps({
  open: { type: Boolean, default: false },
  isOwner: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "save"]);
</script>
