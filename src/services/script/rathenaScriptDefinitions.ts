/**
 * rAthena Script & Item Bonus Definitions
 * Sourced from doc/item_bonus.txt and rAthena engine script_constants.hpp
 */

export interface ScriptCompletionItem {
  name: string;
  kind: 'command' | 'bonus' | 'constant' | 'function';
  detail: string;
  insertText: string;
  documentation: string;
  category?: string;
  params?: string[];
}

export const RATHENA_BONUS_COMMANDS: ScriptCompletionItem[] = [
  {
    name: 'bonus',
    kind: 'command',
    detail: 'bonus <constant>, <value>;',
    insertText: 'bonus ${1:bConstant}, ${2:val};',
    documentation: 'Applies a single-parameter bonus to the equipped player.',
    params: ['constant', 'value'],
  },
  {
    name: 'bonus2',
    kind: 'command',
    detail: 'bonus2 <constant>, <param1>, <value>;',
    insertText: 'bonus2 ${1:bConstant}, ${2:param1}, ${3:val};',
    documentation: 'Applies a two-parameter bonus (e.g. element, race, skill modifier).',
    params: ['constant', 'param1', 'value'],
  },
  {
    name: 'bonus3',
    kind: 'command',
    detail: 'bonus3 <constant>, <param1>, <param2>, <value>;',
    insertText: 'bonus3 ${1:bConstant}, ${2:param1}, ${3:param2}, ${4:val};',
    documentation: 'Applies a three-parameter bonus (e.g. autospell with rate and trigger).',
    params: ['constant', 'param1', 'param2', 'value'],
  },
  {
    name: 'bonus4',
    kind: 'command',
    detail: 'bonus4 <constant>, <p1>, <p2>, <p3>, <val>;',
    insertText: 'bonus4 ${1:bConstant}, ${2:p1}, ${3:p2}, ${4:p3}, ${5:val};',
    documentation: 'Applies a four-parameter bonus (e.g. complex autospell trigger conditions).',
    params: ['constant', 'p1', 'p2', 'p3', 'val'],
  },
  {
    name: 'bonus5',
    kind: 'command',
    detail: 'bonus5 <constant>, <p1>, <p2>, <p3>, <p4>, <val>;',
    insertText: 'bonus5 ${1:bConstant}, ${2:p1}, ${3:p2}, ${4:p3}, ${5:p4}, ${6:val};',
    documentation: 'Applies a five-parameter bonus.',
    params: ['constant', 'p1', 'p2', 'p3', 'p4', 'val'],
  },
  {
    name: 'skill',
    kind: 'function',
    detail: 'skill "<skill_name>", <level>;',
    insertText: 'skill "${1:SKILL_NAME}", ${2:level};',
    documentation: 'Grants temporary skill while item is equipped.',
  },
  {
    name: 'itemskill',
    kind: 'function',
    detail: 'itemskill "<skill_name>", <level>;',
    insertText: 'itemskill "${1:SKILL_NAME}", ${2:level};',
    documentation: 'Casts skill immediately when consumable item is used.',
  },
  {
    name: 'percentheal',
    kind: 'function',
    detail: 'percentheal <hp_percent>, <sp_percent>;',
    insertText: 'percentheal ${1:100}, ${2:100};',
    documentation: 'Restores percentage of MaxHP and MaxSP.',
  },
  {
    name: 'heal',
    kind: 'function',
    detail: 'heal <hp>, <sp>;',
    insertText: 'heal ${1:hp}, ${2:sp};',
    documentation: 'Restores flat amount of HP and SP.',
  },
  {
    name: 'sc_start',
    kind: 'function',
    detail: 'sc_start <type>, <duration_ms>, <val>;',
    insertText: 'sc_start ${1:SC_TYPE}, ${2:duration_ms}, ${3:val};',
    documentation: 'Applies a status change effect to character.',
  },
  {
    name: 'sc_end',
    kind: 'function',
    detail: 'sc_end <type>;',
    insertText: 'sc_end ${1:SC_TYPE};',
    documentation: 'Removes a status change effect from character.',
  },
  {
    name: 'specialeffect2',
    kind: 'function',
    detail: 'specialeffect2 <effect_id>;',
    insertText: 'specialeffect2 ${1:EF_ID};',
    documentation: 'Plays visual effect on character.',
  },
];

