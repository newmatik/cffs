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

## Deployment

The app runs as a single Docker container with an embedded SQLite database -- no separate database server needed.

### Prerequisites

- A Linux server (e.g. DigitalOcean $6/mo droplet, Hetzner VPS, or any machine with Docker)
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

### Deploy in 3 Steps

```bash
# 1. Clone the repo
git clone git@github.com:newmatik/cffs.git
cd cffs

# 2. Set your secret key (use a random string)
echo 'AUTH_SECRET=your-random-secret-here' > .env

# 3. Build and start
docker compose up -d --build
```

The app will be running at `http://your-server-ip:3000`.

On first startup, the database is automatically created and seeded with demo accounts (see Demo Accounts above).

### Backup the Database

The SQLite database lives in a Docker volume. To back it up:

```bash
# Copy the database file out of the container
docker compose cp app:/app/data/cffs.db ./backup-$(date +%Y%m%d).db
```

### Update to a New Version

```bash
git pull
docker compose up -d --build
```

The entrypoint script automatically applies any schema changes on startup.

### Using a Custom Domain (Optional)

To access the app via a domain name with HTTPS, put a reverse proxy like [Caddy](https://caddyserver.com/) in front of it:

```bash
# Install Caddy on the server, then:
caddy reverse-proxy --from your-domain.com --to localhost:3000
```

Caddy handles HTTPS certificates automatically.

## Currency

All amounts are in Philippine Peso (PHP), displayed as ₱.
