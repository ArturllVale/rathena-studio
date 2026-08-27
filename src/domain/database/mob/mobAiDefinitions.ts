/**
 * rAthena Aegis Monster AI Types, Bitmasks and Mode Resolution
 * Reference: horizonro/doc/mob_db_mode_list.txt
 */

export interface MobAiDefinition {
  readonly id: string;
  readonly hex: string;
  readonly label: string;
  readonly description: string;
  readonly baseModes: readonly string[];
}

export const MOB_AI_DEFINITIONS: Record<string, MobAiDefinition> = {
  '01': {
    id: '01',
    hex: '0x0081',
    label: '01 - Passive',
    description: 'Passive monster. Moves and attacks when provoked.',
    baseModes: ['CanMove', 'CanAttack'],
  },
  '02': {
    id: '02',
    hex: '0x0083',
    label: '02 - Passive Looter',
    description: 'Passive monster that loots items from the ground (e.g. Poring).',
    baseModes: ['CanMove', 'Looter', 'CanAttack'],
  },
  '03': {
    id: '03',
    hex: '0x1089',
    label: '03 - Passive Assist (Melee Target)',
    description: 'Passive monster. Assists nearby allies and switches target on melee hit.',
    baseModes: ['CanMove', 'Assist', 'CanAttack', 'ChangeTargetMelee'],
  },
  '04': {
    id: '04',
    hex: '0x3885',
    label: '04 - Angry (Change Target Melee/Chase)',
    description: 'Hyper-active angry monster that switches target on melee/chase.',
    baseModes: ['CanMove', 'Aggressive', 'CanAttack', 'Angry', 'ChangeTargetMelee', 'ChangeTargetChase'],
  },
  '05': {
    id: '05',
    hex: '0x2085',
    label: '05 - Aggressive (Change Target Chase)',
    description: 'Aggressive monster that changes target when hit while chasing.',
    baseModes: ['CanMove', 'Aggressive', 'CanAttack', 'ChangeTargetChase'],
  },
  '06': {
    id: '06',
    hex: '0x0000',
    label: '06 - Plant (Immobile / Passive)',
    description: 'Passive, immobile plant. Cannot perform normal attacks.',
    baseModes: ['Plant'],
  },
  '07': {
    id: '07',
    hex: '0x108B',
    label: '07 - Passive Looter Assist',
    description: 'Passive looter that assists allies and changes target on melee.',
    baseModes: ['CanMove', 'Looter', 'Assist', 'CanAttack', 'ChangeTargetMelee'],
  },
  '08': {
    id: '08',
    hex: '0x7085',
    label: '08 - Aggressive Target Weak',
    description: 'Aggressive monster that prioritizes lower-level characters.',
    baseModes: ['CanMove', 'Aggressive', 'CanAttack', 'ChangeTargetMelee', 'ChangeTargetChase', 'TargetWeak'],
  },
  '09': {
    id: '09',
    hex: '0x3095',
    label: '09 - Guardian Aggressive (Cast Sensor)',
    description: 'Aggressive guardian with cast sensor idle behavior.',
    baseModes: ['CanMove', 'Aggressive', 'CastSensorIdle', 'CanAttack', 'ChangeTargetMelee', 'ChangeTargetChase'],
  },
  '10': {
    id: '10',
    hex: '0x0084',
    label: '10 - Aggressive Immobile',
    description: 'Aggressive stationary monster (e.g. Mandragora).',
    baseModes: ['Aggressive', 'CanAttack'],
  },
  '11': {
    id: '11',
    hex: '0x0084',
    label: '11 - Guardian Immobile',
    description: 'Aggressive stationary guardian monster.',
    baseModes: ['Aggressive', 'CanAttack'],
  },
  '12': {
    id: '12',
    hex: '0x2085',
    label: '12 - Guardian Mobile Chase',
    description: 'Aggressive guardian changing target during chase.',
    baseModes: ['CanMove', 'Aggressive', 'CanAttack', 'ChangeTargetChase'],
  },
  '13': {
    id: '13',
    hex: '0x308D',
    label: '13 - Aggressive Assist',
    description: 'Aggressive monster that assists allies of same class.',
    baseModes: ['CanMove', 'Aggressive', 'Assist', 'CanAttack', 'ChangeTargetMelee', 'ChangeTargetChase'],
  },
  '17': {
    id: '17',
    hex: '0x0091',
    label: '17 - Passive Cast Sensor',
    description: 'Passive monster that attacks if someone casts a spell near it.',
    baseModes: ['CanMove', 'CastSensorIdle', 'CanAttack'],
  },
  '19': {
    id: '19',
    hex: '0x3095',
    label: '19 - Aggressive Cast Sensor Idle',
    description: 'Standard aggressive monster reacting to spell cast while idle.',
    baseModes: ['CanMove', 'Aggressive', 'CastSensorIdle', 'CanAttack', 'ChangeTargetMelee', 'ChangeTargetChase'],
  },
  '20': {
    id: '20',
    hex: '0x3295',
    label: '20 - Aggressive Cast Sensor Chase',
    description: 'Aggressive monster reacting to spell cast both when idle and chasing.',
    baseModes: ['CanMove', 'Aggressive', 'CastSensorIdle', 'CanAttack', 'CastSensorChase', 'ChangeTargetMelee', 'ChangeTargetChase'],
  },
  '21': {
    id: '21',
    hex: '0x3695',
    label: '21 - Aggressive Change Chase',
    description: 'Aggressive monster switching targets if a player enters melee range while chasing.',
    baseModes: [
      'CanMove',
      'Aggressive',
      'CastSensorIdle',
      'CanAttack',
      'CastSensorChase',
      'ChangeChase',
      'ChangeTargetMelee',
      'ChangeTargetChase',
    ],
  },
  '24': {
    id: '24',
    hex: '0x00A1',
    label: '24 - Slave / Minion',
    description: 'Passive minion monster. Does not randomly wander around map.',
    baseModes: ['CanMove', 'CanAttack'],
  },
  '25': {
    id: '25',
    hex: '0x0001',
    label: '25 - Pet (No Attack)',
    description: 'Passive pet/follower monster. Cannot attack.',
    baseModes: ['CanMove'],
  },
  '26': {
    id: '26',
    hex: '0xB695',
    label: '26 - Aggressive Random Target',
    description: 'Aggressive monster picking new random targets during combat.',
    baseModes: [
      'CanMove',
      'Aggressive',
      'CastSensorIdle',
      'CanAttack',
      'CastSensorChase',
      'ChangeChase',
      'ChangeTargetMelee',
      'ChangeTargetChase',
      'RandomTarget',
    ],
  },
  '27': {
    id: '27',
    hex: '0x8084',
    label: '27 - Immobile Random Target',
    description: 'Immobile aggressive monster targeting randomly.',
    baseModes: ['Aggressive', 'CanAttack', 'RandomTarget'],
  },
};

