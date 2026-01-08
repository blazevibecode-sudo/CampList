<template>
  <section class="card">
    <div class="card-header">
      <div>
        <div class="title-row">
          <h2>Checklist</h2>
          <div class="actions">
            <button
              class="icon-button"
              type="button"
              aria-label="回到列表"
              @click="emit('back')"
            >
              🔙
            </button>
            <button
              class="icon-button"
              type="button"
              aria-label="更新行程資訊"
              @click="emit('edit-trip')"
              :disabled="!canEdit"
            >
              ✎
            </button>
            <button
              class="icon-button"
              type="button"
              aria-label="新增項目"
              @click="emit('add-item')"
              :disabled="!canEdit"
            >
              +
            </button>
          </div>
        </div>
        <p v-if="selectedTrip" class="muted">
          {{ selectedTrip.title }}
          <span v-if="selectedTrip.date">・{{ formatDate(selectedTrip.date) }}</span>
          <span v-if="selectedTrip.location">・{{ selectedTrip.location }}</span>
        </p>
      </div>
    </div>

    <div v-if="!selectedTripId" class="empty">請先選擇一個行程。</div>

    <div v-else>
      <div class="trip-info" v-if="selectedTrip?.note">
        <div>
          <span class="info-label">備註</span>
          <strong>{{ selectedTrip.note }}</strong>
        </div>
      </div>

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
              <p v-if="item.note" class="note-text">
                {{ item.note }}
              </p>
            </div>
            <div class="todo-actions">
              <label class="check">
                <input
                  type="checkbox"
                  :checked="item.goChecked"
                  :disabled="!canEdit"
                  @change="emit('toggle-check', item, 'goChecked')"
                />
                <span>去程</span>
              </label>
              <label class="check">
                <input
                  type="checkbox"
                  :checked="item.returnChecked"
                  :disabled="!canEdit"
                  @change="emit('toggle-check', item, 'returnChecked')"
                />
                <span>回程</span>
              </label>
              <button class="ghost" @click="emit('edit-item', item)" :disabled="!canEdit">
                編輯
              </button>
              <button class="ghost" @click="emit('remove-item', item)" :disabled="!canEdit">
                刪除
              </button>
            </div>
          </article>
        </section>
      </div>
      <p v-else class="empty">這個行程還沒有項目。</p>
    </div>
  </section>
</template>

<script setup>
defineProps({
  selectedTrip: { type: Object, default: null },
  selectedTripId: { type: String, default: null },
  groupedItems: { type: Array, default: () => [] },
  canEdit: { type: Boolean, default: false },
  formatDate: { type: Function, required: true },
});

const emit = defineEmits([
  "back",
  "edit-trip",
  "add-item",
  "toggle-check",
  "update-note",
  "edit-item",
  "remove-item",
]);
</script>
