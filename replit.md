# TimeCapsule

## Overview

TimeCapsule is a web application that allows users to create encrypted time-locked messages that can only be revealed after a specified date. Users write a message, set a future reveal date, and the application encrypts the content client-side before storing it. When the reveal date passes, the message is automatically decrypted and displayed. The application supports sharing capsules via unique URLs and integration with Farcaster (Warpcast) for social sharing, with planned NFT minting functionality for revealed messages.

### Authentication
- **Farcaster Sign-In**: Users authenticate via Neynar's Sign in with Farcaster popup flow
- **Identity Selection**: After sign-in, users can choose to post as their @username or any verified address (ENS/.base.eth)
- **Environment Variables**: Requires `NEYNAR_API_KEY` (server) and `VITE_NEYNAR_CLIENT_ID` (client)

### Design Theme
- **Color Scheme**: Base Blue (#1652F0) primary color with azure accents
- **Background**: Charcoal (#050505) with subtle blue gradient orbs
- **Effects**: Neon glow effects using Base Blue on buttons and containers

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for page transitions and interactions
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in shared route schemas with Zod validation
- **Database ORM**: Drizzle ORM for type-safe database operations

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
- **framer-motion**: Animation library
- **tweetnacl**: Client-side encryption library
- **react-hook-form + zod**: Form handling with schema validation
- **date-fns**: Date manipulation and formatting
- **lucide-react**: Icon library

### UI Framework
- **Radix UI**: Accessible component primitives (dialog, dropdown, tooltip, etc.)
- **class-variance-authority**: Component variant styling
- **tailwind-merge + clsx**: Utility class management

### Development Tools
- **Vite**: Development server and build tool
- **Drizzle Kit**: Database migration and schema management
- **esbuild**: Server-side bundling for production