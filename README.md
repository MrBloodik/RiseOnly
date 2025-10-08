# RiseOnly

**RiseOnly** is a next-generation social networking platform that merges real-time messaging, professional networking, and social feed features into one cohesive experience. Built using Feature‑Sliced Design (FSD) for maximum scalability and maintainability.

---

## 🚀 Core Features

* **Instant Messaging & Channels**

  * Real-time one-on-one and group chats inspired by Telegram.
  * Public and private channels to broadcast news or host community discussions.

* **Job Search & Professional Networking**

  * Integrated job board with advanced filters (role, location, remote).
  * User profiles support resumes, portfolios, and skills endorsements.
  * Algorithmic job recommendations based on your experience and interests.

* **Social Feed**

  * Post text updates, images, videos, and long-form articles.
  * Engage with content via likes, comments, and reshares.

* **Industry Communities & Events**

  * Join or create groups for IT, design, marketing, HR, and more.
  * Schedule and host webinars, workshops, and meetups.

* **Learning & Mentorship**

  * Access in-app courses and tutorials from partner providers.
  * Connect with mentors for one-on-one guidance and career advice.

---

## 🏗 Architecture (Feature‑Sliced Design)

We follow the FSD approach to keep code organized by features, not by technical layers:

```
src/
├── app/              # Entry point, global providers (state, i18n, theming)
├── pages/            # Top-level route components
├── widgets/          # High-level UI blocks combining features and entities
├── features/         # Isolated business logic and actions (auth, comments)
├── entities/         # Data models, API integrations, and state slices
├── shared/           # Reusable utilities, UI components, and styles
└── processes/        # Long-running scenarios (WebSocket connection, background sync)
```

This structure ensures:

* **Clear responsibility boundaries**
* **Easy onboarding** for new developers
* **Scalable codebase** as features grow

---

## ⚙️ Tech Stack

* **Frontend (Web)**: React (TypeScript), Tailwind CSS, React Router
* **Mobile**: React Native (Expo), Reanimated, React Navigation
* **Backend**: Node.js (Express), GraphQL, PostgreSQL, Rust microservices
* **Realtime**: WebSocket (Socket.IO) / MQTT
* **State Management**: MobX + mobx-toolbox
* **DevOps**: Docker, Kubernetes, Helm, GitHub Actions (CI/CD)
* **Monitoring & Logging**: Prometheus, Grafana, ELK Stack

---

## 🖥️ Local Setup

> **Note:** The backend services cannot be run locally by community users. A running demo environment is provided instead.

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/riseonly.git
   cd riseonly
   ```
   
2. **Install dependencies**

   ```bash
   yarn install   # Installs all workspace packages: backend, frontend, mobile
   ```
   
3. **Configuration**

   * Copy `.env.example` to `.env` in the `frontend/` and `mobile/` folders.
   * Fill in public API endpoints and environment variables as provided in the demo documentation.
     
4. **Run the applications**

   ```bash
   # Web frontend
   cd frontend && yarn start

   # Mobile app (Expo)
   cd ../mobile && yarn start
   ```

*Backend-specific setup is restricted; instead, you can access a hosted demo or request a video walkthrough.*

---

## 📦 Production & Demo Access

Production deployment details and access are available upon request:

* **Demo Environment**: A fully functional staging instance URL.
* **Video Walkthrough**: Pre-recorded demo of all features, deployment pipeline, and infrastructure overview.
* **Credentials**: Temporary accounts for testing messaging, job search, and social feed features.

Just open an issue or contact the maintainers to gain access.

---

## 🤝 Contributing

Contributions are welcome! Please adhere to these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Commit changes: `git commit -m "feat: ..."`.
4. Push branch: `git push origin feat/your-feature`.
5. Open a pull request and reference related issues.

See `CONTRIBUTING.md` for detailed guidelines.

---

## 📄 License

Licensed under the License. See `LICENSE` for details.
