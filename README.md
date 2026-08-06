# VERO Accessories | Refactored Enterprise Architecture

## Project Overview
VERO Accessories is a high-end luxury e-commerce platform built with React, Vite, Express, and Supabase.

## Architecture

```
VERO/
├── frontend/                     # React + Vite Client
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Express REST API
│   ├── src/
│   │   ├── config/               # Supabase and Env configuration
│   │   ├── controllers/          # Business logic handlers
│   │   ├── database/             # Seeder and Write logger
│   │   ├── middleware/           # Auth and security middlewares
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Audit, SSE and background services
│   │   ├── utils/                # Security and formatting utilities
│   │   ├── app.ts                # Express application setup
│   │   └── server.ts             # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── database/                     # SQL Schemas, Migrations & Seeds
│   ├── schema/                   # Supabase table definitions
│   ├── migrations/               # Database migrations
│   └── seeds/                    # Initial seed datasets
│
├── server.ts                     # Root dev entry point
├── package.json                  # Root dependencies & scripts
├── vite.config.ts                # Root Vite configuration
└── README.md
```

## Running the Application
```bash
npm run dev
```

## Building for Production
```bash
npm run build
npm start
```