export const RATHENA_ITEM_BONUSES: ScriptCompletionItem[] = [
  // 1. Base Stats
  { name: 'bStr', kind: 'bonus', detail: 'bonus bStr, n;', insertText: 'bStr, ', documentation: 'STR + n' },
  { name: 'bAgi', kind: 'bonus', detail: 'bonus bAgi, n;', insertText: 'bAgi, ', documentation: 'AGI + n' },
  { name: 'bVit', kind: 'bonus', detail: 'bonus bVit, n;', insertText: 'bVit, ', documentation: 'VIT + n' },
  { name: 'bInt', kind: 'bonus', detail: 'bonus bInt, n;', insertText: 'bInt, ', documentation: 'INT + n' },
  { name: 'bDex', kind: 'bonus', detail: 'bonus bDex, n;', insertText: 'bDex, ', documentation: 'DEX + n' },
  { name: 'bLuk', kind: 'bonus', detail: 'bonus bLuk, n;', insertText: 'bLuk, ', documentation: 'LUK + n' },
  { name: 'bAllStats', kind: 'bonus', detail: 'bonus bAllStats, n;', insertText: 'bAllStats, ', documentation: 'STR, AGI, VIT, INT, DEX, LUK + n' },
  { name: 'bAgiVit', kind: 'bonus', detail: 'bonus bAgiVit, n;', insertText: 'bAgiVit, ', documentation: 'AGI + n, VIT + n' },
  { name: 'bAgiDexStr', kind: 'bonus', detail: 'bonus bAgiDexStr, n;', insertText: 'bAgiDexStr, ', documentation: 'STR + n, AGI + n, DEX + n' },

  // Trait Stats (4th Jobs)
  { name: 'bPow', kind: 'bonus', detail: 'bonus bPow, n;', insertText: 'bPow, ', documentation: 'POW + n (Power)' },
  { name: 'bSta', kind: 'bonus', detail: 'bonus bSta, n;', insertText: 'bSta, ', documentation: 'STA + n (Stamina)' },
  { name: 'bWis', kind: 'bonus', detail: 'bonus bWis, n;', insertText: 'bWis, ', documentation: 'WIS + n (Wisdom)' },
  { name: 'bSpl', kind: 'bonus', detail: 'bonus bSpl, n;', insertText: 'bSpl, ', documentation: 'SPL + n (Spell)' },
  { name: 'bCon', kind: 'bonus', detail: 'bonus bCon, n;', insertText: 'bCon, ', documentation: 'CON + n (Concentration)' },
  { name: 'bCrt', kind: 'bonus', detail: 'bonus bCrt, n;', insertText: 'bCrt, ', documentation: 'CRT + n (Creative)' },
  { name: 'bAllTraitStats', kind: 'bonus', detail: 'bonus bAllTraitStats, n;', insertText: 'bAllTraitStats, ', documentation: 'POW, STA, WIS, SPL, CON, CRT + n' },

  // HP / SP / AP
  { name: 'bMaxHP', kind: 'bonus', detail: 'bonus bMaxHP, n;', insertText: 'bMaxHP, ', documentation: 'MaxHP + n flat' },
  { name: 'bMaxHPrate', kind: 'bonus', detail: 'bonus bMaxHPrate, n;', insertText: 'bMaxHPrate, ', documentation: 'MaxHP + n%' },
  { name: 'bMaxSP', kind: 'bonus', detail: 'bonus bMaxSP, n;', insertText: 'bMaxSP, ', documentation: 'MaxSP + n flat' },
  { name: 'bMaxSPrate', kind: 'bonus', detail: 'bonus bMaxSPrate, n;', insertText: 'bMaxSPrate, ', documentation: 'MaxSP + n%' },
  { name: 'bMaxAP', kind: 'bonus', detail: 'bonus bMaxAP, n;', insertText: 'bMaxAP, ', documentation: 'MaxAP + n flat' },
  { name: 'bMaxAPrate', kind: 'bonus', detail: 'bonus bMaxAPrate, n;', insertText: 'bMaxAPrate, ', documentation: 'MaxAP + n%' },

  // Atk / Matk / Def / Mdef
  { name: 'bBaseAtk', kind: 'bonus', detail: 'bonus bBaseAtk, n;', insertText: 'bBaseAtk, ', documentation: 'Basic attack power + n' },
  { name: 'bAtk', kind: 'bonus', detail: 'bonus bAtk, n;', insertText: 'bAtk, ', documentation: 'ATK + n' },
  { name: 'bAtkRate', kind: 'bonus', detail: 'bonus bAtkRate, n;', insertText: 'bAtkRate, ', documentation: 'ATK + n%' },
  { name: 'bWeaponAtkRate', kind: 'bonus', detail: 'bonus bWeaponAtkRate, n;', insertText: 'bWeaponAtkRate, ', documentation: 'Weapon ATK + n%' },
  { name: 'bMatk', kind: 'bonus', detail: 'bonus bMatk, n;', insertText: 'bMatk, ', documentation: 'Magical attack power + n' },
  { name: 'bMatkRate', kind: 'bonus', detail: 'bonus bMatkRate, n;', insertText: 'bMatkRate, ', documentation: 'Magical attack power + n%' },
  { name: 'bWeaponMatkRate', kind: 'bonus', detail: 'bonus bWeaponMatkRate, n;', insertText: 'bWeaponMatkRate, ', documentation: 'Weapon Magical ATK + n%' },
  { name: 'bDef', kind: 'bonus', detail: 'bonus bDef, n;', insertText: 'bDef, ', documentation: 'Equipment DEF + n' },
  { name: 'bDefRate', kind: 'bonus', detail: 'bonus bDefRate, n;', insertText: 'bDefRate, ', documentation: 'Equipment DEF + n%' },
  { name: 'bMdef', kind: 'bonus', detail: 'bonus bMdef, n;', insertText: 'bMdef, ', documentation: 'Equipment MDEF + n' },
  { name: 'bMdefRate', kind: 'bonus', detail: 'bonus bMdefRate, n;', insertText: 'bMdefRate, ', documentation: 'Equipment MDEF + n%' },
  { name: 'bRes', kind: 'bonus', detail: 'bonus bRes, n;', insertText: 'bRes, ', documentation: 'Physical Resistance (Res) + n' },
  { name: 'bMRes', kind: 'bonus', detail: 'bonus bMRes, n;', insertText: 'bMRes, ', documentation: 'Magical Resistance (MRes) + n' },

  // Battle Combat & Speed
  { name: 'bHit', kind: 'bonus', detail: 'bonus bHit, n;', insertText: 'bHit, ', documentation: 'Hit rate + n' },
  { name: 'bHitRate', kind: 'bonus', detail: 'bonus bHitRate, n;', insertText: 'bHitRate, ', documentation: 'Hit rate + n%' },
  { name: 'bCritical', kind: 'bonus', detail: 'bonus bCritical, n;', insertText: 'bCritical, ', documentation: 'Critical rate + n' },
  { name: 'bCriticalRate', kind: 'bonus', detail: 'bonus bCriticalRate, n;', insertText: 'bCriticalRate, ', documentation: 'Critical rate + n%' },
  { name: 'bCritAtkRate', kind: 'bonus', detail: 'bonus bCritAtkRate, n;', insertText: 'bCritAtkRate, ', documentation: 'Increases critical damage by +n%' },
  { name: 'bFlee', kind: 'bonus', detail: 'bonus bFlee, n;', insertText: 'bFlee, ', documentation: 'Flee + n' },
  { name: 'bFleeRate', kind: 'bonus', detail: 'bonus bFleeRate, n;', insertText: 'bFleeRate, ', documentation: 'Flee + n%' },
  { name: 'bFlee2', kind: 'bonus', detail: 'bonus bFlee2, n;', insertText: 'bFlee2, ', documentation: 'Perfect Dodge + n' },
  { name: 'bAspd', kind: 'bonus', detail: 'bonus bAspd, n;', insertText: 'bAspd, ', documentation: 'Attack speed + n' },
  { name: 'bAspdRate', kind: 'bonus', detail: 'bonus bAspdRate, n;', insertText: 'bAspdRate, ', documentation: 'Attack speed + n%' },
  { name: 'bSpeedRate', kind: 'bonus', detail: 'bonus bSpeedRate, n;', insertText: 'bSpeedRate, ', documentation: 'Movement speed + n%' },
  { name: 'bAtkRange', kind: 'bonus', detail: 'bonus bAtkRange, n;', insertText: 'bAtkRange, ', documentation: 'Attack range + n' },
  { name: 'bShortAtkRate', kind: 'bonus', detail: 'bonus bShortAtkRate, n;', insertText: 'bShortAtkRate, ', documentation: 'Increases melee physical damage by n%' },
  { name: 'bLongAtkRate', kind: 'bonus', detail: 'bonus bLongAtkRate, n;', insertText: 'bLongAtkRate, ', documentation: 'Increases ranged physical damage by n%' },
  { name: 'bLongAtkDef', kind: 'bonus', detail: 'bonus bLongAtkDef, n;', insertText: 'bLongAtkDef, ', documentation: 'Reduces damage received from ranged attacks by n%' },
  { name: 'bNearAtkDef', kind: 'bonus', detail: 'bonus bNearAtkDef, n;', insertText: 'bNearAtkDef, ', documentation: 'Reduces damage received from melee attacks by n%' },
  { name: 'bMagicAtkDef', kind: 'bonus', detail: 'bonus bMagicAtkDef, n;', insertText: 'bMagicAtkDef, ', documentation: 'Reduces damage received from magic attacks by n%' },

  // Cast Time & Delays
  { name: 'bCastrate', kind: 'bonus', detail: 'bonus bCastrate, n;', insertText: 'bCastrate, ', documentation: 'Cast time rate - n%' },
  { name: 'bVariableCastrate', kind: 'bonus', detail: 'bonus bVariableCastrate, n;', insertText: 'bVariableCastrate, ', documentation: 'Variable cast time - n%' },
  { name: 'bFixedCastrate', kind: 'bonus', detail: 'bonus bFixedCastrate, n;', insertText: 'bFixedCastrate, ', documentation: 'Fixed cast time - n%' },
  { name: 'bFixedCast', kind: 'bonus', detail: 'bonus bFixedCast, t;', insertText: 'bFixedCast, ', documentation: 'Reduces fixed cast time by t milliseconds' },
  { name: 'bVariableCast', kind: 'bonus', detail: 'bonus bVariableCast, t;', insertText: 'bVariableCast, ', documentation: 'Reduces variable cast time by t milliseconds' },
  { name: 'bDelayrate', kind: 'bonus', detail: 'bonus bDelayrate, n;', insertText: 'bDelayrate, ', documentation: 'After-cast delay - n%' },
  { name: 'bNoCastCancel', kind: 'bonus', detail: 'bonus bNoCastCancel;', insertText: 'bNoCastCancel;', documentation: 'Prevents spell casting cancellation upon receiving damage' },

  // HP / SP Recovery & Heal
  { name: 'bHPrecovRate', kind: 'bonus', detail: 'bonus bHPrecovRate, n;', insertText: 'bHPrecovRate, ', documentation: 'Natural HP recovery rate + n%' },
  { name: 'bSPrecovRate', kind: 'bonus', detail: 'bonus bSPrecovRate, n;', insertText: 'bSPrecovRate, ', documentation: 'Natural SP recovery rate + n%' },
  { name: 'bHealPower', kind: 'bonus', detail: 'bonus bHealPower, n;', insertText: 'bHealPower, ', documentation: 'Increases outgoing healing amount by n%' },
  { name: 'bHealPower2', kind: 'bonus', detail: 'bonus bHealPower2, n;', insertText: 'bHealPower2, ', documentation: 'Increases incoming healing amount received by n%' },
  { name: 'bUseSPrate', kind: 'bonus', detail: 'bonus bUseSPrate, n;', insertText: 'bUseSPrate, ', documentation: 'SP consumption + n%' },

  // Bonus2 Multi-Param Modifiers
  { name: 'bAddEle', kind: 'bonus', detail: 'bonus2 bAddEle, e, n;', insertText: 'bAddEle, ', documentation: 'Damage against element e + n%' },
  { name: 'bSubEle', kind: 'bonus', detail: 'bonus2 bSubEle, e, n;', insertText: 'bSubEle, ', documentation: 'Damage reduction from element e + n%' },
  { name: 'bAddRace', kind: 'bonus', detail: 'bonus2 bAddRace, r, n;', insertText: 'bAddRace, ', documentation: 'Physical damage against race r + n%' },
  { name: 'bMagicAddRace', kind: 'bonus', detail: 'bonus2 bMagicAddRace, r, n;', insertText: 'bMagicAddRace, ', documentation: 'Magic damage against race r + n%' },
  { name: 'bSubRace', kind: 'bonus', detail: 'bonus2 bSubRace, r, n;', insertText: 'bSubRace, ', documentation: 'Damage reduction against race r + n%' },
  { name: 'bAddClass', kind: 'bonus', detail: 'bonus2 bAddClass, c, n;', insertText: 'bAddClass, ', documentation: 'Damage against monster class c (Boss/Normal) + n%' },
  { name: 'bSubClass', kind: 'bonus', detail: 'bonus2 bSubClass, c, n;', insertText: 'bSubClass, ', documentation: 'Damage reduction from monster class c + n%' },
  { name: 'bAddSize', kind: 'bonus', detail: 'bonus2 bAddSize, s, n;', insertText: 'bAddSize, ', documentation: 'Physical damage against monster size s + n%' },
  { name: 'bMagicAddSize', kind: 'bonus', detail: 'bonus2 bMagicAddSize, s, n;', insertText: 'bMagicAddSize, ', documentation: 'Magic damage against monster size s + n%' },
  { name: 'bSubSize', kind: 'bonus', detail: 'bonus2 bSubSize, s, n;', insertText: 'bSubSize, ', documentation: 'Damage reduction against monster size s + n%' },
  { name: 'bSkillAtk', kind: 'bonus', detail: 'bonus2 bSkillAtk, sk, n;', insertText: 'bSkillAtk, ', documentation: 'Increases damage of skill sk by n%' },
  { name: 'bSkillCooldown', kind: 'bonus', detail: 'bonus2 bSkillCooldown, sk, t;', insertText: 'bSkillCooldown, ', documentation: 'Reduces cooldown of skill sk by t milliseconds' },
  { name: 'bSkillDelay', kind: 'bonus', detail: 'bonus2 bSkillDelay, sk, t;', insertText: 'bSkillDelay, ', documentation: 'Reduces delay of skill sk by t milliseconds' },
  { name: 'bSkillUseSP', kind: 'bonus', detail: 'bonus2 bSkillUseSP, sk, n;', insertText: 'bSkillUseSP, ', documentation: 'Reduces SP consumption of skill sk by n' },
  { name: 'bAutoSpell', kind: 'bonus', detail: 'bonus3 bAutoSpell, sk, lvl, rate;', insertText: 'bAutoSpell, ', documentation: 'Auto-casts skill sk level lvl at rate/10% when physically attacking' },
  { name: 'bAutoSpellWhenHit', kind: 'bonus', detail: 'bonus3 bAutoSpellWhenHit, sk, lvl, rate;', insertText: 'bAutoSpellWhenHit, ', documentation: 'Auto-casts skill sk level lvl at rate/10% when hit' },
  { name: 'bAddEff', kind: 'bonus', detail: 'bonus2 bAddEff, eff, rate;', insertText: 'bAddEff, ', documentation: 'Chance to inflict status eff when attacking (rate: 10000 = 100%)' },
  { name: 'bResEff', kind: 'bonus', detail: 'bonus2 bResEff, eff, rate;', insertText: 'bResEff, ', documentation: 'Resistance against status eff + rate/100%' },
  { name: 'bIgnoreDefRate', kind: 'bonus', detail: 'bonus2 bIgnoreDefRate, r, n;', insertText: 'bIgnoreDefRate, ', documentation: 'Ignores n% of physical defense for race r' },
  { name: 'bIgnoreMdefRate', kind: 'bonus', detail: 'bonus2 bIgnoreMdefRate, r, n;', insertText: 'bIgnoreMdefRate, ', documentation: 'Ignores n% of magical defense for race r' },
  { name: 'bIgnoreDefClassRate', kind: 'bonus', detail: 'bonus2 bIgnoreDefClassRate, c, n;', insertText: 'bIgnoreDefClassRate, ', documentation: 'Ignores n% of physical defense for class c (Normal/Boss)' },
  { name: 'bIgnoreMdefClassRate', kind: 'bonus', detail: 'bonus2 bIgnoreMdefClassRate, c, n;', insertText: 'bIgnoreMdefClassRate, ', documentation: 'Ignores n% of magical defense for class c (Normal/Boss)' },
];

