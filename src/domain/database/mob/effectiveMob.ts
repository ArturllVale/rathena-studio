import { DatabaseVariant } from '../common/databaseVariant';
import { MobRawFields } from './mobTypes';
import { SourceMobRange } from './sourceMob';

export interface MobFieldOrigin {
  readonly layerId: string;
  readonly filePath: string;
  readonly layerVariant: DatabaseVariant | 'UNIVERSAL';
  readonly value: unknown;
  readonly range?: SourceMobRange;
}

export interface EffectiveMob {
  readonly id: number;
  readonly databaseVariant: DatabaseVariant;
  readonly fields: Readonly<MobRawFields>;
  readonly fieldOrigins: Readonly<Record<string, MobFieldOrigin>>;
  readonly layerProvenance: readonly string[];
  readonly isOverridden: boolean;
}

export function createEffectiveMob(params: {
  id: number;
  databaseVariant: DatabaseVariant;
  fields: MobRawFields;
  fieldOrigins: Record<string, MobFieldOrigin>;
  layerProvenance: string[];
}): EffectiveMob {
  return {
    id: params.id,
    databaseVariant: params.databaseVariant,
    fields: { ...params.fields },
    fieldOrigins: { ...params.fieldOrigins },
    layerProvenance: [...params.layerProvenance],
    isOverridden: params.layerProvenance.length > 1,
  };
}
