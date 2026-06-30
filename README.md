# 🎓 Admission Dashboard — NavGurukul

A full-stack admission management system built for **NavGurukul** to streamline the entire student admission lifecycle — from sourcing to final decisions, interviews, offer letters, and beyond.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Routes](#available-routes)
- [User Roles](#user-roles)
- [Key Modules](#key-modules)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Admission Dashboard is a React-based web application that manages every step of the NavGurukul admission process. It supports multiple user roles (Admin, Owner, Partner, Donor, Student) and provides powerful tools for applicant tracking, interview scheduling, screening tests, offer letter generation, and more.

---

## Features

- **Applicant Management** — Add, edit, bulk-update, filter, and export applicants
- **Pipeline Stages** — Track applicants through Sourcing → Screening → Interviews → Final Decisions
- **Interview Scheduling** — Schedule interviews, manage slots, view calendar
- **Screening Tests** — Question repository, difficulty levels, bulk import, versioning
- **Offer Letters** — Rich text template editor with placeholder support, S3 image upload, bulk sending
- **Multi-Role Access** — Role-based views for Admin, Owner, Partner, Donor, and Students
- **Student Portal** — Student-facing login, slot booking, screening test, offer letter viewing
- **Campus & School Management** — Manage campuses with per-campus applicant tracking
- **Partner & Donor Portals** — Partner/Donor-specific student views
- **Settings** — User roles, caste, religion, qualification management
- **Google OAuth** — Authentication via Google Sign-In
- **CSV Import/Export** — Bulk import applicants via CSV
- **Face Verification** — TensorFlow.js powered face detection (group photo prevention)
- **Onboarding** — Guided tour, FAQ modal, contextual help widget

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State / Data | TanStack React Query |
| Backend / DB | Custom REST API + PostgreSQL |
| Auth | Google OAuth (`@react-oauth/google`) |
| Forms | React Hook Form + Zod |
| Rich Text | React Quill |
| Charts | Recharts |
| CSV | PapaParse |
| Face Detection | TensorFlow.js + face-api.js |
| Routing | React Router DOM v6 |
| Notifications | Sonner |
| Date Utils | date-fns |

---

## Project Structure

```
src/
├── api/                    # Raw API call functions
├── assets/                 # Static images & logos
├── components/
│   ├── applicant-table/    # Table sub-components (rows, headers, pagination, filters)
│   ├── difficulty-levels/  # Difficulty level manager & selector
│   ├── offer-letters/      # Template editor, placeholder panel, S3 tools
│   ├── onboarding/         # Guided tour, FAQ, help widget
│   ├── questions/          # Question editor, list, filters, version history
│   └── ui/                 # shadcn/ui base components + custom UI
├── hooks/                  # Custom React hooks (auth, data fetching, permissions)
├── integrations/
│   └── supabase/           # Supabase client & generated types
├── lib/                    # Utility functions & constants
├── pages/
│   ├── settings/           # Settings sub-pages (roles, caste, religion, qualification)
│   └── students/           # Student portal pages (login, test, slot booking, offer letter)
├── routes/                 # Student route guards & language context
├── services/               # Service layer (template service)
└── utils/                  # API utilities, export helpers, context providers
```

---

## Getting Started

### Prerequisites

- Node.js `>= 18.0.0`
- npm or bun

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>

# 2. Navigate into the project
cd Admission-Dashboard

# 3. Install dependencies
npm install
# or with bun
bun install

# 4. Set up environment variables (see section below)
cp .env.example .env
# Edit .env with your credentials

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder. A `dist/404.html` is auto-generated (postbuild) for SPA routing support on static hosts.

### Preview Production Build

```bash
npm run preview
```

---

## Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# Backend API base URL
VITE_API_BASE_URL

# Google OAuth credentials (from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

> **Note:** All Vite environment variables must be prefixed with `VITE_` to be accessible in the browser.

---

## Available Routes

### Admin / Staff Routes (Protected)

| Route | Page | Description |
|---|---|---|
| `/` | Index | Dashboard home |
| `/applicants` | AllApplicants | All applicants table |
| `/sourcing` | Sourcing | Sourcing pipeline |
| `/screening` | Screening | Screening stage |
| `/interviews` | Interviews | Interview management |
| `/interview-rounds` | InterviewRounds | Round-wise interview view |
| `/schedule` | Schedule | Interview slot scheduling |
| `/decisions` | FinalDecisions | Final admission decisions |
| `/offer-letters` | OfferLetters | Send offer letters |
| `/offer-letter-templates` | OfferLetterTemplates | Manage letter templates |
| `/campus` | Campus | Campus list |
| `/campus/:id` | CampusDetail | Campus-specific applicants |
| `/school` | School | School management |
| `/school/:id` | SchoolStages | School admission stages |
| `/partners` | Partner | Partner list |
| `/partners/:id/students` | PartnerStudents | Students by partner |
| `/donor` | Donor | Donor list |
| `/donors/:id/students` | DonorStudents | Students by donor |
| `/admin` | Admin | Admin panel |
| `/admin-view` | AdminView | Admin data view |
| `/owner` | Owner | Owner dashboard |
| `/questions` | QuestionRepository | Question bank |
| `/settings` | Settings | App settings |
| `/settings/user-role` | UserRole | Manage user roles |
| `/settings/caste` | Caste | Caste settings |
| `/settings/religion` | Religion | Religion settings |
| `/settings/qualification` | Qualification | Qualification settings |

### Student Routes

| Route | Description |
|---|---|
| `/students/login` | Student login (Google OAuth) |
| `/students/language` | Language selection |
| `/students/intro` | Introduction page |
| `/students/slot-booking` | Interview slot booking |
| `/students/screening` | Screening test |
| `/students/result` | Test result |
| `/students/offer-letter` | View offer letter |

> All admin routes redirect to `/students/login` if not authenticated. `/auth` redirects to `/students/login`.

---

## User Roles

| Role | Access |
|---|---|
| **Owner** | Full access across all campuses and data |
| **Admin** | Manage applicants, interviews, templates, settings |
| **Partner** | View and manage their referred students |
| **Donor** | View students associated with their donations |
| **Student** | Self-service portal — test, slot booking, offer letter |

Role-based access is enforced via the `usePermissions` hook and `ProtectedRoute` component.

---

## Key Modules

### Applicant Table
Located in `src/components/applicant-table/`. Modular components:
- `ApplicantTableRow` — individual row rendering
- `BulkActions` — bulk select, update, export
- `SearchBar` — real-time search
- `Pagination` — page controls
- `StageDropdown` / `StatusDropdown` — inline stage & status editing
- `ColumnVisibility` — show/hide columns

### Offer Letter Templates
Located in `src/components/offer-letters/`. Features:
- Rich text editor (React Quill)
- Placeholder insertion & management (`{{applicant_name}}`, `{{campus}}`, etc.)
- S3 image upload with campus logos
- Template list with version management
- Bulk offer letter sending with results modal

### Question Repository
Located in `src/components/questions/`. Features:
- Create, edit, preview questions
- Tag and topic management
- Difficulty level assignment
- Bulk CSV import
- Question sets with print/download view
- Version history tracking

### Student Portal
Located in `src/pages/students/`. Flow:
1. Login with Google OAuth
2. Language selection
3. Introduction
4. Slot booking
5. Screening test
6. Result page
7. Offer letter (if admitted)

---

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set **Output Directory** to `dist`
3. Add environment variables in Vercel project settings
4. Add a `vercel.json` for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### GitHub Pages

```bash
npm run deploy
```

This runs `predeploy` (build) then deploys `dist/` via `gh-pages`.

---

## Troubleshooting

**Blank page or 404 on CSS/JS after deployment**
- Ensure Output Directory is set to `dist` in your host settings
- Add the SPA rewrite rule in `vercel.json` (see above)
- Push a new commit to trigger a fresh build (clears stale cache)

**Google OAuth not working**
- Verify `VITE_GOOGLE_CLIENT_ID` is correctly set in `.env`
- Add your domain (e.g., `http://localhost:5173`) to the **Authorized JavaScript origins** in Google Cloud Console

**API calls failing**
- Check `VITE_API_BASE_URL` in `.env`
- For local backend, switch to `http://localhost:4420/api/v1`

**Face verification not loading**
- TensorFlow.js models load from CDN — ensure internet connectivity
- Check browser console for model loading errors

---

## License

This project is licensed under the terms in the [LICENSE](./LICENSE) file.

---

*Built with ❤️ for NavGurukul*
