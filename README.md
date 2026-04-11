# MyCourse - Modern Learning Management System

![MyCourse Hero Banner](docs/assets/hero-banner.png)

MyCourse is a premium, full-stack learning platform designed to provide a seamless educational experience. Built with **Django** and **Next.js**, it features a beautiful glassmorphic UI, robust video progress tracking, and an intuitive dashboard for learners.

## ✨ Features

- **🎓 Personalized Dashboard**: Track your "Journey," see upcoming deadlines, and resume your most recent courses with a single click.
- **📺 Smart Video Player**: Integrated YouTube player that remembers your exact position. Never lose your place in a lecture again.
- **📊 Progress Tracking**: Real-time progress bars and "heartbeat" API that syncs your learning activity across devices.
- **📂 Course Syllabus**: Structured learning paths with modular videos and easy navigation.
- **🔐 Secure Authentication**: JWT-based authentication for a secure and smooth login experience.
- **📱 Responsive Design**: Fully optimized for desktops, tablets, and mobile devices with a dark-mode-first aesthetic.

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 4.2+
- **API**: Django REST Framework (DRF)
- **Auth**: SimpleJWT
- **Database**: PostgreSQL (Production), SQLite (Development)
- **Static Files**: WhiteNoise
- **Deployment**: Render-ready with Gunicorn

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: Vanilla CSS (Custom tokens and glassmorphism)
- **Icons**: Lucide React
- **API Client**: Axios with interceptors
- **Video**: YouTube IFrame API

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*Note: Ensure you create a `.env` file in the `backend/` directory based on `.env.example`.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Note: The frontend will be available at `http://localhost:3000`.*

---

## 🌐 Deployment

The project is pre-configured for deployment on **Render** (Backend) and **Vercel** (Frontend).

1. **Backend**: Uses `build.sh` and `Procfile` for one-click deployment on Render.
2. **Database**: Recommended use of **Neon.tech** for a managed PostgreSQL instance.
3. **Frontend**: Simply connect your GitHub repository to Vercel and set your environment variables.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Suraj Kekan](https://github.com/surajkekan)
