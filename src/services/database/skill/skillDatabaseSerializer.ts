import { DatabaseVariant } from '../../../domain/database/common/databaseVariant';
import { isLayerCompatibleWithVariant } from '../../../domain/database/common/databaseLayer';
import { SkillRawFields } from '../../../domain/database/skill/skillTypes';
import { RegisteredSkillLayerData } from './layeredSkillRepository';
import { YamlDocumentAdapter } from '../yamlDocumentAdapter';
import { isSeq, YAMLSeq } from 'yaml';

export class SkillDatabaseSerializer {
  public findSkillNodeIndex(layerData: RegisteredSkillLayerData, skillId: number): number {
    const sourceSkill = layerData.file.skills.get(skillId);
    return sourceSkill ? sourceSkill.nodeIndex : -1;
  }

  public updateFieldById(
    layerData: RegisteredSkillLayerData,
    skillId: number,
    field: keyof SkillRawFields | string,
    value: unknown
  ): boolean {
    const nodeIndex = this.findSkillNodeIndex(layerData, skillId);
    if (nodeIndex === -1) {
      return false;
    }
    this.updateSkillField(layerData.adapter, nodeIndex, field, value);
    return true;
  }

  public removeFieldById(
    layerData: RegisteredSkillLayerData,
    skillId: number,
    field: keyof SkillRawFields | string
  ): boolean {
    const nodeIndex = this.findSkillNodeIndex(layerData, skillId);
    if (nodeIndex === -1) {
      return false;
    }
    return this.removeSkillField(layerData.adapter, nodeIndex, field);
  }

  public updateSkillField(
    adapter: YamlDocumentAdapter,
    skillIndex: number,
    field: keyof SkillRawFields | string,
    value: unknown
  ): void {
    adapter.setIn(['Body', skillIndex, field], value);
  }

  public removeSkillField(
    adapter: YamlDocumentAdapter,
    skillIndex: number,
    field: keyof SkillRawFields | string
  ): boolean {
    return adapter.deleteIn(['Body', skillIndex, field]);
  }

  public addSkill(adapter: YamlDocumentAdapter, skill: Partial<SkillRawFields>): number {
    const rawDoc = adapter.getRawDocument();
    let body = rawDoc.get('Body', true);

    if (!body || !isSeq(body)) {
      body = rawDoc.createNode([]);
      if (!rawDoc.has('Body')) {
        if (!rawDoc.has('Header')) {
          rawDoc.set('Header', rawDoc.createNode({ Type: 'SKILL_DB', Version: 3 }));
        }
      }
      rawDoc.set('Body', body);
    }

    const seq = body as YAMLSeq;
    const index = seq.items.length;
    seq.add(rawDoc.createNode(skill));
    return index;
  }

  public removeSkill(adapter: YamlDocumentAdapter, skillIndex: number): boolean {
    return adapter.deleteIn(['Body', skillIndex]);
  }

  public serialize(layerData: RegisteredSkillLayerData, targetVariant: DatabaseVariant): string {
    if (!isLayerCompatibleWithVariant(layerData.layer.variant, targetVariant)) {
      throw new Error(
        `Variant safety violation: Cannot serialize skill layer "${layerData.layer.name}" (variant: ${layerData.layer.variant}) under context for ${targetVariant}.`
      );
    }

    return layerData.adapter.toString();
  }
}
