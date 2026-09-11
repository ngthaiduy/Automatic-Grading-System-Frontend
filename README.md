# Automatic Grading System — Web Frontend

React web application for administering Java OOP practical exams, managing submissions, reviewing grading results, and handling appeals.

## Features

- Authentication, account verification, password recovery, and session refresh.
- Role-oriented views for administrators, exam staff, lecturers, and students.
- Exam and session management, exam-paper uploads, and submission workflows.
- Grading controls, criteria configuration, progress tracking, and result views.
- Appeal submission, review, lecturer assignment, and dashboard statistics.
- Wallet, payment, withdrawal, and notification interfaces.
- Charts, QR-code display, and spreadsheet export utilities.

## Technologies

React 19, JavaScript, Vite 7, React Router 7, Ant Design 6, Tailwind CSS 3, Axios, ECharts, ExcelJS, Day.js, Lucide React, and ESLint.

## Setup

Use Node.js 22.12+ or another Node.js release supported by Vite 7. Start the companion backend before testing authenticated API flows.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` in `.env`, for example:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

Vite normally serves the app at `http://localhost:5173`. The API URL is embedded at build time via the Vite configuration. Values prefixed with `VITE_` are public browser configuration: never place database passwords, signing secrets, or payment-provider keys there.

The Axios client uses credentials/cookies and retries requests after refreshing an expired session. Configure the backend's allowed origin and cookie settings for the frontend URL. Local HTTP development may require local-only cookie configuration; use HTTPS and appropriate secure-cookie settings for deployed environments.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production bundle in `dist/` |
| `npm run preview` | Preview the built bundle locally |
| `npm run lint` | Run ESLint |

The project does not currently define an automated UI test command.

## Structure

```text
src/
  components/     Reusable UI components
  pages/          Page-level views
  hooks/          Feature and data-access hooks
  services/       API clients
  main.jsx        Application entry point
public/           Static assets
vite.config.js    Build-time API configuration
```

## Deployment

Build with the intended API URL, then serve `dist/` from a static host. Configure SPA route fallback to `index.html` for client-side routes. Payment and grading behavior must be validated with the corresponding backend and correctly configured external services.

## Local files

Environment files, dependencies, build output, editor settings, logs, and local login-link scratch files are excluded from Git. Keep real credentials on the backend.
