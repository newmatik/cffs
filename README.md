# Christ Followers - Financial Management System

A web application for managing church member contributions, savings balances, and micro-loans.

## Features

- **Dashboard** -- Overview of total members, deposits, outstanding loans, and monthly collections
- **Members** -- Searchable member list with savings balances and detailed profiles
- **Transactions** -- Record deposits and withdrawals, view full transaction history
- **Loans** -- Manage micro-loan applications, approvals, payments, and amortization schedules
- **Reports** -- Download Excel reports for transactions, balances, loans, and collections
- **Member Portal** -- Members can view their own account balance, history, and loan status
- **Role-based Access** -- Admin, Officer, and Member roles with appropriate permissions

## Tech Stack

- **Next.js 16** (App Router)
- **Prisma + SQLite** (file-based database)
- **Tailwind CSS + shadcn/ui** (UI components)
- **NextAuth.js** (authentication)
- **ExcelJS** (report generation)

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create the database
npx prisma db push

# Load demo data
npx prisma db seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

All demo accounts use the password: `password123`

| Role    | Email                              |
| ------- | ---------------------------------- |
| Admin   | admin@christfollowers.ph           |
| Officer | maria.santos@christfollowers.ph    |
| Member  | juan.delacruz@christfollowers.ph   |

## Project Structure

```
src/
  app/
    (dashboard)/          # Admin/Officer pages
      dashboard/          # Overview dashboard
      members/            # Member list + detail
      transactions/       # Transaction list + new form
      loans/              # Loan list + detail + new form
      reports/            # Excel report downloads
      my-account/         # Member self-service portal
    api/                  # API routes
    login/                # Login page
  components/             # Reusable UI components
  lib/                    # Auth, Prisma, formatting utilities
prisma/
  schema.prisma           # Database schema
  seed.ts                 # Demo data seed script
```

## Currency

All amounts are in Philippine Peso (PHP), displayed as ₱.
