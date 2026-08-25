# rAthena Studio Engineering Skill

## Purpose

This skill defines the engineering rules, architectural constraints and development methodology for rAthena Studio.

The agent MUST follow this document whenever working on this project.

The goal is to produce production-quality software, not merely code that appears to work.

---

# 1. Core Philosophy

rAthena Studio is a specialized development environment for rAthena.

It must NOT be treated as:

* a generic YAML editor;
* a CRUD application;
* a collection of disconnected UI screens;
* a wrapper around shell commands.

It is a domain-specific development tool.

Every feature must respect the rAthena domain model.

---

# 2. Golden Rule

Before implementing anything related to rAthena:

1. Inspect the real rAthena structure.
2. Inspect the relevant source files.
3. Inspect real database files.
4. Identify the actual contract.
5. Identify edge cases.
6. Design the domain model.
7. Implement.
8. Test against real data.
9. Audit the implementation.
10. Only then consider the task complete.

Never invent rAthena behavior when the repository can be inspected.

---

# 3. Never Guess the Database Schema

Do not assume a YAML structure.

Do not invent:

* fields;
* types;
* enums;
* defaults;
* required properties;
* relationships;
* database versions;
* serialization behavior.

Schemas must be based on actual rAthena data and source code.

If uncertain, investigate before implementing.

---

# 4. YAML Is a First-Class Domain

YAML files are the source of truth.

The application must preserve their semantic meaning.

Do not convert the entire project into a proprietary database.

The internal model exists to safely manipulate rAthena data.

---

# 5. Parser Architecture

The YAML library must be isolated behind a project abstraction.

Do not spread raw YAML library objects throughout the application.

Prefer:

```text
YAML Library
     ?
YAML Adapter
     ?
Database Parser
     ?
Domain Model
     ?
Application
```

This allows the YAML implementation to change without rewriting the application.

---

# 6. Serialization Rules

Serialization must be deterministic.

Whenever possible:

* preserve formatting;
* preserve comments;
* preserve ordering;
* avoid unnecessary modifications;
* avoid rewriting entire files for tiny changes;
* avoid changing unrelated entries.

A user changing one item should not cause thousands of unrelated lines to change.

If perfect preservation is not technically possible, the limitation must be explicitly documented and the implementation should minimize diff noise.

---

# 7. Domain-Driven Design

The following concepts should exist independently from React:

```text
DatabaseDefinition
DatabaseEntry
DatabaseSchema
DatabaseParser
DatabaseSerializer
DatabaseValidator
ReferenceResolver
ValidationIssue
Workspace
ProcessDefinition
ProcessInstance
LogEntry
```

The UI must consume these concepts rather than implement domain logic itself.

---

# 8. Database Registry

Databases should be registered through a centralized mechanism.

Conceptually:

```text
DatabaseRegistry
+-- item
+-- mob
+-- skill
+-- quest
+-- instance
+-- ...
```

Each database adapter should define what it needs:

```text
id
name
file discovery
schema
parser
serializer
validator
search fields
reference providers
editor configuration
```

Avoid hardcoding database-specific behavior throughout the UI.

---

# 9. Generic Infrastructure First

If multiple databases share the same behavior, implement the behavior once.

Bad:

```text
ItemEditor
MobEditor
QuestEditor
InstanceEditor
```

each implementing their own:

* search;
* validation;
* loading;
* saving;
* undo;
* filtering.

Better:

```text
Generic Database Engine
        ?
Database Adapter
        ?
Item
Mob
Quest
Instance
```

Specialized behavior should exist only where the rAthena domain actually differs.

---

# 10. Validation

Validation must have multiple levels.

## Syntax

Is the YAML valid?

## Schema

Does the structure match the expected database schema?

## Semantic

Are values valid?

## Referential

Do references point to existing entities?

## Cross-file

Are relationships between databases valid?

Validation errors must be structured.

Example:

```text
ValidationIssue

severity
code
message
file
line
column
path
relatedEntity
suggestion
```

---

# 11. Reference Resolution

References are a major feature.

The system should eventually support:

```text
Skill
 ?
Item
 ?
Monster
 ?
Drop
```

The user should be able to navigate from one entity to another.

Example:

```text
Item #501
```

should allow:

```text
Find references
```

