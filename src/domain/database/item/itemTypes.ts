// Limits & Engine Constants verified from rAthena source (itemdb.hpp / script_constants.hpp)
export const MAX_ZENY = 2_147_483_647;
export const MAX_SLOTS = 4;
export const MAX_LEVEL = 999;
export const DEFTYPE_MAX = 1000;
export const AREA_SIZE = 14;
export const MAX_WEAPON_LEVEL = 5;
export const MAX_ARMOR_LEVEL = 2;
export const ITEM_NAME_LENGTH = 50;
export const UNKNOWN_ITEM_ID = 512;
export const DUMMY_ITEM_ID = 499;

export type ItemType =
  | 'Healing'
  | 'Usable'
  | 'Etc'
  | 'Armor'
  | 'Weapon'
  | 'Card'
  | 'PetEgg'
  | 'PetArmor'
  | 'Ammo'
  | 'DelayConsume'
  | 'ShadowGear'
  | 'Cash';

export const ITEM_TYPES: readonly ItemType[] = [
  'Healing',
  'Usable',
  'Etc',
  'Armor',
  'Weapon',
  'Card',
  'PetEgg',
  'PetArmor',
  'Ammo',
  'DelayConsume',
  'ShadowGear',
  'Cash',
] as const;

export type WeaponSubType =
  | 'Fist'
  | 'Dagger'
  | '1hSword'
  | '2hSword'
  | '1hSpear'
  | '2hSpear'
  | '1hAxe'
  | '2hAxe'
  | 'Mace'
  | '2hMace'
  | 'Staff'
  | 'Bow'
  | 'Knuckle'
  | 'Musical'
  | 'Whip'
  | 'Book'
  | 'Katar'
  | 'Revolver'
  | 'Rifle'
  | 'Gatling'
  | 'Shotgun'
  | 'Grenade'
  | 'Huuma'
  | '2hStaff';

export const WEAPON_SUBTYPES: readonly WeaponSubType[] = [
  'Fist',
  'Dagger',
  '1hSword',
  '2hSword',
  '1hSpear',
  '2hSpear',
  '1hAxe',
  '2hAxe',
  'Mace',
  '2hMace',
  'Staff',
  'Bow',
  'Knuckle',
  'Musical',
  'Whip',
  'Book',
  'Katar',
  'Revolver',
  'Rifle',
  'Gatling',
  'Shotgun',
  'Grenade',
  'Huuma',
  '2hStaff',
] as const;

export type AmmoSubType =
  | 'Arrow'
  | 'Dagger'
  | 'Bullet'
  | 'Shell'
  | 'Grenade'
  | 'Shuriken'
  | 'Kunai'
  | 'Cannonball'
  | 'ThrowWeapon';

export const AMMO_SUBTYPES: readonly AmmoSubType[] = [
  'Arrow',
  'Dagger',
  'Bullet',
  'Shell',
  'Grenade',
  'Shuriken',
  'Kunai',
  'Cannonball',
  'ThrowWeapon',
] as const;

export type CardSubType = 'Normal' | 'Enchant';
export const CARD_SUBTYPES: readonly CardSubType[] = ['Normal', 'Enchant'] as const;

export type ItemSubType = WeaponSubType | AmmoSubType | CardSubType | string;

export type GenderRestriction = 'Male' | 'Female' | 'Both';
export const GENDER_RESTRICTIONS: readonly GenderRestriction[] = ['Male', 'Female', 'Both'] as const;

export type ItemDropEffect =
  | 'None'
  | 'Client'
  | 'White_Pillar'
  | 'Blue_Pillar'
  | 'Yellow_Pillar'
  | 'Purple_Pillar'
  | 'Orange_Pillar'
  | 'Green_Pillar'
  | 'Red_Pillar'
  | string;

export interface ItemFlags {
  readonly BuyingStore?: boolean;
  readonly DeadBranch?: boolean;
  readonly Container?: boolean;
  readonly UniqueId?: boolean;
  readonly BindOnEquip?: boolean;
  readonly DropAnnounce?: boolean;
  readonly NoConsume?: boolean;
  readonly DropEffect?: ItemDropEffect;
}

export interface ItemDelay {
  readonly Duration?: number;
  readonly Status?: string;
}

export interface ItemStack {
  readonly Amount?: number;
  readonly Inventory?: boolean;
  readonly Cart?: boolean;
  readonly Storage?: boolean;
  readonly GuildStorage?: boolean;
}

export interface ItemNoUse {
  readonly Override?: number;
  readonly Sitting?: boolean;
}

export interface ItemTrade {
  readonly Override?: number;
  readonly NoDrop?: boolean;
  readonly NoTrade?: boolean;
  readonly TradePartner?: boolean;
  readonly NoSell?: boolean;
  readonly NoCart?: boolean;
  readonly NoStorage?: boolean;
  readonly NoGuildStorage?: boolean;
  readonly NoMail?: boolean;
  readonly NoAuction?: boolean;
}

export type ItemJobs = Record<string, boolean>;
export type ItemClasses = Record<string, boolean>;
export type ItemLocations = Record<string, boolean>;

export interface ItemRawFields {
  Id?: number;
  AegisName?: string;
  Name?: string;
  Type?: ItemType;
  SubType?: ItemSubType;
  Buy?: number;
  Sell?: number;
  Weight?: number;
  Attack?: number;
  MagicAttack?: number;
  Defense?: number;
  Range?: number;
  Slots?: number;
  Jobs?: ItemJobs;
  Classes?: ItemClasses;
  Gender?: GenderRestriction;
  Locations?: ItemLocations;
  WeaponLevel?: number;
  ArmorLevel?: number;
  EquipLevelMin?: number;
  EquipLevelMax?: number;
  Refineable?: boolean;
  Gradable?: boolean;
  View?: number;
  AliasName?: string;
  Flags?: ItemFlags;
  Delay?: ItemDelay;
  Stack?: ItemStack;
  NoUse?: ItemNoUse;
  Trade?: ItemTrade;
  Script?: string;
  EquipScript?: string;
  UnEquipScript?: string;
}
