# 🌲 FUJIWARA BASE

秘密基地の進捗を仲間と共有・管理するWebアプリ。

## セットアップ

### 1. Firebase プロジェクトを作る

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを新規作成
2. **Authentication** → ログイン方法 → Google を有効化
3. **Firestore Database** を作成（本番モード）
4. **Storage** を有効化
5. プロジェクト設定 → マイアプリ → Webアプリを追加 → 設定値をコピー

### 2. 環境変数を設定

`.env.example` をコピーして `.env.local` を作成し、Firebaseの設定値を入力：

```bash
cp .env.example .env.local
```

### 3. Firestore & Storage のセキュリティルール

- Firebase Console → Firestore → ルール → `firestore.rules` の内容を貼り付け
- Firebase Console → Storage → ルール → `storage.rules` の内容を貼り付け

### 4. 最初のメンバー（自分）を手動登録

Firebase Console → Firestore → `members` コレクションに自分のUIDでドキュメントを作成：
- `displayName`: 名前
- `email`: メールアドレス
- `photoURL`: Googleプロフィール画像URL
- `joinedAt`: タイムスタンプ
- `invitedBy`: ""

### 5. ローカルで起動

```bash
npm install
npm run dev
```

## Vercel デプロイ

1. GitHubにpush
2. [Vercel](https://vercel.com) でリポジトリをインポート
3. Environment Variables に `.env.local` の内容を設定
4. デプロイ → 以降は `git push` で自動デプロイ

## 技術スタック

- React 18 + Vite
- Firebase (Auth / Firestore / Storage)
- react-router-dom v6
- Vercel