and show where that item is used.

---

# 12. Process Management

Never let React directly manage OS processes.

Use Tauri commands/services.

Architecture:

```text
React
 ?
Tauri Command
 ?
Rust Process Manager
 ?
OS Process
```

The process layer must support:

* lifecycle;
* stdout;
* stderr;
* exit status;
* PID;
* restart;
* cancellation;
* dependencies.

---

# 13. Process Safety

Never execute arbitrary user input as shell commands without explicit handling.

Prefer direct executable invocation with argument arrays.

Avoid shell interpolation.

Do not construct commands using unsafe string concatenation.

The process manager must distinguish:

```text
executable
arguments
working directory
environment
```

---

# 14. Runtime Dependencies

The application must not assume:

```text
C:\wamp64
```

or any other hardcoded installation path.

The user must be able to configure:

* rAthena root;
* MariaDB/MySQL executable;
* WAMP installation;
* server executables;
* working directories.

The application should provide automatic discovery where feasible, but always allow manual configuration.

---

# 15. WAMP / MariaDB

Treat WAMP/MariaDB as an external runtime dependency.

Do not tightly couple the architecture to WAMP.

The runtime system should support generic process/service definitions.

This allows future support for:

* standalone MariaDB;
* MySQL;
* Docker;
* custom installations;
* other development environments.

---

# 16. Logging

Logs must be treated as streams.

Do not repeatedly read the entire console buffer.

Use incremental streaming.

Normalize logs into:

```text
LogEntry

timestamp
process
stream
level
message
raw
```

The UI must be able to consume logs incrementally.

---

# 17. UI Architecture

React components should remain primarily responsible for presentation and interaction.

Avoid putting:

* filesystem access;
* YAML parsing;
* process spawning;
* business rules;
* validation algorithms

inside React components.

Use services/stores/domain modules instead.

---

# 18. State Management

Use Zustand for application state.

Separate:

```text
UI state
Domain state
Runtime state
Workspace state
```

Do not create one giant global store.

Prefer feature-oriented stores.

---

# 19. Performance

The application must remain responsive with large rAthena databases.

Avoid:

* parsing the same file repeatedly;
* unnecessary React renders;
* loading thousands of entities into expensive components;
* expensive filtering on every keystroke;
* blocking the UI thread;
* duplicated filesystem watchers.

Use:

* memoization;
* virtualization;
* indexing;
* incremental processing;
* debouncing where appropriate;
* background processing where necessary.

---

# 20. Filesystem Watching

Filesystem watchers must be centralized.

Never create independent watchers every time a screen opens.

The workspace should have a controlled watcher lifecycle.

External changes must be detected.

Example:

```text
User edits file externally
        ?
Filesystem watcher
        ?
Database Engine
        ?
Change detected
        ?
UI notification
```

If there are unsaved changes, the application must avoid silently overwriting them.

---

# 21. Unsaved Changes

Never discard user changes silently.

If an external modification conflicts with local unsaved changes:

```text
External change detected

[Compare]
[Keep Local]
[Reload External]
[Merge]
```

Conflict handling must be explicit.

---

# 22. Undo / Redo

Database editing should support undo/redo.

Prefer domain-level operations rather than relying entirely on text-editor undo.

Example:

```text
Change Item Price
Change Item Weight
Add Drop
Remove Drop
```

should be representable as reversible operations where practical.

---

# 23. Git

Git integration must operate independently from the core database engine.

Do not make Git mandatory.

Git operations should expose structured results.

Never assume Git is installed.

Detect its availability.

---

# 24. Error Handling

Never silently swallow errors.

Errors must contain enough context to diagnose the problem.

Bad:

```text
Error occurred
```

Better:

```text
Failed to save item_db.yml

Reason:
Invalid field 'Type'.

Location:
item_db.yml:142

The value 'FooBar' is not a valid ItemType.
```

---

# 25. Error Boundaries

The frontend must have proper error boundaries.

A single malformed database entry must not crash the entire application.

A single process failure must not crash the dashboard.

A malformed YAML file must result in a recoverable error state.

---

# 26. Testing

Tests should focus on behavior.

Minimum important test categories:

```text
Parser
Serializer
Schema
Validation
References
Filesystem
Process lifecycle
Logs
Git
UI integration
```

