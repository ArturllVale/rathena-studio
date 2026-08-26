# rAthena Studio

**rAthena Studio** is a high-performance desktop Integrated Development Environment (IDE) tailored for Ragnarok Online emulator server administration, structured YAML database engineering, and runtime management.

---

## 1. Current System Architecture

The application is structured into decoupled core layers:

```text
┌──────────────────────────────────────────────────────────────────┐
│                      UI & Presentation Layer                     │
│  - Database Explorer (Virtual List via @tanstack/react-virtual)  │
│  - Item Inspector (Field Origins, Layer Provenance, Live Diff)   │
│  - Scoped Shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)             │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│               State Management & Transaction Layer               │
│  - useItemEditStore / useDatabaseStore (Zustand: UI State only)  │
│  - ItemEditSession (Command Pattern: undoStack, redoStack)       │
│  - ItemEditTransactionService (Validation & Commit Orchestrator) │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│               Database Workspace & Provider Layer                │
│  - DatabaseRegistry (Provider discovery & metadata catalog)      │
│  - ItemDatabaseProvider (Lazy-loading & cache management)        │
│  - DatabaseContextLoader (Layer discovery & ordering)           │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                   Database Engine & CST Layer                    │
│  - LayeredItemRepository (25,000+ entities, RE/PRE-RE isolated)  │
│  - SourceItem vs EffectiveItem (Runtime resolution & provenance) │
│  - ItemDatabaseSerializer (AST round-trip, comments preserved)   │
│  - ItemDatabaseValidator (Business logic & exploit guards)       │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                   Tauri IPC & Native Backend                     │
│  - Tauri File System Provider & FileContentWriter                │
│  - Rust Backend (Tauri 2, Process Management, Security Caps)     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Functional Components

### A. Database Engine & Layered Repository (`src/domain/database/`)
- **Variant Isolation**: Strict partitioning between Renewal (`RE`) and Pre-Renewal (`PRE-RE`).
- **Layered Inheritance**: Evaluates the priority chain (`BASE` → `MODE_SPECIFIC` → `IMPORT` → `CUSTOM`).
- **Entity Resolution**:
  - `SourceItem`: Exact physical state inside an individual YAML layer file.
  - `EffectiveItem`: Final resolved composite state with `FieldOrigin` mapping indicating the source layer of every individual field.
- **CST / AST Round-Trip Serializer**: Employs `yaml` AST parsing to modify, insert, or override records while preserving header metadata, comments, whitespace, custom scripts, and unknown attributes. Fully supports empty files and `Body: null` declarations.

### B. Transactional Edit Layer & Undo/Redo (`src/services/database/`, `src/domain/database/workspace/`)
- **Session-Scoped History**: Undo/Redo is encapsulated within `ItemEditSession` using the Command Pattern (`FieldEditCommand`), tracking fine-grained field deltas without duplicating the repository.
- **Explicit Target Layer Policy**: Edits targeting fields inherited from base files automatically target the user's `IMPORT` override layer (`db/import/item_db.yml`) rather than modifying base files silently.
- **Safety Pipeline**:
  `UI Mutation -> EditCommand -> ItemEditSession -> ItemDatabaseValidator -> AST Mutation -> Atomic I/O`
- **Failure Resilience**: Persistence errors or validation failures leave the edit session dirty with pending changes and stacks intact.

### C. Database Explorer (`src/features/databases/items/`)
- **Virtual Scrolling**: Fluid 60 FPS exploration of 25,000+ items using `@tanstack/react-virtual`.
- **Search & Filtering**: Multi-field querying (ID, AegisName, Name), item type filtering, and sub-type categorization.
- **Provenance Inspector**: Visual inspector detailing effective values, per-field source origins, layer hierarchy, and semantic live diffs.

---

## 3. Technology Stack

- **Desktop Shell**: Tauri 2 (Rust)
- **Frontend**: React 19 + TypeScript
- **State Management**: Zustand (UI and session metadata only)
- **Virtualization**: `@tanstack/react-virtual`
- **Parsing & AST**: `yaml`
- **Styling**: Tailwind CSS + Lucide Icons
- **Testing**: Vitest (74 unit and integration characterization tests)

---

## 4. Directory Structure

```text
rathena-studio/
├── docs/
│   ├── database-engine/          # Engine, format, and round-trip specifications
│   └── plan.md                   # Long-term architecture and phased milestones
├── src/
│   ├── app/                      # Main application shell and layout
│   ├── domain/database/
│   │   ├── common/               # Context, layers, and variant definitions
│   │   ├── item/                 # SourceItem, EffectiveItem, FieldOrigin, types
│   │   ├── provider/             # DatabaseProvider contract and metadata
│   │   └── workspace/            # ItemEditSession, Command Pattern, Registry, Writers
│   ├── features/databases/       # Database Explorer, Toolbar, VirtualList, Inspector
│   ├── services/database/        # ContextLoader, Serializer, Validator, TransactionService
│   │   └── providers/            # ItemDatabaseProvider, Tauri file providers
│   └── stores/                   # databaseStore, itemEditStore, workspaceStore
├── src-tauri/                    # Tauri 2 Rust core and capabilities
├── tests/                        # Vitest suite (characterization, engine, session, audit)
└── package.json
```

---

## 5. Development & Testing

### Installation
```bash
npm install
```

### Development Modes
```bash
# Web development mode (Vite HMR)
npm run dev

# Desktop development mode (Tauri 2 + Vite HMR)
npm run tauri:dev
```

### Quality Assurance & Validation Suite
```bash
# Run full Vitest suite (74 tests)
npm run test

# Run TypeScript typecheck
npm run typecheck

# Run ESLint
npm run lint

# Check Rust backend
cargo check --manifest-path src-tauri/Cargo.toml
```