/**
 * Breve descrição em Português (PT-BR) de cada modo de comportamento de monstro.
 * Fonte: horizonro/doc/mob_db_mode_list.txt
 */
export const MOB_MODE_DESCRIPTIONS_PT_BR: Record<string, string> = {
  CanMove: 'Permite ao monstro andar e perseguir personagens.',
  Looter: 'Coleta itens caídos no chão quando em estado ocioso (ex: Poring).',
  Aggressive: 'Monstro agressivo. Procura jogadores próximos no alcance de visão para atacar.',
  Assist: 'Entra em combate para ajudar monstros da mesma família quando atacam ou são atacados.',
  CastSensorIdle: 'Ataca personagens que começarem a conjurar magias sobre ele enquanto estiver ocioso.',
  NoRandomWalk: 'Não anda aleatoriamente pelo mapa enquanto ocioso.',
  NoCast: 'Impede o monstro de conjurar habilidades.',
  CanAttack: 'Permite ao monstro desferir ataques normais e contra-atacar no alcance físico.',
  CastSensorChase: 'Muda de alvo para quem começar a conjurar magias sobre ele mesmo durante a perseguição.',
  ChangeChase: 'Troca de alvo se outro jogador entrar no alcance de ataque enquanto persegue.',
  Angry: 'Hiperativo. Alterna árvore de habilidades e segue o jogador mais próximo antes de ser atingido.',
  ChangeTargetMelee: 'Troca de alvo ao receber um ataque físico corpo a corpo enquanto ataca outro jogador.',
  ChangeTargetChase: 'Troca de alvo ao sofrer qualquer ataque enquanto persegue outro personagem.',
  TargetWeak: 'Agressivo apenas contra personagens com nível 5 ou mais abaixo do seu próprio nível.',
  RandomTarget: 'Seleciona um novo alvo aleatório a cada ataque ou habilidade executada.',
  IgnoreMelee: 'Recebe apenas 1 de dano de ataques físicos corpo a corpo.',
  IgnoreMagic: 'Recebe apenas 1 de dano de ataques mágicos.',
  IgnoreRanged: 'Recebe apenas 1 de dano de ataques físicos à distância.',
  Boss: 'Classificado como MVP/Chefe. Imune a Coma e morte instantânea.',
  IgnoreMisc: 'Recebe apenas 1 de dano de ataques de dano fixo/misc.',
  KnockbackImmune: 'Imune a efeitos de empurrão e recuo (Knockback).',
  TeleportBlock: 'Bloqueia teletransporte.',
  FixedItemDrop: 'Taxas de drop não são afetadas por modificadores de servidor ou itens multiplicadores.',
  Detector: 'Detecta e ataca personagens ocultos (Esconderijo, Furtividade, Camuflagem).',
  StatusImmune: 'Imunidade total a efeitos negativos de status.',
  SkillImmune: 'Imunidade total a habilidades ofensivas.',
  Plant: 'Monstro planta. Imóvel, não ataca normalmente e recebe dano fixo 1.',
  ChaseChangeTarget: 'Muda dinamicamente de alvo de perseguição de acordo com a proximidade.',
};

