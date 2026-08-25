# rAthena Studio — Plano Mestre de Desenvolvimento

## 1. Visão do Projeto

O rAthena Studio é uma aplicação desktop profissional para desenvolvimento, edição, validação e gerenciamento de servidores rAthena.

O objetivo NÃO é criar apenas um editor de YAML.

O objetivo é construir um ambiente integrado de desenvolvimento para rAthena, permitindo:

* Gerenciar databases YAML do rAthena.
* Editar Items, Monsters, Skills, Quests, Instances e demais databases suportadas.
* Validar estrutura e conteúdo dos databases.
* Detectar referências quebradas entre databases.
* Pesquisar rapidamente grandes volumes de dados.
* Visualizar e editar entidades através de interfaces estruturadas.
* Preservar a integridade dos arquivos YAML.
* Abrir o YAML bruto quando necessário.
* Gerenciar processos do ambiente rAthena.
* Iniciar e parar Login Server, Char Server e Map Server.
* Iniciar e parar MariaDB/MySQL e outros serviços configurados.
* Capturar stdout/stderr dos processos.
* Exibir logs em tempo real.
* Monitorar estado dos processos.
* Detectar automaticamente uma instalação existente do rAthena.
* Integrar Git ao fluxo de desenvolvimento.
* Permitir futuramente ferramentas avançadas de desenvolvimento de servidores.

A visão de longo prazo é transformar o rAthena Studio em uma IDE especializada para desenvolvimento e administração de servidores rAthena.

---

# 2. Princípios Fundamentais

## 2.1 Segurança dos dados

O aplicativo jamais deve modificar silenciosamente arquivos do usuário.

Toda operação de escrita deve:

1. Validar os dados.
2. Detectar alterações.
3. Preservar a integridade do arquivo.
4. Informar erros claramente.
5. Evitar perda de dados.

Operações destrutivas devem exigir confirmação quando apropriado.

---

## 2.2 Source of Truth

Os arquivos do rAthena continuam sendo a fonte de verdade.

O aplicativo NÃO deve criar um banco de dados proprietário que substitua os YAMLs.

O modelo interno deve representar os arquivos, não competir com eles.

---

## 2.3 Compatibilidade

O projeto deve ser desenvolvido considerando versões reais e atuais do rAthena.

Não assumir que todos os YAMLs possuem exatamente a mesma estrutura.

O parser, schema e validadores devem ser versionáveis.

---

## 2.4 Separação de responsabilidades

A aplicação deve separar claramente:

* UI.
* domínio rAthena.
* parsing.
* serialização.
* validação.
* filesystem.
* gerenciamento de processos.
* logs.
* Git.
* persistência das configurações da aplicação.

A UI nunca deve manipular diretamente processos do sistema operacional.

---

# 3. Stack Oficial

## Desktop

Tauri 2.

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui

## Estado

Zustand.

## Editor de código

Monaco Editor.

## Validação

Zod quando apropriado.

## Parsing

Implementar uma camada própria sobre uma biblioteca YAML madura.

A biblioteca YAML não deve vazar diretamente para toda a aplicação.

## Backend desktop

Rust através do Tauri.

Responsabilidades:

* filesystem;
* processos;
* stdout/stderr;
* filesystem watchers;
* Git;
* execução de comandos;
* gerenciamento do ambiente;
* operações privilegiadas quando estritamente necessárias.

---

# 4. Arquitetura

A arquitetura deve seguir aproximadamente:

rAthena Studio
¦
+-- UI
¦   +-- Dashboard
¦   +-- Database Explorer
¦   +-- Entity Editor
¦   +-- YAML Editor
¦   +-- Process Manager
¦   +-- Console
¦   +-- Logs
¦   +-- Git
¦   +-- Settings
¦
+-- Domain
¦   +-- Item
¦   +-- Monster
¦   +-- Skill
¦   +-- Quest
¦   +-- Instance
¦   +-- outros databases
¦
+-- Database Engine
¦   +-- Parser
¦   +-- Serializer
¦   +-- Schema
¦   +-- Validator
¦   +-- Reference Resolver
¦   +-- Search Index
¦
+-- Runtime Engine
¦   +-- Process Manager
¦   +-- Process Discovery
¦   +-- Log Manager
¦   +-- Environment Manager
¦
+-- Integrations
+-- Git
+-- Filesystem

