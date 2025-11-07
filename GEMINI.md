# GEMINI.md: Your Guide to the PayPlan Project

This document provides a comprehensive overview of the PayPlan project, its architecture, and development practices. For a more detailed explanation of the project's philosophy and rules, see [memory/constitution.md](memory/constitution.md).

## Project Overview

PayPlan is a privacy-first, open-source budgeting application designed to help users manage their finances with a focus on visual dashboards and gamification. It's built for individuals who want to track their spending, set budgets, and achieve financial goals without compromising their privacy.

**Key Features:**

*   **Privacy-First:** All user data is stored exclusively in the browser's `localStorage`. No sign-up or personal information is required.
*   **Visual Dashboards:** Interactive charts and graphs provide insights into spending habits.
*   **Gamification:** Streaks, achievements, and personalized insights to encourage consistent financial habits.
*   **Free to Use:** All core budgeting features are free.

## Core Principles

The project is governed by a set of core principles outlined in the constitution. The key immutable principles are:

*   **Privacy-First:** User privacy is paramount. The application must function without requiring server-side data storage for its core features.
*   **Accessibility-First:** The application must be accessible to all users and comply with WCAG 2.1 AA standards.
*   **Free Core:** All essential budgeting features will remain free forever.
*   **Ethical Gamification:** Gamification features should empower users, not exploit them.

## Tech Stack

PayPlan is a full-stack application with a React frontend and a Node.js backend.

*   **Frontend:**
    *   React 19
    *   TypeScript 5.8
    *   Vite
    *   Tailwind CSS
    *   Recharts for data visualization
    *   Zod for data validation
*   **Backend:**
    *   Node.js 20.x
    *   Express
*   **Testing:**
    *   Vitest for the frontend
    *   Jest for the backend

## Project Structure

The project is organized into a monorepo structure with the frontend and backend code in separate directories.

```
/
├── frontend/         # React frontend application
│   ├── src/
│   │   ├── features/ # Feature-based modules
│   │   ├── shared/   # Shared components, hooks, and utils
│   │   └── ...
│   ├── tests/        # Frontend tests
│   └── ...
├── src/              # Backend source code (currently minimal)
├── specs/            # Feature specifications
├── docs/             # Project documentation
└── ...
```

A key architectural principle is the **feature-based structure** within the `frontend/src` directory. Each feature (e.g., `categories`, `budgets`, `dashboard`) is a self-contained module with its own components, hooks, and business logic.

## Building and Running

### Frontend

To run the frontend development server:

1.  Navigate to the `frontend` directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Start the dev server: `npm run dev`

The application will be available at `http://localhost:5173`.

### Backend

To run the backend server:

1.  From the root directory, install dependencies: `npm install`
2.  Start the server in development mode: `npm run dev`

The backend server will be running on `http://localhost:3000`.

### Running Tests

*   **Frontend:** `npm run test` in the `frontend` directory.
*   **Backend:** `npm test` in the root directory.
*   **All tests:** `npm run test:all` in the root directory.

## Development Conventions

*   **Phased TDD:** The project follows a phased approach to Test-Driven Development. For the initial features, it's acceptable to write tests after the implementation. As the project matures, the team will transition to a stricter test-first approach for all new code.
*   **TDD for Business Logic:** Regardless of the current phase, all business logic in `frontend/src/features/*/lib/**/*.ts` must be tested.
*   **Conventional Commits:** Commit messages should follow the Conventional Commits specification (e.g., `feat(categories): add new category`).
*   **Specifications:** New features are planned and documented in the `specs` directory before implementation.
