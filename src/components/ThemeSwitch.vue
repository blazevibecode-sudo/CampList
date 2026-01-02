<template>
  <section class="theme-switch">
    <button class="ghost" type="button" @click="emit('toggle')">
      {{ isDark ? "切換亮色" : "切換深色" }}
    </button>
  </section>
</template>

<script setup>
defineProps({
  isDark: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle"]);
</script>
