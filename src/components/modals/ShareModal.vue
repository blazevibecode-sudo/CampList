<template>
  <div v-if="open" class="modal-overlay">
    <div class="modal">
      <div class="card-header">
        <h3>分享與協作</h3>
        <button class="ghost" type="button" @click="emit('close')">關閉</button>
      </div>
      <div class="share-panel">
        <span class="muted" v-if="selectedTrip">
          擁有者：{{ selectedTrip.ownerEmail || selectedTrip.ownerUid }}
        </span>
        <form class="form" @submit.prevent="emit('invite')" v-if="isOwner">
          <div class="field">
            <label for="invite-email">Email</label>
            <input
              id="invite-email"
              v-model="invite.email"
              type="email"
              placeholder="請輸入對方的 Google Email"
              required
            />
          </div>
          <div class="field">
            <label for="invite-role">權限</label>
            <select id="invite-role" v-model="invite.role">
              <option value="editor">可編輯</option>
              <option value="viewer">只可閱讀</option>
            </select>
          </div>
          <button type="submit" :disabled="!isOwner">送出邀請</button>
        </form>
        <p v-else class="muted">只有擁有者可以邀請成員。</p>
        <div class="member-list" v-if="memberList.length">
          <div v-for="member in memberList" :key="member.email" class="member">
            <div class="avatar">{{ member.initial }}</div>
            <div class="member-info">
              <strong>{{ member.email }}</strong>
              <span class="meta">{{ member.roleLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const invite = defineModel("invite", { type: Object, required: true });

defineProps({
  open: { type: Boolean, default: false },
  selectedTrip: { type: Object, default: null },
  memberList: { type: Array, default: () => [] },
  isOwner: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "invite"]);
</script>
