import { DatabaseVariant } from '../common/databaseVariant';
import { SkillRawFields } from './skillTypes';
import { SourceSkillRange } from './sourceSkill';

export interface SkillFieldOrigin {
  readonly layerId: string;
  readonly filePath: string;
  readonly layerVariant: DatabaseVariant | 'UNIVERSAL';
  readonly value: unknown;
  readonly range?: SourceSkillRange;
}

export interface EffectiveSkill {
  readonly id: number;
  readonly name: string;
  readonly databaseVariant: DatabaseVariant;
  readonly fields: Readonly<SkillRawFields>;
  readonly fieldOrigins: Readonly<Record<string, SkillFieldOrigin>>;
  readonly layerProvenance: readonly string[];
  readonly isOverridden: boolean;
}

export function createEffectiveSkill(params: {
  id: number;
  name: string;
  databaseVariant: DatabaseVariant;
  fields: SkillRawFields;
  fieldOrigins: Record<string, SkillFieldOrigin>;
  layerProvenance: string[];
}): EffectiveSkill {
  return {
    id: params.id,
    name: params.name,
    databaseVariant: params.databaseVariant,
    fields: { ...params.fields },
    fieldOrigins: { ...params.fieldOrigins },
    layerProvenance: [...params.layerProvenance],
    isOverridden: params.layerProvenance.length > 1,
  };
}
