# Especificação Completa do Schema `item_db.yml` (rAthena)

**Status**: Verified contra `horizonro/src/map/itemdb.cpp`, `itemdb.hpp`, `script_constants.hpp`.  
**Versão do Schema**: Header Version `3` (Versão Mínima: `1`).

---

## 1. Dicionário Completo de Campos do Body de Itens

| Campo | Tipo YAML | Obrigatório? | Default (se novo) | Descrição e Validação [Status] |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `integer` | **Sim** | — | ID numérico do item (`uint32`). Faixa: 1 a 4.294.967.295. `512` é o item desconhecido padrão (*Apple*), `499` é *DUMMY_ITEM*. [Verified] |
| `AegisName` | `string` | **Sim\*** | — | Identificador alfanumérico único para scripts/comandos (max 50 chars). Case-insensitive. *\*Obrigatório apenas em novas entidades; opcional em overrides.* [Verified] |
| `Name` | `string` | **Sim\*** | — | Nome de exibição em inglês (max 50 chars). *\*Obrigatório em novas entidades.* [Verified] |
| `Type` | `string` (Enum) | Não | `Etc` | Tipo do item (`IT_*`). Ver tabela de tipos abaixo. [Verified] |
| `SubType` | `string` (Enum) | Não | `0` | Subtipo específico de Arma, Munição ou Carta. Inválido para outros tipos. [Verified] |
| `Buy` | `integer` | Não | `0` (ou `Sell * 2`) | Preço de compra em Zeny (`uint32`, max `MAX_ZENY`). Se omitido e `Sell` existir, calcula `Sell * 2`. [Verified] |
| `Sell` | `integer` | Não | `0` (ou `Buy / 2`) | Preço de venda em Zeny (`uint32`, max `MAX_ZENY`). Se omitido e `Buy` existir, calcula `Buy / 2`. [Verified] |
| `Weight` | `integer` | Não | `0` | Peso do item (`uint32`). 10 unidades de Weight = 1.0 de peso no cliente. [Verified] |
| `Attack` | `integer` | Não | `0` | Poder de ataque físico (`uint32`). [Verified] |
| `MagicAttack` | `integer` | Não | `0` | Poder de ataque mágico (`uint32`, ativo em Renewal). [Verified] |
| `Defense` | `integer` | Não | `0` | Defesa do equipamento (`uint32`, capped em `DEFTYPE_MAX`). [Verified] |
| `Range` | `integer` | Não | `0` | Alcance do ataque (`uint16`, capped em `AREA_SIZE`). [Verified] |
| `Slots` | `integer` | Não | `0` | Quantidade de slots para cartas (`uint16`, max `MAX_SLOTS` = 4). [Verified] |
| `Jobs` | `map<string, bool>` | Não | `All: true` | Dicionário de classes permitidas. Aceita `All: true/false` e nomes de classes específicos. [Verified] |
| `Classes` | `map<string, bool>` | Não | `All: true` | Dicionário de classificações de classe permitidas (`ITEMJ_*`). [Verified] |
| `Gender` | `string` (Enum) | Não | `Both` | Restrição de gênero: `Male`, `Female`, `Both`. Instrumentos musicais forçam `Male`, Chicotes forçam `Female`. [Verified] |
| `Locations` | `map<string, bool>` | Não | `None` / `0` | Dicionário de posições de equipamento (`EQP_*`). Se for equipamento e não tiver location, emite warning e rebaixa para `Type: Etc`. [Verified] |
| `WeaponLevel` | `integer` | Não | `1` (se Weapon) | Nível da arma (`uint16`, 0 a 5). Se o item não for arma, forçado para 0. [Verified] |
| `ArmorLevel` | `integer` | Não | `1` (se Armor) | Nível da armadura (`uint16`, 0 a 2). Se o item não for armadura, forçado para 0. [Verified] |
| `EquipLevelMin`| `integer` | Não | `0` | Nível mínimo de base para equipar (`uint16`, max `MAX_LEVEL`). [Verified] |
| `EquipLevelMax`| `integer` | Não | `MAX_LEVEL` | Nível máximo de base para equipar (`uint16`, max `MAX_LEVEL`). [Verified] |
| `Refineable` | `boolean` | Não | `false` | Se permite refinamento. No C++ mapeado para `flag.no_refine = !refine`. [Verified] |
| `Gradable` | `boolean` | Não | `false` | Se permite encantamento de grade / grading (Renewal). [Verified] |
| `View` | `integer` | Não | `0` | ID de sprite visual / look do item (`uint32`). [Verified] |
| `AliasName` | `string` | Não | `null` | AegisName de outro item cujo View será utilizado. [Verified] |
| `Flags` | `map` | Não | `null` | Sub-nó com flags de comportamento no servidor/cliente. [Verified] |
| `Delay` | `map` | Não | `null` | Sub-nó com configuração de cooldown e delay de uso. [Verified] |
| `Stack` | `map` | Não | `null` | Sub-nó com regras de empilhamento no inventário/armazém. [Verified] |
| `NoUse` | `map` | Não | `null` | Sub-nó com restrições de uso (ex: sentado). [Verified] |
| `Trade` | `map` | Não | `null` | Sub-nó com restrições de negociação e transferência. [Verified] |
| `Script` | `string` | Não | `null` | Código de script executado ao usar ou equipar. [Verified] |
| `EquipScript` | `string` | Não | `null` | Código de script executado ao equipar. [Verified] |
| `UnEquipScript`| `string` | Não | `null` | Código de script executado ao desequipar. [Verified] |

