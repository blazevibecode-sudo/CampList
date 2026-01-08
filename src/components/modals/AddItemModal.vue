<template>
  <div v-if="open" class="modal-overlay">
    <div class="modal">
      <div class="card-header">
        <h3>{{ title }}</h3>
        <button class="ghost" type="button" @click="emit('close')">關閉</button>
      </div>
      <form class="form" @submit.prevent="emit('submit')">
        <div class="field">
          <label for="item-text">項目</label>
          <select
            id="item-text"
            v-model="model.text"
            required
            :disabled="!canEdit || !selectOptions.length"
          >
            <option value="" disabled>請選擇</option>
            <option v-for="option in selectOptions" :key="option.id" :value="option.name">
              {{ option.name }}
            </option>
          </select>
          <p v-if="!selectOptions.length" class="hint">
            請先在下方勾選下拉選項，或新增新選項。
          </p>
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
        <button type="submit" :disabled="loading || !canEdit">{{ submitLabel }}</button>
      </form>

      <section class="catalog-panel">
        <div class="panel-header">
          <h4>下拉選單內容</h4>
        </div>
        <div class="catalog-add">
          <input
            v-model="newOption"
            type="text"
            placeholder="新增選項"
            :disabled="!canEdit"
          />
          <button
            type="button"
            class="secondary"
            :disabled="!canEdit"
            @click="handleCreate"
          >
            加入
          </button>
        </div>
        <div class="catalog-list">
          <div v-for="option in catalogItems" :key="option.id" class="catalog-row">
            <label class="catalog-check">
              <input
                type="checkbox"
                :checked="isAllowed(option.id)"
                :disabled="!canEdit"
                @change="emit('toggle-allowed', option.id, $event.target.checked)"
              />
              <span v-if="editingId !== option.id">{{ option.name }}</span>
            </label>
            <div v-if="editingId === option.id" class="catalog-edit">
              <input v-model="editingName" type="text" :disabled="!canEdit" />
              <button type="button" class="ghost" @click="handleRename(option.id)">
                儲存
              </button>
              <button type="button" class="ghost" @click="cancelEdit">取消</button>
            </div>
            <div v-else class="catalog-actions">
              <button type="button" class="ghost" :disabled="!canEdit" @click="startEdit(option)">
                編輯
              </button>
              <button
                type="button"
                class="ghost danger"
                :disabled="!canEdit"
                @click="emit('delete-catalog', option.id)"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const model = defineModel("item", { type: Object, required: true });

const props = defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  catalogItems: { type: Array, default: () => [] },
  allowedCatalogIds: { type: Array, default: () => [] },
  mode: { type: String, default: "add" },
});

const emit = defineEmits([
  "close",
  "submit",
  "toggle-allowed",
  "create-catalog",
  "rename-catalog",
  "delete-catalog",
]);

const newOption = ref("");
const editingId = ref(null);
const editingName = ref("");

const title = computed(() => (props.mode === "edit" ? "編輯項目" : "新增項目"));
const submitLabel = computed(() =>
  props.mode === "edit" ? "更新項目" : "新增項目"
);

const effectiveAllowedIds = computed(() => {
  if (props.allowedCatalogIds.length) {
    return props.allowedCatalogIds;
  }
  return props.catalogItems.map((item) => item.id);
});

const selectOptions = computed(() => {
  const list = props.catalogItems.filter((item) =>
    effectiveAllowedIds.value.includes(item.id)
  );
  if (model.value?.text && !list.some((item) => item.name === model.value.text)) {
    return [{ id: "__custom", name: model.value.text }, ...list];
  }
  return list;
});

const isAllowed = (catalogId) =>
  effectiveAllowedIds.value.includes(catalogId);

const handleCreate = () => {
  const value = newOption.value.trim();
  if (!value) {
    return;
  }
  emit("create-catalog", value);
  newOption.value = "";
};

const startEdit = (option) => {
  editingId.value = option.id;
  editingName.value = option.name;
};

const cancelEdit = () => {
  editingId.value = null;
  editingName.value = "";
};

const handleRename = (catalogId) => {
  const value = editingName.value.trim();
  if (!value) {
    return;
  }
  emit("rename-catalog", catalogId, value);
  cancelEdit();
};
</script>
