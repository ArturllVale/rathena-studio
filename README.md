# rAthena Studio

**rAthena Studio** é uma IDE desktop de alto desempenho para administração e desenvolvimento de servidores de Ragnarok Online baseados no emulador [rAthena](https://github.com/rathena/rathena). Permite exploração, edição visual, validação semântica e persistência transacional de bases de dados YAML com rastreamento de proveniência de camada por campo e preservação estrita de AST.

---

## Funcionalidades Implementadas

### Database Explorer Multi-Camadas (Multi-Layer Inheritance)
- Carregamento unificado dos **7 principais bancos de dados** do rAthena em uma única operação com seleção de variante `Renewal (RE)` ou `Pre-Renewal (PRE-RE)`:
  - **Item Database (`item_db`)**
  - **Monster Database (`mob_db`)**
  - **Skill Database (`skill_db`)**
  - **Item Combos (`item_combos`)**
  - **Item Groups & Random Boxes (`item_group_db`)**
  - **Item Packages (`item_packages`)**
  - **Random Options (`item_randomopt_db` & `item_randomopt_group`)**
- Barra de progresso visual com feedback em tempo real e contadores por banco.
- Scroll virtualizado a 60 FPS com suporte comprovado a **25.000+ entidades** simultâneas via `@tanstack/react-virtual`.
- Resolução em camadas com hierarquia canônica de prioridade: `BASE → MODE_SPECIFIC → IMPORT → CUSTOM`.

### Item Inspector & Linked Systems (Referências Cruzadas)
- Edição completa de todos os 33 campos YAML: identidade, tipo/subtipo, preços, atributos de combate, restrições de job/classe/localização, subestruturas (`Flags`, `Trade`, `Delay`, `Stack`, `NoUse`) e scripts (`Script`, `EquipScript`, `UnEquipScript`).
- **Linked Systems & Cross-References**: Aba integrada exibindo em tempo real:
  - **Item Combos**: Combos ativos que utilizam o item e seus scripts de bônus.
  - **Item Groups & Boxes**: Caixas de drop e grupos aleatórios onde o item é sorteado (com taxa `%` e quantidade).
  - **Item Packages**: Pacotes e bundles que contêm o item.
- Criação de novos itens (`+ New Item`) com validação instantânea de duplicidade de ID e AegisName.

### Monster Inspector
- Edição de identidade, atributos base (STR/AGI/VIT/INT/DEX/LUK), estatísticas de combate, EXP base/job/MVP, AI modes (`01`-`27`), 24 modos comportamentais e tabelas de Drops & MVP Drops com taxa calculada.
- Criação de novos monstros (`+ New Monster`) com auto-sugestão de próximo ID disponível.

### Skill Inspector
- Edição de identidade, mecânicas, tipos de alvo, custos de SP/HP/AP/Zeny (uniformes ou matrizes por nível 1..MaxLevel), requisitos de armas, catalisadores e unidades de área de efeito.
- Criação de novas habilidades (`+ New Skill`) com seleção da camada de persistência.

### Item Combo Inspector
- Suporte a combos padrão (`Combo: [ItemA, ItemB]`) e blocos agrupados com mesmo script (`Combos: [{Combo: ...}]`).
- Editor de itens participantes e script de bônus com syntax highlighting e linter.

### Item Group Inspector
- Suporte a grupos com **`SubGroups`** (`SubGroup: 0` para obtenção garantida + `SubGroup: 1..N` ponderados por taxa) e listas diretas.
- Cobertura de todos os 14 campos rAthena: `Rate`, `Amount`, `Duration`, `Announced`, `UniqueId`, `Stacked`, `Named`, `Bound`, `RandomOptionGroup`, `RefineMinimum`, `RefineMaximum`, `Clear`, `Index`.
- Gestão dinâmica: adicionar/remover itens e criar novos sub-grupos com um clique.

### Item Package Inspector
- Edição de pacotes com opções randômicas (`RandomOptions`) e grupos de slots fixos/ponderados (`Groups`).

### Random Options Inspector
- Suporte a constantes de opções randômicas (`RANDOM_OPTION_DB`) e grupos com faixas de valores e chances em base 10.000 (`RANDOM_OPTION_GROUP`).

### Layer Hierarchy & Proveniência por Campo
- Cada campo inspecionado exibe sua origem exata (arquivo e camada) com badges numerados e chips de proveniência.

### Semantic Diff Engine (GitHub-Style)
- Diff semântico recursivo exibido em estilo Git (`-` original / `+` modificado) para todas as alterações pendentes.

### Persistência Transacional (Atomic AST Writes)
- **Undo / Redo** granular por campo via Command Pattern (`FieldEditCommand`, `undoStack`, `redoStack`).
- **Discard**: reversão instantânea ao estado original via `reset()`.
- **Atomic Save**: validação de regras de negócio → mutação semântica no nó do AST → escrita atômica no disco → recarga da camada afetada.
- **Target Layer Policy**: alterações em campos herdados de arquivos base são automaticamente direcionadas para `db/import/`.

---

## Arquitetura

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                        UI & Presentation Layer                           │
│  - DatabasesView (Unified loader, progress bar, variant selector)        │
│  - Item / Mob / Skill / Combo / Group / Package / RandomOpt Explorers    │
│  - Modular Inspectors (Identity, Combat, Reqs, Scripts, Drops, SubGroups)│
│  - SemanticDiffViewer (GitHub-style -/+ diff)                            │
│  - Entity Creation Modals (+ New Item, Mob, Skill, Combo, Group, etc.)   │
│  - Virtual Lists (@tanstack/react-virtual, 60 FPS, 25k+ entities)        │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                   State & Transaction Orchestration                      │
│  - useDatabaseStore (Registry discovery, global filters & selection)     │
│  - EditStores & EditSessions (Item, Mob, Skill, Combo, Group, Package)   │
│    (Command Pattern: FieldEditCommand, undoStack, redoStack)             │
│  - TransactionServices (Validate → AST Mutate → File Write → Reload)     │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                 Database Workspace & Provider Registry                   │
│  - DatabaseRegistry (Provider discovery & metadata catalog)              │
│  - Layered Repositories (Item, Mob, Skill, Combo, Group, Package, ROpt)  │
│  - Reverse Indexing (Cross-references item ↔ combos, groups, packages)   │
│  - DatabaseContextLoader (Layer discovery & ordering by priority)        │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                     Database Engine & CST Layer                          │
│  - SourceEntity (per-file raw state) vs EffectiveEntity (composite)      │
│  - AST Parsers & Serializers (yaml v2 AST round-trip fidelity)           │
│  - Database Validators & RathenaScriptValidator                          │
│  - semanticDiff.ts (recursive deep diff engine)                          │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                     Tauri IPC & Native Host Layer                        │
│  - TauriLayerFileContentProvider / TauriFileContentWriter                │
│  - Rust Backend (Tauri 2, File System, Capabilities)                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

| Camada | Tecnologia |
| :--- | :--- |
| **Desktop Shell** | Tauri 2 (Rust) |
| **Frontend** | React 19 + TypeScript 5.7 |
| **State Management** | Zustand 5 |
| **Virtualização** | `@tanstack/react-virtual` 3 |
| **Parsing & AST** | `yaml` 2 (CST & Document AST) |
| **UI Components** | Radix UI + Lucide Icons |
| **Estilização** | Tailwind CSS 3 |
| **Build Tool** | Vite 6 |
| **Testes Automatizados** | Vitest 3 (**120 testes, 22 suítes**) |

---

## Estrutura de Diretórios

```text
rathena-studio/
├── docs/
│   ├── database-engine/           # Especificações de schema e round-trip
│   ├── database-schema-audit.md   # Auditoria detalhada vs dados reais do rAthena
│   └── plan.md                    # Plano mestre de fases de desenvolvimento
├── src/
│   ├── app/                       # Layout principal e inicializadores
│   ├── components/ui/             # Componentes reutilizáveis (Input, Select, Card, Button)
│   ├── domain/database/           # Definições de domínio e sessões de edição
│   │   ├── combo/                 # SourceCombo, EffectiveCombo, ComboTypes
│   │   ├── common/                # Context, DatabaseLayer, DatabaseVariant
│   │   ├── item/                  # SourceItem, EffectiveItem, ItemTypes
│   │   ├── itemGroup/             # SourceItemGroup, EffectiveItemGroup, GroupTypes
│   │   ├── itemPackage/           # SourceItemPackage, EffectiveItemPackage, PackageTypes
│   │   ├── mob/                   # SourceMob, EffectiveMob, MobTypes
│   │   ├── provider/              # DatabaseProvider contract & DatabaseRegistry
│   │   ├── randomOpt/             # SourceRandomOpt, EffectiveRandomOpt, RandomOptTypes
│   │   ├── skill/                 # SourceSkill, EffectiveSkill, SkillTypes
│   │   └── workspace/             # EditSessions com Undo/Redo (Command Pattern)
│   ├── features/databases/        # Visualizações de Explorer, Inspectors e Modais
│   │   ├── combos/                # ComboExplorerView, ComboInspector, CreateComboModal
│   │   ├── common/                # SemanticDiffViewer
│   │   ├── itemGroups/            # ItemGroupExplorerView, ItemGroupInspector, CreateGroupModal
│   │   ├── itemPackages/          # ItemPackageExplorerView, ItemPackageInspector, CreatePackageModal
│   │   ├── items/                 # ItemExplorerView, ItemInspector, CreateItemModal
│   │   ├── mobs/                  # MobExplorerView, MobInspector, CreateMobModal
│   │   ├── randomOptions/         # RandomOptionExplorerView, RandomOptionInspector, CreateRandomOptModal
│   │   └── skills/                # SkillExplorerView, SkillInspector, CreateSkillModal
│   ├── services/database/         # Parsers, Serializers, Repositories e TransactionServices
│   │   ├── combo/                 # ComboDatabaseParser, Serializer, Repository, Validator
│   │   ├── item/                  # ItemDatabaseParser, Serializer, Repository, Validator
│   │   ├── itemGroup/             # ItemGroupDatabaseParser, Serializer, Repository, Validator
│   │   ├── itemPackage/           # ItemPackageDatabaseParser, Serializer, Repository, Validator
│   │   ├── mob/                   # MobDatabaseParser, Serializer, Repository, Validator
│   │   ├── providers/             # Provedores registrados no DatabaseRegistry
│   │   ├── randomOpt/             # RandomOptDatabaseParser, Serializer, Repository, Validator
│   │   └── skill/                 # SkillDatabaseParser, Serializer, Repository, Validator
│   ├── stores/                    # Zustand Stores (databaseStore, editStores, workspaceStore)
│   └── utils/                     # Utilitários (semanticDiff, script completions)
├── src-tauri/                     # Código Rust Tauri 2 e permissões de filesystem
├── tests/                         # 22 suítes de testes Vitest
└── package.json
```

---

## Bancos de Dados Suportados

| Banco | Header Type | Arquivos YAML Lidos | Status |
| :--- | :--- | :--- | :---: |
| **Item DB** | `ITEM_DB` | `item_db_usable.yml`, `item_db_equip.yml`, `item_db_etc.yml`, `db/import/item_db*.yml` | ✅ Completo |
| **Monster DB** | `MOB_DB` | `mob_db.yml`, `mob_avail_db.yml`, `db/import/mob_db.yml` | ✅ Completo |
| **Skill DB** | `SKILL_DB` | `skill_db.yml`, `db/import/skill_db.yml` | ✅ Completo |
| **Item Combos** | `ITEM_COMBOS_DB` / `COMBO_DB` | `item_combos.yml`, `db/import/item_combos.yml` | ✅ Completo |
| **Item Groups** | `ITEM_GROUP_DB` | `item_group_db.yml`, `db/import/item_group_db.yml` | ✅ Completo |
| **Item Packages** | `ITEM_PACKAGES` / `ITEM_PACKAGE_DB` | `item_packages.yml`, `db/import/item_packages.yml` | ✅ Completo |
| **Random Options** | `RANDOM_OPTION_DB` / `RANDOM_OPTION_GROUP` | `item_randomopt_db.yml`, `item_randomopt_group.yml` | ✅ Completo |

---

## Desenvolvimento & Testes

### Instalação

```bash
npm install
```

### Modos de Execução

```bash
# Web (Vite HMR)
npm run dev

# Desktop (Tauri 2 + Vite HMR)
npm run tauri:dev
```

### Validação da Suite de Testes

```bash
# Vitest — 120 testes em 22 suítes (unit + integration + audit real do rAthena)
npm run test

# Checagem estrita de tipos TypeScript
npm run typecheck

# Linter ESLint
npm run lint

# Build de produção
npm run build

# Validação do backend Rust
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## Roadmap

- [x] **Fase 1** — Fundação Tauri 2 + React 19 e parsing em camadas (`item_db`)
- [x] **Fase 2** — Monster Database (`mob_db`) com editor de IA e drops
- [x] **Fase 3** — Skill Database (`skill_db`) com editor de matrizes de custo/delay
- [x] **Fase 4** — Item Database completo com subestruturas e script editor
- [x] **Fase 5** — Transações atômicas, Undo/Redo, Diff Semântico e criação de registros (+1)
- [x] **Fase 6** — Validação e conformidade com dados reais de larga escala (25k+ registros)
- [x] **Fase 7** — Item Combos, Item Groups, Item Packages, Random Options & Referências Cruzadas
- [ ] **Fase 8** — Editor Monaco integrado & Autocomplete avançado de scripts
- [ ] **Fase 9** — Process Manager para inicialização e monitoramento de Login/Char/Map servers