````

---

# 5. Estrutura inicial de diretórios

A estrutura deve evoluir de forma modular:

```text
rathena-studio/
+-- .agent/
¦   +-- skills/
¦       +-- rathena-studio/
¦           +-- skill.md
¦
+-- docs/
¦   +-- plan.md
¦
+-- src/
¦   +-- app/
¦   +-- components/
¦   +-- features/
¦   +-- stores/
¦   +-- services/
¦   +-- domain/
¦   +-- lib/
¦   +-- types/
¦
+-- src-tauri/
¦   +-- src/
¦       +-- commands/
¦       +-- filesystem/
¦       +-- processes/
¦       +-- git/
¦       +-- logging/
¦
+-- tests/
````

A estrutura pode ser refinada durante a implementação, mas não deve ser transformada em um monólito.

---

# 6. Fases de Desenvolvimento

## Fase 0 — Discovery e especificação

Antes de implementar funcionalidades complexas:

* estudar a estrutura real dos databases YAML do rAthena;
* identificar databases existentes;
* identificar headers e versões;
* identificar relações entre databases;
* identificar particularidades de serialização;
* identificar campos obrigatórios;
* identificar enums;
* identificar referências;
* identificar diferenças entre versões.

Não inventar schemas.

Os schemas devem ser derivados do comportamento real do rAthena.

### Critério de conclusão

Existe documentação interna suficiente para implementar o primeiro database sem depender de suposições.

---

# Fase 1 — Fundação do Desktop

Implementar:

* Tauri 2;
* React;
* TypeScript;
* Vite;
* Tailwind;
* shadcn/ui;
* estrutura de pastas;
* Zustand;
* sistema de configuração;
* tratamento global de erros;
* logging interno da aplicação.

### Critério de conclusão

A aplicação inicia corretamente como desktop app e possui arquitetura preparada para as próximas fases.

---

# Fase 2 — Detecção do rAthena

Criar mecanismo para:

* selecionar diretório do rAthena;
* validar se é realmente uma instalação válida;
* detectar databases;
* detectar executáveis;
* detectar configuração relevante;
* armazenar o workspace selecionado.

Exemplo conceitual:

```text
Workspace
+-- root
+-- database
+-- db
+-- npc
+-- conf
+-- login-server
+-- char-server
+-- map-server
```

Não assumir caminhos fixos.

---

# Fase 3 — Database Engine

Esta é uma das partes mais importantes do projeto.

Criar:

* parser;
* serializer;
* schema registry;
* validator;
* error model;
* change tracking;
* filesystem watcher;
* referência cruzada;
* search engine.

O Database Engine deve ser independente da UI.

A UI deve consumir APIs de domínio.

---

# Fase 4 — Primeiro Database: Items

Implementar primeiro o database de Items.

Funcionalidades:

* listar;
* pesquisar;
* ordenar;
* filtrar;
* visualizar;
* editar;
* criar;
* duplicar;
* excluir;
* validar;
* salvar;
* desfazer alterações;
* refazer alterações;
* visualizar YAML bruto.

Critério de qualidade:

Uma alteração feita através da UI deve resultar em YAML válido e semanticamente equivalente ao modelo editado.

---

# Fase 5 — Database Explorer Genérico

Depois de validar o pipeline com Items, criar uma infraestrutura genérica capaz de suportar:

* Items;
* Monsters;
* Skills;
* Quests;
* Instances;
* Maps;
* Drops;
* Random Options;
* Achievements;
* outros databases relevantes.

Não criar uma implementação independente para cada database se a estrutura puder ser generalizada.

O sistema deve permitir registrar novos databases através de schemas/adapters.

---

# Fase 6 — Validação

Implementar validações:

### Estruturais

* YAML inválido;
* campo desconhecido;
* campo obrigatório ausente;
* tipo incorreto;
* enum inválido.

### Semânticas

* ID duplicado;
* AegisName duplicado;
* valores inválidos;
* combinações incompatíveis.

### Referenciais

* item inexistente;
* monster inexistente;
* skill inexistente;
* mapa inexistente;
* referência quebrada;
* referência circular quando não permitida.

Os erros devem possuir:

* severity;
* arquivo;
* localização;
* mensagem;
* código;
* possível solução.

---

# Fase 7 — YAML Editor

Integrar Monaco Editor.

O editor deve oferecer:

* syntax highlighting;
* autocomplete;
* validação;
* navegação;
* busca;
* replace;
* diagnostics;
* integração com schemas.

A edição estruturada e a edição textual devem permanecer sincronizadas de maneira segura.

---

# Fase 8 — Process Manager

Criar abstração genérica para processos.

Modelo:

```text
ProcessDefinition
+-- id
+-- name
+-- executable
+-- arguments
+-- workingDirectory
+-- environment
+-- dependencies
+-- autoRestart
```

Suportar:

* start;
* stop;
* restart;
* status;
* PID;
* exit code;
* stdout;
* stderr;
* tempo de execução.

---

# Fase 9 — rAthena Runtime

Criar perfis:

```text
Login Server
Char Server
Map Server
Database
```

Permitir:

* iniciar individualmente;
* parar individualmente;
* reiniciar;
* iniciar todos;
* parar todos.

Respeitar dependências.

Exemplo:

```text
Database
   ?
