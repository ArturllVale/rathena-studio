export type SkillType = 'Weapon' | 'Magic' | 'Misc' | 'None';
export const SKILL_TYPES: readonly SkillType[] = ['Weapon', 'Magic', 'Misc', 'None'] as const;

export type SkillTargetType =
  | 'Passive'
  | 'Attack'
  | 'Ground'
  | 'Self'
  | 'Support'
  | 'Trap'
  | 'Target_Or_Ground';

export const SKILL_TARGET_TYPES: readonly SkillTargetType[] = [
  'Passive',
  'Attack',
  'Ground',
  'Self',
  'Support',
  'Trap',
  'Target_Or_Ground',
] as const;

export type SkillHitType = 'Normal' | 'Single' | 'Continuous' | 'Multi_Hit' | 'None';
export const SKILL_HIT_TYPES: readonly SkillHitType[] = [
  'Normal',
  'Single',
  'Continuous',
  'Multi_Hit',
  'None',
] as const;

export type SkillElement =
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
  | 'Weapon'
  | 'Endowed'
  | 'Random';

export const SKILL_ELEMENTS: readonly SkillElement[] = [
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
  'Weapon',
  'Endowed',
  'Random',
] as const;

export type SkillRequiredState =
  | 'None'
  | 'Hidden'
  | 'Riding'
  | 'Falcon'
  | 'Cart'
  | 'Shield'
  | 'Recover_Weight_Rate'
  | 'Move_Enable'
  | 'Water'
  | 'RidingDragon'
  | 'Wug'
  | 'RidingWug'
  | 'Mado'
  | 'ElementalSpirit'
  | 'ElementalSpirit2'
  | 'Peco'
  | 'Sunstance'
  | 'Moonstance'
  | 'Starstance'
  | 'Universestance';

export const SKILL_REQUIRED_STATES: readonly SkillRequiredState[] = [
  'None',
  'Hidden',
  'Riding',
  'Falcon',
  'Cart',
  'Shield',
  'Recover_Weight_Rate',
  'Move_Enable',
  'Water',
  'RidingDragon',
  'Wug',
  'RidingWug',
  'Mado',
  'ElementalSpirit',
  'ElementalSpirit2',
  'Peco',
  'Sunstance',
  'Moonstance',
  'Starstance',
  'Universestance',
] as const;

export type SkillAmmoType =
  | 'None'
  | 'Arrow'
  | 'Dagger'
  | 'Bullet'
  | 'Shell'
  | 'Grenade'
  | 'Shuriken'
  | 'Kunai'
  | 'Cannonball'
  | 'Throwweapon';

export const SKILL_AMMO_TYPES: readonly SkillAmmoType[] = [
  'None',
  'Arrow',
  'Dagger',
  'Bullet',
  'Shell',
  'Grenade',
  'Shuriken',
  'Kunai',
  'Cannonball',
  'Throwweapon',
] as const;

export type SkillUnitTarget =
  | 'All'
  | 'Enemy'
  | 'Friend'
  | 'Party'
  | 'Ally'
  | 'Guild'
  | 'Self'
  | 'SameGuild';

export const SKILL_UNIT_TARGETS: readonly SkillUnitTarget[] = [
  'All',
  'Enemy',
  'Friend',
  'Party',
  'Ally',
  'Guild',
  'Self',
  'SameGuild',
] as const;

export interface SkillSplashAreaOption {
  value: number;
  label: string;
}

export const SKILL_SPLASH_AREA_OPTIONS: readonly SkillSplashAreaOption[] = [
  { value: -1, label: 'Screen-wide (-1)' },
  { value: 0, label: 'Single Cell / No Splash (0)' },
  { value: 1, label: '3x3 Area (1)' },
  { value: 2, label: '5x5 Area (2)' },
  { value: 3, label: '7x7 Area (3)' },
  { value: 4, label: '9x9 Area (4)' },
  { value: 5, label: '11x11 Area (5)' },
  { value: 6, label: '13x13 Area (6)' },
  { value: 7, label: '15x15 Area (7)' },
  { value: 8, label: '17x17 Area (8)' },
  { value: 9, label: '19x19 Area (9)' },
  { value: 10, label: '21x21 Area (10)' },
] as const;

export interface SkillLevelValue<T> {
  Level: number;
  [key: string]: T | number;
}

export interface SkillLevelSize {
  Level: number;
  Size: number;
}

export interface SkillLevelCount {
  Level: number;
  Count: number;
}

export interface SkillLevelElement {
  Level: number;
  Element: string;
}

export interface SkillLevelArea {
  Level: number;
  Area: number;
}

export interface SkillLevelAmount {
  Level: number;
  Amount: number;
}

export interface SkillLevelTime {
  Level: number;
  Time: number;
}

export interface SkillItemCost {
  Item: string;
  Amount: number;
}

export interface SkillRequires {
  HpCost?: number | SkillLevelAmount[];
  SpCost?: number | SkillLevelAmount[];
  ApCost?: number | SkillLevelAmount[];
  HpRateCost?: number | SkillLevelAmount[];
  SpRateCost?: number | SkillLevelAmount[];
  ApRateCost?: number | SkillLevelAmount[];
  MaxHpTrigger?: number | SkillLevelAmount[];
  ZenyCost?: number | SkillLevelAmount[];
  SpiritSphereCost?: number | SkillLevelAmount[];
  Weapon?: Record<string, boolean>;
  Ammo?: SkillAmmoType | Record<string, boolean> | string;
  AmmoAmount?: number | SkillLevelAmount[];
  State?: SkillRequiredState | string;
  Status?: string;
  ItemCost?: SkillItemCost[];
}

export interface SkillUnit {
  Id?: number | string;
  Layout?: number | SkillLevelSize[];
  Range?: number | SkillLevelSize[];
  Interval?: number;
  Target?: SkillUnitTarget | string;
  Flag?: Record<string, boolean>;
}

export interface SkillCopyFlags {
  Skill?: Record<string, boolean>;
  RemoveRequirement?: Record<string, boolean>;
}

export interface SkillNoNearNPC {
  AdditionalRange?: number;
  Type?: Record<string, boolean>;
}

export interface SkillRawFields {
  Id: number;
  Name: string;
  Description?: string;
  MaxLevel?: number;
  Type?: SkillType;
  TargetType?: SkillTargetType;
  DamageFlags?: Record<string, boolean>;
  Flags?: Record<string, boolean>;
  Range?: number | SkillLevelSize[];
  Hit?: SkillHitType;
  HitCount?: number | SkillLevelCount[];
  Element?: SkillElement | string | SkillLevelElement[];
  SplashArea?: number | SkillLevelArea[];
  ActiveInstance?: number | { Level: number; Max: number }[];
  Knockback?: number | SkillLevelAmount[];
  GiveAp?: number | SkillLevelAmount[];
  CopyFlags?: SkillCopyFlags;
  NoNearNPC?: SkillNoNearNPC;
  CastCancel?: boolean;
  CastDefenseReduction?: number;
  CastTime?: number | SkillLevelTime[];
  AfterCastActDelay?: number | SkillLevelTime[];
  AfterCastWalkDelay?: number | SkillLevelTime[];
  Duration1?: number | SkillLevelTime[];
  Duration2?: number | SkillLevelTime[];
  Cooldown?: number | SkillLevelTime[];
  FixedCastTime?: number | SkillLevelTime[];
  CastTimeFlags?: Record<string, boolean>;
  CastDelayFlags?: Record<string, boolean>;
  Requires?: SkillRequires;
  Unit?: SkillUnit;
  Status?: string;
}
