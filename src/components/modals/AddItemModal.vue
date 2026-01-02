<template>
  <div v-if="open" class="modal-overlay">
    <div class="modal">
      <div class="card-header">
        <h3>新增項目</h3>
        <button class="ghost" type="button" @click="emit('close')">關閉</button>
      </div>
      <form class="form" @submit.prevent="emit('submit')">
        <div class="field">
          <label for="item-text">項目</label>
          <input
            id="item-text"
            v-model="model.text"
            type="text"
            placeholder="例如：帳篷、保暖毯"
            required
            :disabled="!canEdit"
          />
        </div>
        <div class="field">
          <label for="item-category">分類</label>
          <select id="item-category" v-model="model.category" :disabled="!canEdit">
            <option value="">未分類</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="item-qty">數量</label>
          <input id="item-qty" v-model="model.qty" type="number" min="1" :disabled="!canEdit" />
        </div>
        <div class="field">
          <label for="item-unit">單位</label>
          <input
            id="item-unit"
            v-model="model.unit"
            type="text"
            placeholder="例如：個、組"
            :disabled="!canEdit"
          />
        </div>
        <div class="field">
          <label for="item-note">備註</label>
          <input
            id="item-note"
            v-model="model.note"
            type="text"
            placeholder="選填：尺寸、數量、提醒"
            :disabled="!canEdit"
          />
        </div>
        <button type="submit" :disabled="loading || !canEdit">新增項目</button>
      </form>
    </div>
  </div>
</template>

<script setup>
const model = defineModel("item", { type: Object, required: true });

defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
});

const emit = defineEmits(["close", "submit"]);
</script>
