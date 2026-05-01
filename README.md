# ProTask - Task & Project Manager

ProTask is a modern, responsive project and task management application built with React, Tailwind CSS, and Redux Toolkit. It allows teams to track projects, assign tasks, and monitor progress through an intuitive dashboard and dedicated management views.

## Features

- **Authentication System**: Secure login flow with protected routes and persistent sessions via Redux and `localStorage`.
- **Analytics Dashboard**: Real-time summary metrics, a visual status distribution chart, and a quick-add task widget.
- **Project Management**: Full CRUD capabilities for projects utilizing a clean modal interface and Yup validation.
- **Task Tracking**: Comprehensive task management with filtering (by status and priority), search debouncing, and inline status editing.
- **Optimistic UI Updates**: Snappy user experience with immediate UI responses and automatic rollback on API failure.
- **Centralized API Layer**: All data operations flow through a dedicated Axios instance with global interceptors.

## Tech Stack

- **Frontend**: React (Vite), functional components, custom hooks.
- **Routing**: React Router v6 (`useLocation`, `useParams`).
- **State Management**: Redux Toolkit (Authentication), `useState`, `useMemo`, `useCallback` (Data grids and Filters).
- **Styling**: Tailwind CSS (Dark Mode supported).
- **Forms**: React Hook Form, Yup validation schema.
- **UI Components**: `react-select`, `react-datepicker`, `react-hot-toast`, `react-icons`.
- **Backend / Mock API**: `json-server`.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the React Development Server**
   In another terminal, run Vite on port 5173:
   ```bash
   npm run dev
   ```

3. **Access the Application**
   Open `http://localhost:5173` in your browser. 
   
   **Test Credentials:**
   - Email: `admin@protask.com`
   - Password: `admin123`
