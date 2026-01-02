<template>
  <section class="card">
    <div class="card-header">
      <h2>新增行程</h2>
      <button class="ghost" type="button" @click="emit('back')">
        返回列表
      </button>
    </div>
    <form class="form" @submit.prevent="emit('submit')">
      <div class="field">
        <label for="trip-title">行程名稱</label>
        <input
          id="trip-title"
          v-model="trip.title"
          type="text"
          placeholder="例如：南投兩天一夜"
          required
        />
      </div>
      <div class="field">
        <label for="trip-date">出發日期</label>
        <input id="trip-date" v-model="trip.date" type="date" />
      </div>
      <div class="field">
        <label for="trip-location">地點</label>
        <input
          id="trip-location"
          v-model="trip.location"
          type="text"
          placeholder="例如：溪頭"
        />
      </div>
      <div class="field">
        <label for="trip-note">行程備註</label>
        <input
          id="trip-note"
          v-model="trip.note"
          type="text"
          placeholder="選填：集合時間、車位"
        />
      </div>
      <button type="submit" :disabled="loading">建立行程</button>
    </form>
  </section>
</template>

<script setup>
const trip = defineModel("trip", { type: Object, required: true });

defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["submit", "back"]);
</script>
