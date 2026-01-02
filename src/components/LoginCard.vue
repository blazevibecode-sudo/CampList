<template>
  <section class="card login">
    <h2>使用 Google 登入</h2>
    <p class="muted">登入後才能存取自己的露營行程與清單。</p>
    <button type="button" @click="emit('sign-in')" :disabled="authBusy">
      Google 登入
    </button>
  </section>
</template>

<script setup>
defineProps({
  authBusy: { type: Boolean, default: false },
});

const emit = defineEmits(["sign-in"]);
</script>
