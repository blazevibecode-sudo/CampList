# Checklist Web App

A camping checklist web app built with Vue 3 + Vite, using Firebase Anonymous Auth and Firestore realtime updates.

## 1) Firebase 設定

1. 到 Firebase Console 建立專案。
2. 在「Authentication」啟用 **Anonymous**。
3. 建立 Firestore Database（建議使用 **Production** 模式）。
4. 建立 Web App 並取得 `firebaseConfig`（前端只用於 Auth）。
5. 將 `src/firebase.js` 內的 `firebaseConfig` 替換為你的專案設定。
6. 建立 **Service Account** 供後端使用（Firebase Admin）。

取得 Service Account JSON：
1. Firebase Console → 專案設定 → 服務帳戶
2. 產生新的私密金鑰並下載 JSON
3. 將整段 JSON 內容貼到 Netlify 環境變數 `FIREBASE_SERVICE_ACCOUNT`

## 2) Firestore 資料結構（最新版）

- collection: `trips`
  - document 欄位
    - title: string
    - date: string | null (YYYY-MM-DD)
    - location: string
    - note: string
    - uid: string
    - ownerUid: string
    - ownerEmail: string
    - memberEmails: string[] (含擁有者)
    - memberRoles: map (email -> owner | editor | viewer)
    - itemsCount: number
    - createdAt: serverTimestamp
    - updatedAt: serverTimestamp
  - subcollection: `items`
    - document 欄位
      - text: string
      - note: string
      - category: string
      - qty: number
      - unit: string
      - goChecked: boolean
      - returnChecked: boolean
      - uid: string
      - createdAt: serverTimestamp
      - updatedAt: serverTimestamp

## 3) Firestore 規則範例（前端不直連 Firestore）

將以下規則貼到 Firebase Console 的 Firestore Rules：

前端不再直接存取 Firestore，建議鎖到最小：  

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

後端使用 Firebase Admin（Netlify Functions），不受上述規則影響。

## 4) Netlify 部署設定

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

### Netlify 環境變數

在 Netlify 的 Site settings → Environment variables 加入：

- `FIREBASE_SERVICE_ACCOUNT`：Firebase Service Account JSON（整段貼上）

建議在 Netlify 建立新站台後：
1. 連結你的 Git repo
2. 設定 build command 與 publish directory
3. 部署完成即可

## 開發

```
npm install
npm run dev
```

若要在本機使用 Functions，建議使用：

```
npx netlify dev
```

這樣 `/api/*` 會正確轉發到 `netlify/functions`。

## 專案結構

```
.
├─ index.html
├─ package.json
├─ netlify.toml
├─ vite.config.js
├─ netlify
│  └─ functions
│     └─ api.cjs
└─ src
   ├─ App.vue
   ├─ firebase.js
   └─ main.js
```
