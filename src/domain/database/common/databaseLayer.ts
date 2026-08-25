import { DatabaseVariant } from './databaseVariant';

export type DatabaseLayerType = 'BASE' | 'MODE_SPECIFIC' | 'IMPORT' | 'CUSTOM';

export interface DatabaseLayer {
  readonly id: string;
  readonly name: string;
  readonly relativePath: string;
  readonly absolutePath?: string;
  readonly variant: DatabaseVariant | 'UNIVERSAL';
  readonly priority: number;
  readonly type: DatabaseLayerType;
  readonly isReadOnly?: boolean;
}

export function isLayerCompatibleWithVariant(layerVariant: DatabaseVariant | 'UNIVERSAL', activeVariant: DatabaseVariant): boolean {
  return layerVariant === 'UNIVERSAL' || layerVariant === activeVariant;
}