Login
   ?
Char
   ?
Map
```

---

# Fase 10 — Console e Logs

Criar terminal integrado.

Requisitos:

* stdout em tempo real;
* stderr em tempo real;
* múltiplos processos;
* tabs;
* filtros;
* busca;
* níveis;
* timestamps;
* auto-scroll;
* limpar;
* copiar;
* salvar;
* histórico.

Nunca bloquear a UI por causa de leitura de logs.

---

# Fase 11 — Git

Implementar:

* status;
* modified files;
* diff;
* stage;
* unstage;
* commit;
* branches;
* pull;
* push;
* revert.

O Git deve ser uma integração opcional e não uma dependência obrigatória para funcionamento básico.

---

# Fase 12 — UX avançada

Após a fundação estar estável:

* command palette;
* atalhos;
* tabs;
* favoritos;
* recent files;
* recent databases;
* dark mode;
* split editor;
* preview;
* breadcrumbs;
* navegação por referências;
* global search.

---

# Fase 13 — Testes

Cobertura obrigatória para:

* parser;
* serializer;
* schema;
* validator;
* reference resolver;
* process manager;
* log manager;
* filesystem watcher.

Testar principalmente casos reais e edge cases.

Nunca considerar uma funcionalidade concluída apenas porque a UI funciona.

---

# Fase 14 — Performance

O aplicativo deve continuar responsivo com databases grandes.

Evitar:

* carregar tudo na UI sem necessidade;
* re-renderizações desnecessárias;
* parsing repetitivo;
* serialização completa quando uma alteração localizada puder ser realizada com segurança;
* bloqueio da thread principal;
* watchers duplicados.

Pesquisar e indexar dados de forma eficiente.

---

# 7. Critérios Globais de Qualidade

Uma funcionalidade só pode ser considerada concluída quando:

* funciona;
* está integrada à arquitetura;
* possui tratamento de erro;
* possui testes apropriados;
* não introduz regressões;
* possui UX consistente;
* respeita os princípios do projeto;
* funciona com dados reais;
* não depende de comportamento inventado.

---

# 8. Regra de Ouro

Nunca implementar primeiro e descobrir depois como o rAthena realmente funciona.

Para qualquer funcionalidade relacionada ao rAthena:

1. Inspecionar o código/estrutura real.
2. Identificar o contrato existente.
3. Documentar o comportamento.
4. Implementar.
5. Testar contra dados reais.
6. Auditar.
7. Só então considerar concluído.

---

# 9. Definition of Done

Uma tarefa está concluída somente quando:

* [ ] implementação concluída;
* [ ] integração concluída;
* [ ] erros tratados;
* [ ] testes executados;
* [ ] casos extremos considerados;
* [ ] nenhuma funcionalidade existente quebrada;
* [ ] código revisado;
* [ ] documentação atualizada quando necessário;
* [ ] comportamento verificado contra dados reais do rAthena.

---

# 10. Direção do Produto

O rAthena Studio deve evoluir de:

Editor de YAML

para:

Database IDE

para:

rAthena Development Environment

para:

ambiente completo de desenvolvimento e administração de servidores rAthena.

A arquitetura inicial deve permitir essa evolução sem exigir uma reescrita completa.