---

## 2. Enums e Subtipos Confirmados

### 2.1 `Type` (`IT_*`)
- `Healing` (Itens de recuperação de HP/SP)
- `Usable` (Itens consumíveis gerais com script de uso)
- `Etc` (Itens diversos, drops, materiais de forja)
- `Armor` (Equipamentos de armadura, escudo, capacete, capas, sapatos, acessórios)
- `Weapon` (Armas de qualquer categoria)
- `Card` (Cartas de inserção e encantos)
- `PetEgg` (Ovos de mascotes)
- `PetArmor` (Equipamentos de mascotes)
- `Ammo` (Projéteis, flechas, munições, pedras, kunais)
- `DelayConsume` (Itens consumíveis com confirmação de alvo pré-consumo)
- `ShadowGear` (Equipamentos da aba Shadow)
- `Cash` (Itens da loja de cash / pacotes de abertura)

### 2.2 `SubType` por Categoria

#### Quando `Type: Weapon` (`W_*`)
- `Fist`, `Dagger`, `1hSword`, `2hSword`, `1hSpear`, `2hSpear`, `1hAxe`, `2hAxe`, `Mace`, `2hMace`, `Staff`, `Bow`, `Knuckle`, `Musical`, `Whip`, `Book`, `Katar`, `Revolver`, `Rifle`, `Gatling`, `Shotgun`, `Grenade`, `Huuma`, `2hStaff`.

#### Quando `Type: Ammo` (`AMMO_*`)
- `Arrow`, `Dagger`, `Bullet`, `Shell`, `Grenade`, `Shuriken`, `Kunai`, `Cannonball`, `ThrowWeapon`.

#### Quando `Type: Card` (`CARD_*`)
- `Normal`, `Enchant`.

---

## 3. Sub-estruturas Aninhadas

### 3.1 `Flags`
```yaml
Flags:
  BuyingStore: true        # Apenas para itens empilháveis (isStackable). Se não for, emite warning e desativa.
  DeadBranch: false        # Registrado em branchlog e proibido em mapas com flag nobranch.
  Container: false         # Item do tipo recipiente/grupo de itens.
  UniqueId: false          # Anexa GUID ao item tornando-o único e vinculado.
  BindOnEquip: false       # Vincula o item ao personagem no momento em que for equipado.
  DropAnnounce: false      # Emite anúncio especial para o jogador ao dropar de monstros.
  NoConsume: false         # Se true, não consome a unidade do item após o uso.
  DropEffect: None         # Efeito visual de drop. Valores: None, Client, White_Pillar, Blue_Pillar, Yellow_Pillar, Purple_Pillar, Orange_Pillar, Green_Pillar, Red_Pillar.
```