For parsers and serializers, use real rAthena fixtures whenever possible.

---

# 27. Real Fixtures

Create a fixture directory:

```text
tests/
+-- fixtures/
    +-- rathena/
        +-- item_db.yml
        +-- mob_db.yml
        +-- skill_db.yml
        +-- ...
```

Fixtures should represent real structures and edge cases.

Do not use only artificial toy YAML files.

---

# 28. Regression Protection

Every important bug discovered during development should result in a regression test.

Do not simply patch the symptom.

Identify:

1. root cause;
2. affected layer;
3. regression test;
4. fix;
5. verification.

---

# 29. Security

The application interacts with:

* local files;
* executables;
* processes;
* potentially Git repositories.

Treat these as privileged operations.

Validate paths.

Avoid arbitrary command execution.

Avoid shell injection.

Do not trust YAML values as executable content.

Never execute scripts merely because they are present in the workspace.

---

# 30. UX Principles

The application should feel like a professional IDE.

Prioritize:

* keyboard navigation;
* fast search;
* predictable interactions;
* clear hierarchy;
* minimal modal dialogs;
* contextual actions;
* consistent terminology;
* visible state;
* informative errors.

Do not sacrifice usability for architectural purity.

---

# 31. Database Editor UX

The structured editor should expose domain concepts.

Prefer:

```text
Type: [Healing ?]
```

over:

```text
Type: [Healing]
```

when the valid values are known.

Use:

* dropdowns;
* checkboxes;
* numeric inputs;
* references;
* autocomplete;
* searchable selectors.

But always provide access to raw YAML for advanced users.

---

# 32. Search

Search is a core feature.

Support eventually:

* ID;
* AegisName;
* display name;
* fields;
* tags;
* references;
* global search.

Search must remain responsive with large databases.

---

# 33. Command Palette

The application should eventually support a command palette.

Examples:

```text
Open Item Database
Open Monster Database
Search Database
Start Map Server
Restart Map Server
Open Console
Git Status
Validate Workspace
```

Keyboard-first interaction should be considered from the beginning.

---

# 34. Do Not Overengineer Prematurely

Do not implement advanced infrastructure before validating the need.

Build:

1. solid foundation;
2. working database engine;
3. first complete database;
4. generalized abstractions;
5. additional databases.

Do not build ten abstract layers before the first real workflow works.

---

# 35. Do Not Create Fake Functionality

Never create buttons that merely display:

```text
Coming soon
```

unless explicitly requested.

If a feature is not implemented, it should not pretend to be functional.

---

# 36. No Placeholder Architecture

Avoid fake implementations such as:

```text
return [];
return true;
TODO
mock data
fake process status
```

in production paths.

Temporary mocks must be isolated and clearly marked.

---

# 37. Before Modifying Existing Code

Before editing:

1. Read the relevant file.
2. Understand surrounding architecture.
3. Find callers.
4. Find dependencies.
5. Identify tests.
6. Determine whether the behavior is shared.
7. Make the smallest architectural change that correctly solves the problem.

Never rewrite large portions of the project without justification.

---

# 38. After Every Significant Change

Run the relevant verification.

At minimum:

* typecheck;
* lint;
* unit tests;
* build when appropriate.

For runtime functionality:

* manually verify the workflow;
* inspect logs;
* test failure cases.

---

# 39. Documentation

Documentation should describe actual behavior.

Never document functionality that does not exist.

When architecture changes significantly, update:

* docs;
* diagrams;
* schemas;
* development notes.

---

# 40. Development Workflow

For every substantial task:

```text
Understand
    ?
Inspect
    ?
Design
    ?
Implement
    ?
Test
    ?
Audit
    ?
Verify
```

Do not skip directly from request to implementation.

---

# 41. Completion Standard

Never report a task as complete merely because the code compiles.

A task is complete only when:

* implementation works;
* integration works;
* tests pass;
* edge cases were considered;
* errors are handled;
* no known regression exists;
* architecture remains coherent;
* behavior matches the actual rAthena contract.

---

# 42. Final Principle

The quality target is not:

"It works on my machine."

The quality target is:

"It is a reliable development tool that an experienced rAthena developer can trust with their server repository."

Every architectural decision should move the project toward that standard.
