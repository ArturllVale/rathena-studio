# rAthena Studio

**rAthena Studio** is a modern desktop Integrated Development Environment (IDE) tailored for development, editing, validation, and runtime management of rAthena Ragnarok Online emulator servers.

---

## 1. Objectives

- Provide a high-performance desktop environment for rAthena server administration and database editing.
- Deliver structured, schema-validated editing for YAML databases (`item_db.yml`, `mob_db.yml`, `skill_db.yml`, etc.) while preserving comments and original file formatting.
- Manage server runtime processes (login-server, char-server, map-server, database) with non-blocking log streaming.
- Integrate validation, reference integrity checks, and search capabilities.

---

## 2. Technology Stack

- **Desktop Shell**: Tauri 2 (Rust)
- **Frontend**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite (with Hot Module Replacement)
- **Styling**: Tailwind CSS (IDE dark theme system)
- **UI Components**: shadcn/ui primitives & Lucide icons
- **State Management**: Zustand (modular feature-oriented stores)
- **Testing**: Vitest & React Testing Library

---

## 3. Directory Structure

```text
rathena-studio/
├── .agent/
│   └── skills/
│       └── rathena-studio/
│           └── skill.md          # Engineering standards and domain rules
├── docs/
│   └── plan.md                   # Long-term architecture and phased plan
├── src/
│   ├── app/                      # Main application shell and routing
│   ├── components/
│   │   ├── layout/               # TitleBar, Sidebar, StatusBar, ErrorBoundary
│   │   └── ui/                   # Reusable UI primitives (Button, Card, Badge, Input)
│   ├── domain/                   # Domain entities and contracts (Workspace, Settings)
│   ├── features/
│   │   ├── workspace/            # Workspace inspection and discovery
│   │   ├── databases/            # Database engine UI integration (Phase 3+)
│   │   ├── processes/            # Process manager UI integration (Phase 8+)
│   │   ├── logs/                 # Streaming log console (Phase 10+)
│   │   └── settings/             # Environment and paths configuration
│   ├── lib/                      # Utilities, error classification models
│   ├── services/                 # Tauri IPC bridges and system services
│   ├── stores/                   # Feature-oriented Zustand stores
│   ├── index.css                 # Base theme styles
│   └── main.tsx                  # React entry point
├── src-tauri/
│   ├── capabilities/             # Tauri 2 security capabilities and permissions
│   ├── src/
│   │   ├── commands/             # Tauri IPC invoke handlers
│   │   ├── filesystem/           # Safe filesystem inspection & discovery
│   │   ├── git/                  # Git integration module
│   │   ├── logging/              # Log stream normalizer
│   │   ├── processes/            # Native process manager
│   │   ├── lib.rs                # Tauri application configuration and plugins
│   │   └── main.rs               # Rust binary entry point
│   ├── Cargo.toml                # Rust crate definitions
│   └── tauri.conf.json           # Tauri 2 application configuration
├── tests/                        # Unit and integration test suite
├── index.html                    # Web entry point
├── package.json                  # Scripts and Node dependencies
├── tsconfig.json                 # TypeScript compiler configuration
└── vite.config.ts                # Vite bundler and Vitest configuration
```

---

## 4. Prerequisites

- **Node.js**: v18+ (tested with v23.8.0) or Bun
- **npm** or **bun**
- **Rust & Cargo**: stable toolchain (1.80+)
- **OS**: Windows, macOS, or Linux

---

## 5. Getting Started

### Install Dependencies

```bash
npm install
```

### Run in Web Development Mode (Vite HMR)

```bash
npm run dev
```

The web interface will be served at `http://localhost:1420`.

### Run in Desktop Development Mode (Tauri 2 + Vite HMR)

```bash
npm run tauri:dev
```

### Run Tests

```bash
npm run test
```

### Run Type Checking and Linting

```bash
npm run typecheck
npm run lint
```

### Build for Production

Frontend build:
```bash
npm run build
```

Desktop package build:
```bash
npm run tauri:build
```
