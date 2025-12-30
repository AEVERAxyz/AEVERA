# TimeCapsule

## Overview

TimeCapsule is a web application that allows users to create encrypted time-locked messages that can only be revealed after a specified date. Users write a message, set a future reveal date, and the application encrypts the content client-side before storing it. When the reveal date passes, the message is automatically decrypted and displayed. The application supports sharing capsules via unique URLs and integration with Farcaster (Warpcast) for social sharing, with planned NFT minting functionality for revealed messages.

### Authentication
- **Farcaster Sign-In**: Users authenticate via Neynar's Sign in with Farcaster popup flow (SIWN script v1.2.0)
- **Base Smart Wallet**: Alternative login option via @coinbase/wallet-sdk with official Base branding
- **Identity Selection**: After sign-in, users can choose to post as their @username or any verified address (ENS/.base.eth names resolved via API)
- **Environment Variables**: Requires `NEYNAR_API_KEY` (server) and `VITE_NEYNAR_CLIENT_ID` (client)

### Design Theme
- **Color Scheme**: Midnight Base Blue (HSL 221 70% 35%) - deep, sophisticated accent color
- **Background**: Dark charcoal (#050505) with subtle blue gradient orbs
- **Text Colors**: Soft white (#E0E0E0) for high contrast without harshness
- **Error Messages**: Subtle orange (#E89B5A) with thin borders instead of aggressive red
- **Effects**: Subtle neon glow effects using Midnight Base Blue on buttons and containers

## User Preferences

Preferred communication style: Simple, everyday language.
Creator attribution: gelassen.eth

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for page transitions and interactions
- **Build Tool**: Vite for development and production builds
- **Wallet Integration**: @coinbase/wallet-sdk for Smart Wallet support

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in shared route schemas with Zod validation
- **Database ORM**: Drizzle ORM for type-safe database operations

### API Endpoints
- `POST /api/capsules` - Create a new time capsule
- `GET /api/capsules/:id` - Get capsule details (auto-decrypts if revealed)
- `POST /api/capsules/:id/mint` - Register NFT minting (author-only, with provenance)
- `GET /api/stats` - Get global capsule count
- `GET /api/archive` - List all capsules with search/filter support
- `GET /api/farcaster/user/:fid` - Fetch Farcaster user profile with verified addresses
- `GET /api/resolve-ens/:address` - Resolve ENS or .base.eth name for an address
- `GET /frame/:id` - Farcaster Frame HTML for sharing
- `POST /frame/:id` - Farcaster Frame action handler

### Features
- **Transparency Archive**: Live table showing all capsules with search by address/ENS
- **Global Counter**: Footer displays total messages sent to the future
- **Zora NFT Minting**: Author-only minting with provenance metadata (platform, author, dates, hash)
- **Premium Parchment Effect**: Revealed messages display with decorative scroll styling

### Data Storage
- **Database**: PostgreSQL accessed via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via Drizzle Kit (`drizzle-kit push`)

### Security & Encryption
- **Client-side Encryption**: Messages are encrypted in the browser using TweetNaCl before being sent to the server
- **Key Storage**: Decryption keys are stored alongside encrypted content (time-lock enforcement, not cryptographic security)
- **Message Hashing**: SHA-256 hashing for message integrity verification

### Shared Code Pattern
- **Location**: `shared/` directory contains code used by both frontend and backend
- **Route Definitions**: `shared/routes.ts` defines API contracts with Zod schemas for type-safe API calls
- **Schema Definitions**: `shared/schema.ts` exports database schemas and derived TypeScript types

### Build & Deployment
- **Development**: Vite dev server with HMR proxied through Express
- **Production Build**: esbuild bundles server code, Vite builds client assets
- **Output**: `dist/` directory with `index.cjs` (server) and `public/` (static assets)

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage for Express (available but sessions not currently implemented)

### Frontend Libraries
- **@tanstack/react-query**: Async state management and caching
- **@coinbase/wallet-sdk**: Coinbase Smart Wallet integration
- **framer-motion**: Animation library
- **tweetnacl**: Client-side encryption library
- **react-hook-form + zod**: Form handling with schema validation
- **date-fns**: Date manipulation and formatting
- **lucide-react**: Icon library
- **react-icons**: Company logos (SiFarcaster)
- **viem**: Ethereum utilities

### UI Framework
- **Radix UI**: Accessible component primitives (dialog, dropdown, tooltip, etc.)
- **class-variance-authority**: Component variant styling
- **tailwind-merge + clsx**: Utility class management

### Development Tools
- **Vite**: Development server and build tool
- **Drizzle Kit**: Database migration and schema management
- **esbuild**: Server-side bundling for production
