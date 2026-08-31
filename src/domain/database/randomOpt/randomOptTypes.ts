export interface RandomOptionRawFields {
  Id: number;
  Option: string;
  Script?: string;
}

export interface RandomOptionSlotOption {
  Option: string;
  MinValue: number;
  MaxValue: number;
  Param?: number;
  Chance: number;
}

export interface RandomOptionSlot {
  Slot: number;
  Options: RandomOptionSlotOption[];
}

export interface RandomOptionGroupRawFields {
  Id: number;
  Group: string;
  MaxRandom?: number;
  Slots: RandomOptionSlot[];
}