export type ModeOriginType = 'ai' | 'class' | 'race' | 'explicit';

export interface ResolvedModeInfo {
  readonly mode: string;
  readonly isEnabled: boolean;
  readonly origin: ModeOriginType;
  readonly originDetail: string;
  readonly isOverridden: boolean;
}

export function normalizeAiId(ai?: string | number): string {
  if (ai === undefined || ai === null) return '06';
  const str = String(ai).trim();
  if (str.length === 1) return `0${str}`;
  return str;
}

export function computeEffectiveMobModes(params: {
  ai?: string | number;
  mobClass?: string;
  race?: string;
  explicitModes?: Record<string, boolean>;
}): Record<string, ResolvedModeInfo> {
  const { ai, mobClass, race, explicitModes = {} } = params;
  const result: Record<string, ResolvedModeInfo> = {};

  const normalizedAi = normalizeAiId(ai);
  const aiDef = MOB_AI_DEFINITIONS[normalizedAi];

  // 1. Base Modes from AI
  if (aiDef) {
    for (const mode of aiDef.baseModes) {
      result[mode] = {
        mode,
        isEnabled: true,
        origin: 'ai',
        originDetail: `Herdado (AI ${aiDef.id})`,
        isOverridden: false,
      };
    }
  }

  // 2. Base Modes from Class
  if (mobClass === 'Boss') {
    const bossModes = ['Boss', 'KnockbackImmune', 'Detector'];
    for (const mode of bossModes) {
      result[mode] = {
        mode,
        isEnabled: true,
        origin: 'class',
        originDetail: 'Herdado (Classe Boss)',
        isOverridden: false,
      };
    }
  }

  // 3. Base Modes from Race (Insect & Demon have innate Detector)
  if (race === 'Insect' || race === 'Demon') {
    if (!result['Detector']) {
      result['Detector'] = {
        mode: 'Detector',
        isEnabled: true,
        origin: 'race',
        originDetail: `Herdado (Raça ${race})`,
        isOverridden: false,
      };
    }
  }

  // 4. Explicit Overrides from YAML
  for (const [mode, value] of Object.entries(explicitModes)) {
    const hadBase = result[mode]?.isEnabled ?? false;
    result[mode] = {
      mode,
      isEnabled: Boolean(value),
      origin: 'explicit',
      originDetail: value ? 'Habilitado Explícito (YAML)' : 'Desabilitado Explícito (YAML)',
      isOverridden: hadBase !== Boolean(value),
    };
  }

  return result;
}
