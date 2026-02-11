# 🚀 AdonisCMS

A full-stack modern application built with **AdonisJS 6** (Backend) and **Svelte 5** (Frontend). Optimized for speed, offline-first capabilities, and developer experience.

## 📂 Project Structure

- **`backend/`**: AdonisJS 6 server. Handles authentication, database migrations, and API endpoints. 
- **`frontend/`**: Svelte 5 application using SvelteKit 2 and Tailwind CSS. Features an admin dashboard and a clean user interface.

## ⚙️ Setup Instructions

### Backend (AdonisJS)
1. Navigate to the `backend` folder: `cd backend`
2. Install dependencies: `npm install`
3. Configure environment: `copy .env.example .env` (Add your `APP_KEY` and database settings)
4. Run migrations: `node ace migration:run`
5. Start development server: `npm run dev`

### Frontend (SvelteKit)
1. Navigate to the `frontend` folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev` (Access at `http://localhost:5173`)

## 🔑 Default Credentials
- **Admin Email**: `admin@devcms.com`
- **Password**: `password`

## ✨ Features
- **Offline-First**: Built-in sync engine for data persistence even without an active internet connection.
- **Admin Dashboard**: Comprehensive panel for managing content, users, and system stats.
- **Micro-Framework Architecture**: Modular design for ease of scaling and maintenance.
- **Responsive Design**: Modern UI crafted with Tailwind CSS for all screen sizes.
