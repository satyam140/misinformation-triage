# Misinformation Triage Platform

A neutral civic-tech platform for triaging viral claims. The platform helps users submit claims, identify automated risk signals, and review claims through a transparent reviewer workflow.

---

## Hackathon Information

**Hackathon ID:** `AZIS-2CZXGV`

**Track:** Track 2 — Civic Tech

**Problem Statement:** Misinformation Triage Platform

Social media moves faster than fact-checkers can. This platform is designed for a newsroom or citizen group to triage viral claims by checking information and risk signals rather than ideologies.

---

# Features

## 1. Submit a Claim

Users can submit:

- Viral claim text
- Source platform
  - WhatsApp
  - X
  - Instagram
  - Other
- Category
  - Politics
  - Health
  - Finance
  - Other
- Optional source URL

---

## 2. Automated Risk Flags

The platform automatically checks submitted claims for three risk signals.

### Sensational

Triggered when the claim contains terms such as:

- `breaking`
- `shocking`
- `share before deleted`

### Shouting

Triggered when more than 50% of alphabetic characters in the claim are uppercase.

### Unsourced

Triggered when the claim does not contain a source URL.

### High Risk

If a claim has two or more risk flags, it is marked as:

**High Risk**

Risk flags are only triage signals. They do not determine whether a claim is true or false.

---

## 3. Review Workflow

Reviewers can review unverified claims and select:

- Verified True
- False
- Misleading

The reviewer also provides a short review note.

The original claim is preserved while the review decision is stored separately.

---

## 4. Public Feed

The public feed displays all submitted claims.

Users can filter claims by:

- Category
- Status

Each claim displays its current status and risk level.

Unverified claims remain visible and are clearly marked as **Unverified**.

---

## 5. Claim Detail

Each claim has a detail page containing:

- Full claim text
- Source platform
- Category
- Source URL
- Risk flags
- Risk level
- Current status
- Reviewer note
- Review history
- Submission time

---

# Technology Stack

- **Next.js 16**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Supabase PostgreSQL**
- **Supabase JavaScript Client**
- **Lucide React**
- **Vercel** for deployment

---

# Database

The project uses **Supabase PostgreSQL** as its database.

The application contains three main tables:

### `claims`

Stores:

- Claim text
- Platform
- Category
- Source URL
- Status
- Risk level
- Creation time
- Review time

### `risk_flags`

Stores automated risk flags for each claim:

- `sensational`
- `shouting`
- `unsourced`

### `reviews`

Stores reviewer decisions and notes:

- `true`
- `false`
- `misleading`

The application communicates with Supabase using the **Supabase JavaScript Client**.

---

# Architecture

```text
User
  │
  ▼
Next.js Application
  │
  ├── Submit Claim
  │
  ├── Risk Analyzer
  │
  ├── Public Feed
  │
  └── Reviewer Workflow
  │
  ▼
Supabase JavaScript Client
  │
  ▼
Supabase PostgreSQL
  │
  ├── claims
  ├── risk_flags
  └── reviews

Running Locally
Prerequisites

Make sure you have:
Node.js installed
npm installed
A Supabase project
1. Clone the repository
git clone https://github.com/YOUR-USERNAME/misinformation-triage.git

Enter the project directory:

cd misinformation-triage
2. Install dependencies
npm install
3. Configure Supabase

Create a file named:

.env.local

in the project root.

Add:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key

Use the Supabase project URL and publishable key from your Supabase project.

Do not commit .env.local to GitHub.

4. Start the development server
npm run dev

Open:

http://localhost:3000
Production Build

To verify that the project builds successfully:

npm run build

The production build should complete without errors.