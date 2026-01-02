import { onMounted, onUnmounted, ref } from "vue";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

export const useAuth = () => {
  const user = ref(null);
  const authBusy = ref(false);
  const authStatus = ref("");
  const authError = ref("");
  const showDiag = ref(false);
  const authDiag = ref({
    persistence: "未設定",
    lastAuthState: "尚未觸發",
    lastAuthUid: "無",
    lastAuthEmail: "無",
    redirectResult: "停用",
    redirectProvider: "停用",
    redirectEmail: "停用",
    lastSignInMethod: "無",
    origin: window.location.origin,
    authDomain: auth?.app?.options?.authDomain || "未知",
  });

  const signIn = async () => {
    authBusy.value = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      authDiag.value.lastSignInMethod = "popup";
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        authStatus.value = "登入成功";
        authError.value = "";
      }
    } catch (error) {
      authError.value = `登入失敗：${error?.message || "未知錯誤"}`;
    } finally {
      authBusy.value = false;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      authError.value = `登出失敗：${error?.message || "未知錯誤"}`;
    }
  };

  onMounted(async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      authDiag.value.persistence = "local";
    } catch (error) {
      authDiag.value.persistence = "設定失敗";
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        user.value = currentUser;
        authDiag.value.lastAuthState = "已登入";
        authDiag.value.lastAuthUid = currentUser.uid;
        authDiag.value.lastAuthEmail = currentUser.email || "無";
      } else {
        user.value = null;
        authDiag.value.lastAuthState = "未登入";
        authDiag.value.lastAuthUid = "無";
        authDiag.value.lastAuthEmail = "無";
      }
    });

    onUnmounted(() => {
      unsubscribeAuth();
    });
  });

  return {
    user,
    authBusy,
    authStatus,
    authError,
    authDiag,
    showDiag,
    signIn,
    signOutUser,
  };
};
