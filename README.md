# rAthena Studio

**rAthena Studio** é uma IDE desktop de alto desempenho para administração de servidores de Ragnarok Online baseados no emulador [rAthena](https://github.com/rathena/rathena). Permite edição visual das bases de dados YAML (`item_db`, `mob_db`, `skill_db`) com rastreamento de camada por campo, visualização de diff semântico e persistência transacional via AST.

---

## Funcionalidades Implementadas

### Database Explorer com Multi-Layer Inheritance
- Carregamento unificado de **Item Database**, **Monster Database** e **Skill Database** em uma única ação com seleção de variante `Renewal (RE)` ou `Pre-Renewal (PRE-RE)`.
- Barra de progresso visual e mensagens de status por etapa durante o carregamento.
- Suporte a **25.000+ entidades** com scroll virtualizado a 60 FPS via `@tanstack/react-virtual`.
- **Herança em camadas** com resolução automática de prioridade: `BASE → MODE_SPECIFIC → IMPORT → CUSTOM`.

### Item Inspector
- Edição completa de todos os campos YAML: identidade, tipo/subtipo, preços, estatísticas de combate, requisitos de job/classe/localização, scripts de equip/heal/use.
- Filtros de pesquisa por ID, AegisName, Nome, Tipo, SubTipo e Pasta (import / geral).
- Criação de novos itens (`+ New Item`) com validação de ID único e AegisName único em tempo real.

### Monster Inspector
- Edição de identidade, atributos base (STR/AGI/VIT/INT/DEX/LUK), estatísticas de combate, drops, MVP drops, modos de AI e classe.
- Filtros por Elemento, Raça, Tamanho, Classe e Pasta.
- Criação de novos monstros (`+ New Monster`) com auto-sugestão de ID e validação de unicidade.

### Skill Inspector
- Edição de identidade, requisitos de nível, custos de SP/HP/AP/Zeny com suporte a valores uniformes e por-nível (Scaled/Uniform).
- Dropdowns canônicos para Elemento, Área de Splash, Alvos de Unidade, Estado Requerido e Tipo de Munição baseados no `skill_db.txt` real do rAthena.
- Matrizes de nível editáveis para `SpCost`, `HpCost`, `ApCost`, `ZenyCost`, `SpRateCost`, `HpRateCost`, `SpiritSphereCost`, `MaxHpTrigger`, `AmmoAmount`.
- Criação de novas habilidades (`+ New Skill`) com seleção de camada de destino.

### Layer Hierarchy (Proveniência por Campo)
- Cada campo exibe sua origem exata (arquivo e camada) no Inspector.
- Visualização padronizada com badges numerados, labels de import/base/mode e chips de campos ativos.

### Semantic Diff Engine (GitHub-Style)
- Diff semântico recursivo (`computeSemanticDiff`) exibido como linhas `-` / `+` em estilo Git para cada campo alterado.
- Integrado nos inspetores de Item, Monster e Skill na aba **Changes**.

### Transactional Persistence (Atomic AST Writes)
- **Undo/Redo** por campo via Command Pattern (`FieldEditCommand`, `undoStack`, `redoStack`).
- **Discard**: restauração total do estado original da sessão via `reset()`.
- **Save**: validação de business rules → mutação atômica do AST → escrita no disco → recarga da camada afetada.
- **Target Layer Policy**: edições de campos herdados de camadas base são automaticamente direcionadas para `db/import/` sem modificar os arquivos base.
- **Criação de Entidades** (`createItem`, `createMob`, `createSkill`): Appends ao AST com validação de duplicatas antes de qualquer I/O.

---

## Arquitetura

```text
┌──────────────────────────────────────────────────────────────────────┐
│                       UI & Presentation Layer                        │
│  - DatabasesView (Unified loader, progress bar, variant selector)    │
│  - ItemExplorerView / MobExplorerView / SkillExplorerView            │
│  - Inspector (Identity, Combat, Requirements, Area, Timing, Drops)   │
│  - SemanticDiffViewer (GitHub-style -/+ diff)                        │
│  - CreateItemModal / CreateMobModal / CreateSkillModal               │
│  - Virtual Lists (@tanstack/react-virtual, 60 FPS, 25k+ entities)    │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────┐
│                  State Management & Transaction Layer                 │
│  - useDatabaseStore / useItemEditStore / useMobEditStore             │
│  - useSkillEditStore (Zustand: UI state + session refs)              │
│  - ItemEditSession / MobEditSession / SkillEditSession               │
│    (Command Pattern: FieldEditCommand, undoStack, redoStack)         │
│  - ItemEditTransactionService / MobEditTransactionService            │
│  - SkillEditTransactionService (Validate → AST Mutate → Write)      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────┐
│               Database Workspace & Provider Layer                     │
│  - DatabaseRegistry (Provider discovery & metadata catalog)          │
│  - ItemDatabaseProvider / MobDatabaseProvider / SkillDatabaseProvider│
│  - DatabaseContextLoader (Layer discovery & ordering by priority)    │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────┐
│                    Database Engine & CST Layer                        │
│  - LayeredItemRepository (RE/PRE-RE isolated, 25k+ entities)         │
│  - LayeredMobRepository / LayeredSkillRepository                     │
│  - SourceItem/Mob/Skill (per-file raw state) vs                      │
│    EffectiveItem/Mob/Skill (resolved composite with FieldOrigin map) │
│  - ItemDatabaseSerializer / MobDatabaseSerializer / Skill...         │
│    (AST round-trip: comments, whitespace, unknown attrs preserved)   │
│  - ItemDatabaseValidator / MobDatabaseValidator / SkillDatabaseVal.  │
│  - semanticDiff.ts (recursive deep diff engine)                      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────┐
│                    Tauri IPC & Native Backend                         │
│  - TauriLayerFileContentProvider / TauriFileContentWriter            │
│  - Rust Backend (Tauri 2, File System, Security Capabilities)        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Desktop Shell | Tauri 2 (Rust) |
| Frontend | React 19 + TypeScript 5.7 |
| State Management | Zustand 5 |
| Virtualização | @tanstack/react-virtual 3 |
| Parsing & AST | yaml 2 |
| UI Components | Radix UI (Select) + Lucide Icons |
| Estilização | Tailwind CSS 3 |
| Build | Vite 6 |
| Testes | Vitest 3 (100 testes, 16 suítes) |

---

## Estrutura de Diretórios

```text
rathena-studio/
├── docs/
│   ├── database-engine/
│   │   ├── item-db-specification.md      # Especificação de campos do item_db
│   │   ├── parser-strategy.md            # Estratégia de parsing em camadas
│   │   ├── rathena-database-format.md    # Formato YAML real do rAthena
│   │   └── round-trip-requirements.md    # Requisitos de fidelidade AST
│   ├── database-schema-audit.md          # Auditoria de campos implementados vs spec
│   └── plan.md                           # Roadmap e fases de desenvolvimento
├── src/
│   ├── app/                              # App shell, layout e roteamento
│   ├── components/ui/                    # Componentes base (Button, Input, Select, Card)
│   ├── domain/database/
│   │   ├── common/                       # Context, layers, variant definitions
│   │   ├── item/                         # SourceItem, EffectiveItem, FieldOrigin, types
│   │   ├── mob/                          # SourceMob, EffectiveMob, AI definitions
│   │   ├── skill/                        # SourceSkill, EffectiveSkill, skill types
│   │   ├── provider/                     # DatabaseProvider contract & metadata
│   │   └── workspace/                   # EditSessions, Command Pattern, Writers
│   ├── features/databases/
│   │   ├── common/                       # SemanticDiffViewer
│   │   ├── items/                        # ItemExplorerView, Inspector, CreateItemModal
│   │   ├── mobs/                         # MobExplorerView, Inspector, CreateMobModal
│   │   └── skills/                      # SkillExplorerView, Inspector, CreateSkillModal
│   ├── services/database/
│   │   ├── item/                         # ItemDatabaseParser, Serializer, Repository
│   │   ├── mob/                          # MobDatabaseParser, Serializer, Repository
│   │   ├── skill/                        # SkillDatabaseParser, Serializer, Repository
│   │   ├── providers/                    # ItemDatabaseProvider, Mob..., Skill..., Tauri...
│   │   ├── itemEditTransactionService.ts
│   │   ├── mobEditTransactionService.ts
│   │   └── skillEditTransactionService.ts
│   ├── stores/                           # databaseStore, itemEditStore, mobEditStore, skillEditStore, workspaceStore
│   └── utils/
│       └── semanticDiff.ts               # Recursive deep diff engine
├── src-tauri/                            # Tauri 2 Rust core e capabilities
├── tests/
│   ├── app.test.tsx
│   ├── databaseEngineAudit.test.ts       # Real rAthena data compatibility (25k+ items)
│   ├── databaseEngineCharacterization.test.ts
│   ├── databaseEngineCore.test.ts        # Layer resolution, variant isolation
│   ├── databaseWorkspace.test.ts
│   ├── entityCreation.test.ts            # +1 Item/Mob/Skill creation & uniqueness validation
│   ├── itemEditAudit.test.ts
│   ├── itemEditSession.test.ts           # Undo/Redo command pattern
│   ├── itemEditTransactionService.test.ts
│   ├── itemExplorerState.test.ts
│   ├── itemInspectorFullFields.test.ts
│   ├── mobDatabaseEngine.test.ts
│   ├── rathenaScriptValidator.test.ts
│   ├── services.test.ts
│   ├── skillDatabaseEngine.test.ts
│   └── stores.test.ts
└── package.json
```

---

## Desenvolvimento & Testes

### Instalação

```bash
npm install
```

### Modos de Desenvolvimento

```bash
# Web (Vite HMR apenas)
npm run dev

# Desktop (Tauri 2 + Vite HMR)
npm run tauri:dev
```

### Suite de Validação

```bash
# Vitest — 100 testes, 16 suítes (unit + integration + real rAthena data)
npm run test

# TypeScript strict check
npm run typecheck

# ESLint
npm run lint

# Build de produção
npm run build

# Rust backend check
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## Bancos de Dados Suportados

| Banco | Arquivos YAML Lidos | Status |
|-------|--------------------|----|
| **Item DB** | `item_db_usable.yml`, `item_db_equip.yml`, `item_db_etc.yml`, `item_db.yml`, `db/import/item_db*.yml` | ✅ Completo |
| **Monster DB** | `mob_db.yml`, `mob_db2.yml`, `mob_avail_db.yml`, `db/import/mob_db.yml` | ✅ Completo |
| **Skill DB** | `skill_db.yml`, `skill_db2.yml`, `db/import/skill_db.yml` | ✅ Completo |
| Item Combos | `item_combos.yml` | 🔜 Fase 4 |
| Random Options | `item_randomopt_db.yml`, `item_randomopt_group.yml` | 🔜 Fase 4 |
| Item Groups | `item_group_db.yml` | 🔜 Fase 4 |
| Item Packages | `item_packages.yml` | 🔜 Fase 4 |

---

## Roadmap

- [x] **Fase 1** — Engine de parsing YAML com herança em camadas (Item DB)
- [x] **Fase 2** — Monster DB e Skill DB com editors completos
- [x] **Fase 3** — Semantic Diff Engine, Undo/Redo, Discard, Criação de Entidades (+1)
- [ ] **Fase 4** — Item Combos, Random Options, Item Groups & Packages