### 3.2 `Delay`
```yaml
Delay:
  Duration: 5              # Duração em segundos (uint32).
  Status: POTION_DELAY     # Status Change associado (constante SC_*, ex: NONE, POTION_DELAY).
```

### 3.3 `Stack`
```yaml
Stack:
  Amount: 100              # Quantidade máxima de empilhamento (apenas itens empilháveis).
  Inventory: true          # Aplica limite ao inventário.
  Cart: true               # Aplica limite ao carrinho.
  Storage: true            # Aplica limite ao armazém comum.
  GuildStorage: true       # Aplica limite ao armazém do clã.
```

### 3.4 `NoUse`
```yaml
NoUse:
  Override: 100            # Nível de grupo de GM para ignorar restrições (default: 100, max: 100).
  Sitting: true            # Proíbe o uso enquanto o personagem estiver sentado.
```

### 3.5 `Trade`
```yaml
Trade:
  Override: 100            # Nível de GM para ignorar restrições de troca (default: 100, max: 100).
  NoDrop: true             # Não pode ser dropado no chão.
  NoTrade: true            # Não pode ser colocado em trade.
  TradePartner: true       # Não pode ser trocado com cônjuge.
  NoSell: true             # Não pode ser vendido em NPC.
  NoCart: true             # Não pode ser colocado no carrinho.
  NoStorage: true          # Não pode ser colocado no armazém.
  NoGuildStorage: true     # Não pode ser colocado no armazém do clã.
  NoMail: true             # Não pode ser enviado por correio/RODEX.
  NoAuction: true          # Não pode ser leiloado.
```

### 3.6 `Locations`
Chaves booleanas correspondentes a `EQP_*`:
- `Head_Top`, `Head_Mid`, `Head_Low`
- `Armor`, `Right_Hand`, `Left_Hand`, `Garment`, `Shoes`
- `Right_Accessory`, `Left_Accessory`, `Both_Accessory`
- `Costume_Head_Top`, `Costume_Head_Mid`, `Costume_Head_Low`, `Costume_Garment`
- `Ammo`
- `Shadow_Armor`, `Shadow_Weapon`, `Shadow_Shield`, `Shadow_Shoes`, `Shadow_Right_Accessory`, `Shadow_Left_Accessory`, `Both_Shadow_Accessory`

---

## 4. Regras Pós-Carregamento (`loadingFinished`)

No rAthena, após ler todos os nós de um arquivo ou lote de imports, o método `loadingFinished` executa pós-processamento imperativo:

1. **Preço Relacional Cruzado**:
   - Se `Buy` for informado mas `Sell` for omitido: `Sell = Buy / 2`.
   - Se `Sell` for informado mas `Buy` for omitido: `Buy = Sell * 2`.
   - Exploit Guard: Se `(Buy / 124.0) < (Sell / 75.0)` (permitiria ganho infinito de zeny com desconto/superfaturamento), o rAthena emite warning e reseta `Sell` para `1`.
2. **Nível de Arma vs Armadura**:
   - Se `Type == Weapon` e `WeaponLevel == 0`: emite warning e ajusta para `1`. Se tiver `ArmorLevel != 0`, zera `ArmorLevel`.
   - Se `Type == Armor` e `ArmorLevel == 0`: emite warning e ajusta para `1`. Se tiver `WeaponLevel != 0`, zera `WeaponLevel`.
   - Se `Type` não for nem arma nem armadura: zera `WeaponLevel` e `ArmorLevel`.
3. **Escudos**:
   - Se `Type == Armor` com location `EQP_SHIELD` e `View / Look == 0`, ajusta `look = 1` (Guard) para compatibilidade com rotinas de skill (`ST_SHIELD`).
