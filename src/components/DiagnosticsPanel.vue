<template>
  <section class="card diag">
    <h3>登入診斷</h3>
    <p class="muted">這些資訊只在本機顯示，不會寫入資料庫。</p>
    <div class="diag-grid">
      <div>
        <span class="diag-label">Auth 狀態</span>
        <strong>{{ user ? "已登入" : "未登入" }}</strong>
      </div>
      <div>
        <span class="diag-label">使用者 Email</span>
        <strong>{{ currentEmail || "無" }}</strong>
      </div>
      <div>
        <span class="diag-label">Auth UID</span>
        <strong>{{ user?.uid || "無" }}</strong>
      </div>
      <div>
        <span class="diag-label">持久化</span>
        <strong>{{ authDiag.persistence }}</strong>
      </div>
      <div>
        <span class="diag-label">最後登入方式</span>
        <strong>{{ authDiag.lastSignInMethod }}</strong>
      </div>
      <div>
        <span class="diag-label">Redirect 結果</span>
        <strong>{{ authDiag.redirectResult }}</strong>
      </div>
      <div>
        <span class="diag-label">Redirect Provider</span>
        <strong>{{ authDiag.redirectProvider }}</strong>
      </div>
      <div>
        <span class="diag-label">Redirect Email</span>
        <strong>{{ authDiag.redirectEmail }}</strong>
      </div>
      <div>
        <span class="diag-label">Auth Domain</span>
        <strong>{{ authDiag.authDomain }}</strong>
      </div>
      <div>
        <span class="diag-label">Origin</span>
        <strong>{{ authDiag.origin }}</strong>
      </div>
      <div>
        <span class="diag-label">Auth 狀態變化</span>
        <strong>{{ authDiag.lastAuthState }}</strong>
      </div>
      <div>
        <span class="diag-label">登入狀態訊息</span>
        <strong>{{ authStatus || "無" }}</strong>
      </div>
      <div>
        <span class="diag-label">錯誤訊息</span>
        <strong>{{ error || "無" }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  user: { type: Object, default: null },
  currentEmail: { type: String, default: "" },
  authDiag: { type: Object, required: true },
  authStatus: { type: String, default: "" },
  error: { type: String, default: "" },
});
</script>
