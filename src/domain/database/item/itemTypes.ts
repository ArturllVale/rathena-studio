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

export const ITEM_DROP_EFFECTS: readonly ItemDropEffect[] = [
  'None',
  'Client',
  'White_Pillar',
  'Blue_Pillar',
  'Yellow_Pillar',
  'Purple_Pillar',
  'Orange_Pillar',
  'Green_Pillar',
  'Red_Pillar',
] as const;

export const RATHENA_JOBS = [
  'Novice',
  'Swordman',
  'Mage',
  'Archer',
  'Acolyte',
  'Merchant',
  'Thief',
  'Knight',
  'Priest',
  'Wizard',
  'Blacksmith',
  'Hunter',
  'Assassin',
  'Crusader',
  'Monk',
  'Sage',
  'Rogue',
  'Alchemist',
  'Bard',
  'Dancer',
  'Star_Gladiator',
  'Soul_Linker',
  'Taekwon',
  'Ninja',
  'Gunslinger',
  'Super_Novice',
  'Rebellion',
  'Kagerou',
  'Oboro',
  'Summoner',
] as const;

export type RathenaJob = (typeof RATHENA_JOBS)[number];

export const RATHENA_CLASSES = [
  'Normal',
  'Upper',
  'Baby',
  'Third',
  'Third_Upper',
  'Third_Baby',
  'Fourth',
  'Fourth_Baby',
] as const;

export type RathenaClass = (typeof RATHENA_CLASSES)[number];

export const RATHENA_LOCATIONS = [
  'Head_Top',
  'Head_Mid',
  'Head_Low',
  'Armor',
  'Right_Hand',
  'Left_Hand',
  'Garment',
  'Shoes',
  'Right_Accessory',
  'Left_Accessory',
  'Both_Hand',
  'Both_Accessory',
  'Costume_Head_Top',
  'Costume_Head_Mid',
  'Costume_Head_Low',
  'Costume_Garment',
  'Shadow_Armor',
  'Shadow_Weapon',
  'Shadow_Shield',
  'Shadow_Shoes',
  'Shadow_Right_Accessory',
  'Shadow_Left_Accessory',
] as const;

export type RathenaLocation = (typeof RATHENA_LOCATIONS)[number];

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
