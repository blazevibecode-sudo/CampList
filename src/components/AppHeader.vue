<template>
  <header class="hero">
    <div>
      <p class="eyebrow">坎泊吐給樂</p>
      <h1>坎泊紀錄</h1>
      <p class="sub">鬥陣去坎泊</p>
    </div>
    <div class="user" v-if="user">
      <span class="label">you are</span>
      <strong>{{ user.displayName || user.email || user.uid.slice(0, 8) }}</strong>
      <span v-if="currentRole" class="role-tag">{{ roleLabel }}</span>
      <button class="ghost" type="button" @click="onSignOut">登出</button>
    </div>
  </header>
</template>

<script setup>
const props = defineProps({
  user: { type: Object, default: null },
  currentRole: { type: String, default: "" },
  roleLabel: { type: String, default: "" },
});

const emit = defineEmits(["sign-out"]);

const onSignOut = () => {
  emit("sign-out");
};
</script>
