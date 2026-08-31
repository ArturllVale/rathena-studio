import { EffectiveItem } from '../../domain/database/item/effectiveItem';
import {
  AREA_SIZE,
  DEFTYPE_MAX,
  ITEM_NAME_LENGTH,
  ITEM_TYPES,
  MAX_ARMOR_LEVEL,
  MAX_LEVEL,
  MAX_SLOTS,
  MAX_WEAPON_LEVEL,
  MAX_ZENY,
  WEAPON_SUBTYPES,
  AMMO_SUBTYPES,
  CARD_SUBTYPES,
} from '../../domain/database/item/itemTypes';
import { SourceItem } from '../../domain/database/item/sourceItem';

export interface ValidationIssue {
  readonly itemId?: number;
  readonly severity: 'error' | 'warning';
  readonly field?: string;
  readonly message: string;
  readonly layerId?: string;
}

export class ItemDatabaseValidator {
  public validateSourceItem(item: SourceItem, isBaseLayer: boolean): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (item.id <= 0) {
      issues.push({
        itemId: item.id,
        severity: 'error',
        field: 'Id',
        message: `Invalid Item ID: ${item.id}. ID must be a positive integer.`,
        layerId: item.sourceLayerId,
      });
    }

    if (isBaseLayer) {
      if (!item.fields.AegisName) {
        issues.push({
          itemId: item.id,
          severity: 'error',
          field: 'AegisName',
          message: `Mandatory field "AegisName" is missing for item ${item.id}.`,
          layerId: item.sourceLayerId,
        });
      }

      if (!item.fields.Name) {
        issues.push({
          itemId: item.id,
          severity: 'error',
          field: 'Name',
          message: `Mandatory field "Name" is missing for item ${item.id}.`,
          layerId: item.sourceLayerId,
        });
      }
    }

    if (item.fields.AegisName && item.fields.AegisName.length > ITEM_NAME_LENGTH) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'AegisName',
        message: `AegisName "${item.fields.AegisName}" exceeds maximum length of ${ITEM_NAME_LENGTH}.`,
        layerId: item.sourceLayerId,
      });
    }

    if (item.fields.Name && item.fields.Name.length > ITEM_NAME_LENGTH) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'Name',
        message: `Name "${item.fields.Name}" exceeds maximum length of ${ITEM_NAME_LENGTH}.`,
        layerId: item.sourceLayerId,
      });
    }

    if (item.fields.Type && !ITEM_TYPES.includes(item.fields.Type)) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'Type',
        message: `Invalid item Type "${item.fields.Type}", defaulting to "Etc".`,
        layerId: item.sourceLayerId,
      });
    }

    if (item.fields.SubType) {
      const type = item.fields.Type;
      const subType = item.fields.SubType;

      if (type === 'Weapon') {
        if (!WEAPON_SUBTYPES.includes(subType as (typeof WEAPON_SUBTYPES)[number])) {
          issues.push({
            itemId: item.id,
            severity: 'warning',
            field: 'SubType',
            message: `Invalid weapon SubType "${subType}".`,
            layerId: item.sourceLayerId,
          });
        }
      } else if (type === 'Ammo') {
        if (!AMMO_SUBTYPES.includes(subType as (typeof AMMO_SUBTYPES)[number])) {
          issues.push({
            itemId: item.id,
            severity: 'warning',
            field: 'SubType',
            message: `Invalid ammo SubType "${subType}".`,
            layerId: item.sourceLayerId,
          });
        }
      } else if (type === 'Card') {
        if (!CARD_SUBTYPES.includes(subType as (typeof CARD_SUBTYPES)[number])) {
          issues.push({
            itemId: item.id,
            severity: 'warning',
            field: 'SubType',
            message: `Invalid card SubType "${subType}".`,
            layerId: item.sourceLayerId,
          });
        }
      } else {
        issues.push({
          itemId: item.id,
          severity: 'warning',
          field: 'SubType',
          message: `SubType is not supported for item type "${type}".`,
          layerId: item.sourceLayerId,
        });
      }
    }

    return issues;
  }

  public validateEffectiveItem(item: EffectiveItem): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const fields = item.fields;
    
    if (fields.Buy !== undefined && fields.Buy < 0) {
      issues.push({
        itemId: item.id,
        severity: 'error',
        field: 'Buy',
        message: `Buying price cannot be negative.`,
      });
    }

    if (fields.Sell !== undefined && fields.Sell < 0) {
      issues.push({
        itemId: item.id,
        severity: 'error',
        field: 'Sell',
        message: `Selling price cannot be negative.`,
      });
    }

    if (fields.Buy !== undefined && fields.Buy > MAX_ZENY) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'Buy',
        message: `Buying price ${fields.Buy} exceeds MAX_ZENY (${MAX_ZENY}).`,
      });
    }

    if (fields.Sell !== undefined && fields.Sell > MAX_ZENY) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'Sell',
        message: `Selling price ${fields.Sell} exceeds MAX_ZENY (${MAX_ZENY}).`,
      });
    }

    // Exploit guard
    if (fields.Buy !== undefined && fields.Sell !== undefined && fields.Buy > 0 && fields.Sell > 0) {
      if (fields.Buy / 124.0 < fields.Sell / 75.0) {
        issues.push({
          itemId: item.id,
          severity: 'warning',
          field: 'Sell',
          message: `Buying/Selling price ratio allows Zeny making exploit with Discount/Overcharge!`,
        });
      }
    }

    if (fields.Defense !== undefined && fields.Defense > DEFTYPE_MAX) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'Defense',
        message: `Defense ${fields.Defense} exceeds DEFTYPE_MAX (${DEFTYPE_MAX}).`,
      });
    }

    if (fields.Range !== undefined && fields.Range > AREA_SIZE) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'Range',
        message: `Attack range ${fields.Range} exceeds AREA_SIZE (${AREA_SIZE}).`,
      });
    }

    if (fields.Slots !== undefined && fields.Slots > MAX_SLOTS) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'Slots',
        message: `Slots ${fields.Slots} exceeds MAX_SLOTS (${MAX_SLOTS}).`,
      });
    }

    if (fields.WeaponLevel !== undefined && fields.WeaponLevel > MAX_WEAPON_LEVEL) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'WeaponLevel',
        message: `WeaponLevel ${fields.WeaponLevel} exceeds MAX_WEAPON_LEVEL (${MAX_WEAPON_LEVEL}).`,
      });
    }

    if (fields.ArmorLevel !== undefined && fields.ArmorLevel > MAX_ARMOR_LEVEL) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'ArmorLevel',
        message: `ArmorLevel ${fields.ArmorLevel} exceeds MAX_ARMOR_LEVEL (${MAX_ARMOR_LEVEL}).`,
      });
    }

    if (fields.EquipLevelMin !== undefined && fields.EquipLevelMin > MAX_LEVEL) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'EquipLevelMin',
        message: `EquipLevelMin ${fields.EquipLevelMin} exceeds MAX_LEVEL (${MAX_LEVEL}).`,
      });
    }

    if (fields.EquipLevelMax !== undefined && fields.EquipLevelMax > MAX_LEVEL) {
      issues.push({
        itemId: item.id,
        severity: 'warning',
        field: 'EquipLevelMax',
        message: `EquipLevelMax ${fields.EquipLevelMax} exceeds MAX_LEVEL (${MAX_LEVEL}).`,
      });
    }

    return issues;
  }
}
