<template>
  <section class="card">
    <div class="card-header">
      <h2>露營行程列表</h2>
      <button class="ghost" type="button" @click="emit('new-trip')">
        新增行程
      </button>
    </div>
    <div class="trip-list" v-if="trips.length">
      <div
        v-for="trip in trips"
        :key="trip.id"
        class="trip-card"
        :class="{ active: trip.id === selectedTripId }"
      >
        <button class="trip-main" type="button" @click="emit('select', trip.id)">
          <div>
            <strong>{{ trip.title }}</strong>
            <span v-if="trip.date">{{ formatDate(trip.date) }}</span>
            <span v-if="trip.location">{{ trip.location }}</span>
          </div>
          <span class="meta">{{ trip.itemsCount || 0 }} 項</span>
        </button>
        <div class="trip-avatars">
          <span
            v-for="member in tripAvatars(trip)"
            :key="member.key"
            class="avatar"
            :title="member.email"
          >
            {{ member.initial }}
          </span>
        </div>
        <button
          v-if="isOwnerForTrip(trip)"
          class="icon-button danger"
          type="button"
          aria-label="刪除行程"
          @click.stop="emit('confirm-delete', trip.id)"
        >
          <img
            class="icon-img"
            src="https://img.icons8.com/?size=100&id=99961&format=png&color=FA5252"
            alt="刪除"
          />
        </button>
        <button
          class="icon-button"
          type="button"
          aria-label="分享行程"
          @click.stop="emit('share', trip.id)"
        >
          <img
            class="icon-img"
            src="https://img.icons8.com/?size=100&id=98959&format=png&color=000000"
            alt="分享"
          />
        </button>
      </div>
    </div>
    <p v-else class="empty">尚無行程，先新增一筆吧。</p>
  </section>
</template>

<script setup>
defineProps({
  trips: { type: Array, default: () => [] },
  selectedTripId: { type: String, default: null },
  tripAvatars: { type: Function, required: true },
  isOwnerForTrip: { type: Function, required: true },
  formatDate: { type: Function, required: true },
});

const emit = defineEmits(["select", "new-trip", "share", "confirm-delete"]);
</script>
