export interface ItemGroupEntry {
  Index?: number;
  Item: string | number;
  Rate?: number;
  Amount?: number;
  Duration?: number;
  Announced?: boolean;
  Announce?: boolean;
  UniqueId?: boolean;
  Stacked?: boolean;
  Named?: boolean;
  Bound?: string | number | boolean;
  RandomOptionGroup?: string;
  RefineMinimum?: number;
  RefineMaximum?: number;
  Clear?: boolean;
}

export interface ItemSubGroup {
  SubGroup: number;
  List: ItemGroupEntry[];
  Clear?: boolean;
}

export interface ItemGroupRawFields {
  Group: string;
  SubGroup?: number;
  SubGroups?: ItemSubGroup[];
  List?: ItemGroupEntry[];
}

export function getItemGroupAllEntries(fields?: Partial<ItemGroupRawFields>): ItemGroupEntry[] {
  if (!fields) return [];
  if (Array.isArray(fields.SubGroups) && fields.SubGroups.length > 0) {
    const all: ItemGroupEntry[] = [];
    for (const sg of fields.SubGroups) {
      if (Array.isArray(sg.List)) {
        all.push(...sg.List);
      }
    }
    return all;
  }
  if (Array.isArray(fields.List)) {
    return fields.List;
  }
  return [];
}

export function normalizeItemGroupKey(group: string, subGroup?: number): string {
  const cleanGroup = String(group || '').trim();
  if (subGroup !== undefined && subGroup !== null) {
    return `${cleanGroup}#${subGroup}`;
  }
  return cleanGroup;
}
