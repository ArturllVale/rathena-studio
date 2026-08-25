# Requisitos de Round-Trip para o Database Engine

**Status**: Verified e Definido.  
**Objetivo**: Estabelecer formalmente os níveis de preservação de fidelidade do arquivo YAML durante ciclos de leitura, edição e escrita.

---

## 1. Níveis Formais de Round-Trip

```text
YAML Original  ──>  Parse  ──>  Domain Model  ──>  Serialize  ──>  YAML Final
```

### 1. Semantic Round-Trip (Nível Básico)
- **Definição**: O YAML resultante após serialização representa os mesmos dados lógicos interpretados pelo emulador rAthena (`s_item_data`), mesmo que a ordem dos campos ou espaços tenham sido alterados.
- **Quando é aceitável**: Criação de arquivos inteiramente novos do zero ou conversão/migração entre formatos legados.

### 2. Structural Round-Trip (Nível Intermediário)
- **Definição**: O YAML mantém a estrutura hierárquica, a ordem original das entidades e campos, e a presença de campos desconhecidos/customizados.
- **Quando é exigido**: Edição em massa de itens ou merge de arquivos onde a semântica de diff do Git precisa ser mantida limpa.

### 3. Textual Round-Trip (Nível Máximo de Fidelidade)
- **Definição**: Quando o arquivo é aberto e salvo sem alterações (ou com alteração pontual em um único item), o arquivo final permanece **idêntico byte a byte** (ou com diff restrito exclusivamente às linhas editadas), preservando:
  - Cabeçalhos de licença rAthena;
  - Comentários de bloco (`# ...`);
  - Comentários de fim de linha (trailing comments);
  - Linhas em branco e espaçamento visual entre itens;
  - Estilo de bloco literal de scripts (`Script: |`);
  - Formato de números e representações booleanas.
- **Quando é exigido**: **Operação padrão do rAthena Studio em arquivos existentes**.

---

## 2. Matriz de Requisitos por Tipo de Operação

| Operação no rAthena Studio | Nível de Round-Trip Exigido | Comentários Preservados? | Diff no Git |
| :--- | :--- | :--- | :--- |
| **Apenas Visualização / Leitura** | N/A (Sem escrita) | Sim | Zero diff |
| **Edição de Campo Existente** (Ex: Alterar Attack de 25 para 30) | **Textual Round-Trip** | **Sim (100%)** | Apenas 1 linha modificada no diff |
| **Adição de Novo Item em Arquivo Existente** | **Structural Round-Trip** | **Sim** (Comentários dos itens vizinhos preservados) | Apenas bloco do novo item inserido ao final de `Body` |
| **Exclusão de Item em Arquivo Existente** | **Textual Round-Trip** | **Sim** (Remove apenas o nó do item sem afetar outros) | Apenas as linhas do item excluído no diff |
| **Geração de Novo Arquivo Custom (`item_db2.yml` / `import`)** | **Structural Round-Trip** | Sim (Gera template canônico com cabeçalho formatado) | Arquivo criado no padrão rAthena |

---

## 3. Estratégia de Implementação no Database Engine

Para alcançar o **Textual Round-Trip** sem complexidade desnecessária:
1. Ao carregar um arquivo YAML, o Database Engine mantém em memória a instância de `yaml.Document` associada àquele arquivo específico.
2. Cada entidade do `Domain Model` armazena um ponteiro/caminho para o nó correspondente no `yaml.Document` (`doc.contents.items[...]`).
3. Quando uma propriedade é alterada pela UI, a mutação é executada no nó do `yaml.Document` (`itemNode.set("Attack", 30)`).
4. A gravação no disco invoca `doc.toString()`, que preserva todos os comentários, formatações e nós vizinhos inalterados.
