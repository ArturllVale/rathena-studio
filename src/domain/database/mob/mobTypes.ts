/**
 * Domain Types and Canonical Enumerations for rAthena Monster Database (MOB_DB v3)
 */

export type MobSize = 'Small' | 'Medium' | 'Large' | 'All';

export const MOB_SIZES: readonly MobSize[] = ['Small', 'Medium', 'Large', 'All'] as const;

export type MobRace =
  | 'Formless'
  | 'Undead'
  | 'Brute'
  | 'Plant'
  | 'Insect'
  | 'Fish'
  | 'Demon'
  | 'DemiHuman'
  | 'Angel'
  | 'Dragon'
  | 'Player_Human'
  | 'Player_Doram'
  | 'All';

export const MOB_RACES: readonly MobRace[] = [
  'Formless',
  'Undead',
  'Brute',
  'Plant',
  'Insect',
  'Fish',
  'Demon',
  'DemiHuman',
  'Angel',
  'Dragon',
  'Player_Human',
  'Player_Doram',
  'All',
] as const;

export type MobElement =
  | 'Neutral'
  | 'Water'
  | 'Earth'
  | 'Fire'
  | 'Wind'
  | 'Poison'
  | 'Holy'
  | 'Dark'
  | 'Ghost'
  | 'Undead'
  | 'All';

export const MOB_ELEMENTS: readonly MobElement[] = [
  'Neutral',
  'Water',
  'Earth',
  'Fire',
  'Wind',
  'Poison',
  'Holy',
  'Dark',
  'Ghost',
  'Undead',
  'All',
] as const;

export type MobClass = 'Normal' | 'Boss' | 'Guardian' | 'All';

export const MOB_CLASSES: readonly MobClass[] = ['Normal', 'Boss', 'Guardian', 'All'] as const;

export const MOB_RACE_GROUPS = [
  'Goblin',
  'Kobold',
  'Orc',
  'Golem',
  'Guardian',
  'Ninja',
  'GVG',
  'Battlefield',
  'Treasure',
  'BioLab',
  'Manuk',
  'Splendide',
  'Scaraba',
  'OGH_ATK_DEF',
  'OGH_Hidden',
  'Bio5_Swordman_Thief',
  'Bio5_Acolyte_Merchant',
  'Bio5_Mage_Archer',
  'Bio5_MVP',
  'Clocktower',
  'Thanatos',
  'Faceworm',
  'Hearthunter',
  'Rockridge',
  'Werner_Lab',
  'Temple_Demon',
  'Illusion_Vampire',
  'Malangdo',
  'EP172ALPHA',
  'EP172BETA',
  'EP172BATH',
  'Illusion_Turtle',
  'Rachel_Sanctuary',
  'Illusion_Luanda',
] as const;

export const MOB_MODES = [
  'CanMove',
  'Looter',
  'Aggressive',
  'Assist',
  'CastSensorIdle',
  'Boss',
  'Plant',
  'CanAttack',
  'Detector',
  'CastSensorChase',
  'ChangeChase',
  'Angry',
  'ChangeTargetMelee',
  'ChangeTargetChase',
  'TargetWeak',
  'RandomTarget',
  'IgnoreMelee',
  'IgnoreMagic',
  'IgnoreRanged',
  'IgnoreMisc',
  'KnockbackImmune',
  'TeleportBlock',
  'FixedItemDrop',
  'ChaseChangeTarget',
] as const;

export interface MobDrop {
  Item: string;
  Rate: number;
  StealProtected?: boolean;
  RandomOptionGroup?: string;
  Index?: number;
}

export interface MobMvpDrop {
  Item: string;
  Rate: number;
  RandomOptionGroup?: string;
  Index?: number;
}

export interface MobRawFields {
  Id: number;
  AegisName: string;
  Name: string;
  JapaneseName?: string;
  Level?: number;
  Hp?: number;
  Sp?: number;
  BaseExp?: number;
  JobExp?: number;
  MvpExp?: number;
  Attack?: number;
  Attack2?: number;
  Defense?: number;
  MagicDefense?: number;
  Resistance?: number;
  MagicResistance?: number;
  Str?: number;
  Agi?: number;
  Vit?: number;
  Int?: number;
  Dex?: number;
  Luk?: number;
  AttackRange?: number;
  SkillRange?: number;
  ChaseRange?: number;
  Size?: MobSize;
  Race?: MobRace;
  RaceGroups?: Record<string, boolean>;
  Element?: MobElement;
  ElementLevel?: number;
  WalkSpeed?: number;
  AttackDelay?: number;
  AttackMotion?: number;
  DamageMotion?: number;
  DamageTaken?: number;
  Ai?: string | number;
  Class?: MobClass;
  Modes?: Record<string, boolean>;
  MvpDrops?: MobMvpDrop[];
  Drops?: MobDrop[];
}