export const RATHENA_SCRIPT_CONSTANTS: ScriptCompletionItem[] = [
  // Status Effects (Eff_*)
  { name: 'Eff_Stun', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Stun', documentation: 'Stun effect constant' },
  { name: 'Eff_Freeze', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Freeze', documentation: 'Freeze effect constant' },
  { name: 'Eff_Stone', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Stone', documentation: 'Stone Curse effect constant' },
  { name: 'Eff_Silence', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Silence', documentation: 'Silence effect constant' },
  { name: 'Eff_Sleep', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Sleep', documentation: 'Sleep effect constant' },
  { name: 'Eff_Poison', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Poison', documentation: 'Poison effect constant' },
  { name: 'Eff_Curse', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Curse', documentation: 'Curse effect constant' },
  { name: 'Eff_Blind', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Blind', documentation: 'Blind effect constant' },
  { name: 'Eff_Bleeding', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Bleeding', documentation: 'Bleeding effect constant' },
  { name: 'Eff_Burning', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Burning', documentation: 'Burning effect constant' },
  { name: 'Eff_Confusion', kind: 'constant', detail: 'Status Effect', insertText: 'Eff_Confusion', documentation: 'Confusion effect constant' },

  // Elements (Ele_*)
  { name: 'Ele_Neutral', kind: 'constant', detail: 'Element', insertText: 'Ele_Neutral', documentation: 'Neutral Element' },
  { name: 'Ele_Water', kind: 'constant', detail: 'Element', insertText: 'Ele_Water', documentation: 'Water Element' },
  { name: 'Ele_Earth', kind: 'constant', detail: 'Element', insertText: 'Ele_Earth', documentation: 'Earth Element' },
  { name: 'Ele_Fire', kind: 'constant', detail: 'Element', insertText: 'Ele_Fire', documentation: 'Fire Element' },
  { name: 'Ele_Wind', kind: 'constant', detail: 'Element', insertText: 'Ele_Wind', documentation: 'Wind Element' },
  { name: 'Ele_Poison', kind: 'constant', detail: 'Element', insertText: 'Ele_Poison', documentation: 'Poison Element' },
  { name: 'Ele_Holy', kind: 'constant', detail: 'Element', insertText: 'Ele_Holy', documentation: 'Holy Element' },
  { name: 'Ele_Dark', kind: 'constant', detail: 'Element', insertText: 'Ele_Dark', documentation: 'Dark Element' },
  { name: 'Ele_Ghost', kind: 'constant', detail: 'Element', insertText: 'Ele_Ghost', documentation: 'Ghost Element' },
  { name: 'Ele_Undead', kind: 'constant', detail: 'Element', insertText: 'Ele_Undead', documentation: 'Undead Element' },
  { name: 'Ele_All', kind: 'constant', detail: 'Element', insertText: 'Ele_All', documentation: 'All Elements' },

  // Races (RC_*)
  { name: 'RC_Formless', kind: 'constant', detail: 'Race', insertText: 'RC_Formless', documentation: 'Formless Race' },
  { name: 'RC_Undead', kind: 'constant', detail: 'Race', insertText: 'RC_Undead', documentation: 'Undead Race' },
  { name: 'RC_Brute', kind: 'constant', detail: 'Race', insertText: 'RC_Brute', documentation: 'Brute / Animal Race' },
  { name: 'RC_Plant', kind: 'constant', detail: 'Race', insertText: 'RC_Plant', documentation: 'Plant Race' },
  { name: 'RC_Insect', kind: 'constant', detail: 'Race', insertText: 'RC_Insect', documentation: 'Insect Race' },
  { name: 'RC_Fish', kind: 'constant', detail: 'Race', insertText: 'RC_Fish', documentation: 'Fish / Aquatic Race' },
  { name: 'RC_Demon', kind: 'constant', detail: 'Race', insertText: 'RC_Demon', documentation: 'Demon Race' },
  { name: 'RC_DemiHuman', kind: 'constant', detail: 'Race', insertText: 'RC_DemiHuman', documentation: 'Demi-Human Race' },
  { name: 'RC_Angel', kind: 'constant', detail: 'Race', insertText: 'RC_Angel', documentation: 'Angel Race' },
  { name: 'RC_Dragon', kind: 'constant', detail: 'Race', insertText: 'RC_Dragon', documentation: 'Dragon Race' },
  { name: 'RC_Player_Human', kind: 'constant', detail: 'Race', insertText: 'RC_Player_Human', documentation: 'Player Human' },
  { name: 'RC_Player_Doram', kind: 'constant', detail: 'Race', insertText: 'RC_Player_Doram', documentation: 'Player Doram' },
  { name: 'RC_All', kind: 'constant', detail: 'Race', insertText: 'RC_All', documentation: 'All Races' },

  // Monster Classes (Class_*)
  { name: 'Class_Normal', kind: 'constant', detail: 'Monster Class', insertText: 'Class_Normal', documentation: 'Normal Monster Class' },
  { name: 'Class_Boss', kind: 'constant', detail: 'Monster Class', insertText: 'Class_Boss', documentation: 'Boss / MVP Monster Class' },
  { name: 'Class_Guardian', kind: 'constant', detail: 'Monster Class', insertText: 'Class_Guardian', documentation: 'Guardian Monster Class' },
  { name: 'Class_All', kind: 'constant', detail: 'Monster Class', insertText: 'Class_All', documentation: 'All Monster Classes' },

  // Monster Sizes (Size_*)
  { name: 'Size_Small', kind: 'constant', detail: 'Monster Size', insertText: 'Size_Small', documentation: 'Small Size' },
  { name: 'Size_Medium', kind: 'constant', detail: 'Monster Size', insertText: 'Size_Medium', documentation: 'Medium Size' },
  { name: 'Size_Large', kind: 'constant', detail: 'Monster Size', insertText: 'Size_Large', documentation: 'Large Size' },
  { name: 'Size_All', kind: 'constant', detail: 'Monster Size', insertText: 'Size_All', documentation: 'All Sizes' },

  // Battle Trigger Criteria (BF_*)
  { name: 'BF_WEAPON', kind: 'constant', detail: 'Trigger Flag', insertText: 'BF_WEAPON', documentation: 'Weapon physical attack trigger' },
  { name: 'BF_MAGIC', kind: 'constant', detail: 'Trigger Flag', insertText: 'BF_MAGIC', documentation: 'Magic skill attack trigger' },
  { name: 'BF_MISC', kind: 'constant', detail: 'Trigger Flag', insertText: 'BF_MISC', documentation: 'Misc attack trigger' },
  { name: 'BF_SHORT', kind: 'constant', detail: 'Trigger Flag', insertText: 'BF_SHORT', documentation: 'Melee range trigger' },
  { name: 'BF_LONG', kind: 'constant', detail: 'Trigger Flag', insertText: 'BF_LONG', documentation: 'Ranged attack trigger' },
  { name: 'BF_NORMAL', kind: 'constant', detail: 'Trigger Flag', insertText: 'BF_NORMAL', documentation: 'Normal attack trigger' },
  { name: 'BF_SKILL', kind: 'constant', detail: 'Trigger Flag', insertText: 'BF_SKILL', documentation: 'Skill attack trigger' },

  // ATF Target Criteria
  { name: 'ATF_SELF', kind: 'constant', detail: 'Trigger Target', insertText: 'ATF_SELF', documentation: 'Trigger effect on self' },
  { name: 'ATF_TARGET', kind: 'constant', detail: 'Trigger Target', insertText: 'ATF_TARGET', documentation: 'Trigger effect on target' },
];

export const ALL_SCRIPT_COMPLETIONS: ScriptCompletionItem[] = [
  ...RATHENA_BONUS_COMMANDS,
  ...RATHENA_ITEM_BONUSES,
  ...RATHENA_SCRIPT_CONSTANTS,
];
