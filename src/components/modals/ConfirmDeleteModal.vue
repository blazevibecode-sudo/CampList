<template>
  <div v-if="open" class="modal-overlay">
    <div class="modal">
      <div class="card-header">
        <h3>刪除行程</h3>
        <button class="ghost" type="button" @click="emit('close')">關閉</button>
      </div>
      <p class="muted">確定要刪除此行程？刪除後無法復原。</p>
      <div class="actions">
        <button class="ghost" type="button" @click="emit('close')">
          取消
        </button>
        <button class="ghost danger" type="button" @click="emit('confirm')">
          確認刪除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "confirm"]);
</script>
