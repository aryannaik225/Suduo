# 🧩 Suduo - Multiplayer Live-Sync Sudoku

Suduo is a **real-time, multiplayer, live-synced Sudoku game**. Challenge your friends, collaborate on solving puzzles, or go solo — all in a sleek, responsive interface with built-in chat, notes, undo/redo, and mistake tracking. Built with 💙 using **Next.js**, **Firebase Firestore**, and **Pusher**.

🌐 Live at: [https://suduo.vercel.app](https://suduo.vercel.app)

---

## 🎮 Features

- 🔁 **Real-time Multiplayer** – Seamlessly sync with other players in a shared Sudoku session.
- 📱 **Responsive UI** – Fully responsive from 320px mobile to wide desktop viewports.
- 🧠 **5 Difficulty Levels** – Easy → Inhuman (generated using difficulty-based ratings).
- 💬 **In-Game Chat** – Chat with other players while solving puzzles.
- 📝 **Note-Taking Mode** – Pencil in possibilities like a real Sudoku master.
- ↩️ **Undo/Redo** – Make mistakes? Undo them. Or redo if you changed your mind.
- 🎭 **Second Chance** – Game Over isn’t the end.
- ⏱️ **Timer & Mistake Tracker** – Compete against time or avoid exceeding 3 mistakes.
- 📤 **QR & Link Sharing** – Share a multiplayer room with others instantly.

---

## 🛠️ Installation

```bash
git clone https://github.com/your-username/suduo.git
cd client
npm install --legacy-peer-deps
npm run dev
```

> ⚠️ Note: The project requires a set of Firebase and Pusher environment variables which are hidden for security. If you plan to contribute, set up your own .env.local file with:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=...
NEXT_PUBLIC_PUSHER_APP_ID=...
NEXT_PUBLIC_PUSHER_SECRET=...
```

## 🧑‍💻 Contributing
Your contributions are welcomed!

### 📋 Steps
1. Fork the repo
2. Clone your fork:
```bash
git clone https://github.com/your-username/suduo.git
```
3. Create a branch:
```bash
git checkout -b feature/your-feature-name
```
4. Make your changes and commit:
```bash
git commit -m "Add feature: your-feature-name"
```
5. Push the branch:
```bash
git push origin feature/your-feature-name
```
6. Create a Pull Request on the main repo

 ### ✅ Contribution Guidelines
- Follow consistent code styling (Prettier/ESLint recommended)
- Test your changes locally before PR
- Explain the purpose of the change in your PR description

---

## 📁 Project Structure (Client-side)
```cpp
Suduo/
└── client/
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   │   ├── chat/
    │   │   │   │   └── send-message/
    │   │   │   │       └── route.js
    │   │   │   ├── generate-sudoku/
    │   │   │   │   └── route.js
    │   │   │   └── leave-session/
    │   │   │       └── route.js
    │   │   ├── game/
    │   │   │   └── [sessionId]/
    │   │   │       ├── page.jsx
    │   │   │       └── inputTracker/
    │   │   │           └── page.jsx
    │   │   └── page.jsx
    │   ├── components/
    │   │   ├── Game.jsx
    │   │   └── ChatBox.jsx
    │   └── firebase/
    │       ├── config.js
    │       └── firestoreUtils.js
    ├── .env.local
    └── .env.sample
```

---

## 📜 License
MIT License

---

Made with ❤️ by [Aryan Naik](https://github.com/aryannaik225)
