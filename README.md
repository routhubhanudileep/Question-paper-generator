# Online Question Paper Generator

A role-based college examination management and automated question paper generation web application built with React, TypeScript, Tailwind CSS, and jsPDF. All data persists locally in the browser (`localStorage`) and is pre-seeded on first load for immediate zero-configuration use.

## Demo Credentials

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Faculty** | `faculty@demo.com` | `demo123` | Manage Question Bank, generate blueprint-driven papers, replace questions, submit for approval, download approved Paper & Answer Key PDFs |
| **HOD** | `hod@demo.com` | `demo123` | Define Paper Pattern blueprints, inspect pending papers & answer keys, approve or reject with comments, view analytics reports |
| **Admin** | `admin@demo.com` | `demo123` | Manage Users & Roles, CRUD Subjects and Syllabus Units, inspect chronological Audit Logs, view analytics reports |

## Key Features

- **Role-Based Access Control (RBAC)**: Each role sees only its dedicated sidebar menu and workspace pages.
- **Question Bank (Faculty)**: Full CRUD with search and multi-attribute filtering across subject, syllabus unit, marks (`2 / 5 / 10`), difficulty (`Easy / Medium / Hard`), and type (`Short / Long / MCQ`).
- **Subjects & Units Management (Admin)**: Create, edit, and delete subjects and numbered syllabus units.
- **Paper Pattern Blueprints (HOD)**: Configure examination blueprints with total marks validation, duration, and weighted sections.
- **Randomized Paper Generation Engine**:
  - Selects unique questions matching each section's marks, difficulty, and selected syllabus units.
  - Prioritizes unused or older questions over recently used ones.
  - Validates total marks and surfaces exact per-section shortage warnings if the question bank lacks sufficient questions.
  - Supports single-question replacement (matching marks and unit) or full paper regeneration inside a formal university exam preview.
- **Approval Workflow & Scheduling**: Faculty submits papers (`Draft` -> `Pending`) with an optional release date/time; HOD approves or rejects with comments (`Approved` / `Rejected`).
- **PDF Export**: Download approved Question Papers and separate Confidential Answer Keys as formatted multi-page PDFs via `jsPDF` (or print via browser print stylesheet).
- **Audit Logs & Reports**: Chronological tracking of paper creation, views, submissions, approvals, rejections, and PDF downloads, plus subject/unit/difficulty analytics charts.

## Running Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
