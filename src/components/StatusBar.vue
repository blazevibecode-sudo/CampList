<template>
  <section class="status-bar">
    <span class="badge success" v-if="user">登入成功</span>
    <span class="badge" :class="{ warn: syncStatus !== '已同步' }" v-if="user">
      {{ syncStatus }}
    </span>
    <span class="badge" v-if="authStatus">{{ authStatus }}</span>
    <span class="badge warn" v-if="error">{{ error }}</span>
    <button class="ghost" type="button" @click="emit('toggle-diag')">
      {{ showDiag ? "關閉診斷" : "登入診斷" }}
    </button>
  </section>
</template>

<script setup>
defineProps({
  user: { type: Object, default: null },
  syncStatus: { type: String, default: "" },
  authStatus: { type: String, default: "" },
  error: { type: String, default: "" },
  showDiag: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle-diag"]);
</script>
