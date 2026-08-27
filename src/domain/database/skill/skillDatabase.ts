import { SourceSkill } from './sourceSkill';

export interface SkillDatabaseHeader {
  readonly type: 'SKILL_DB';
  readonly version: number;
}

export interface SkillDatabaseFooterImport {
  readonly path: string;
  readonly mode?: string;
}

export interface SkillDatabaseFooter {
  readonly imports: readonly SkillDatabaseFooterImport[];
}

export interface SkillDatabaseFile {
  readonly header: SkillDatabaseHeader;
  readonly skills: ReadonlyMap<number, SourceSkill>;
  readonly footer?: SkillDatabaseFooter;
}
