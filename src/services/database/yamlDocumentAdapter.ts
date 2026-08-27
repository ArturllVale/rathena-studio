import YAML, { Document, isMap, isSeq, isScalar, Node, Pair, Scalar } from 'yaml';
import { SourceItemRange } from '../../domain/database/item/sourceItem';

export class YamlDocumentAdapter {
  private readonly document: Document;
  private readonly lineStarts: number[];

  private constructor(document: Document, rawContent: string) {
    this.document = document;
    this.lineStarts = this.computeLineStarts(rawContent);
  }

  public static parse(rawYaml: string): YamlDocumentAdapter {
    const doc = YAML.parseDocument(rawYaml, {
      keepSourceTokens: true,
      customTags: ['binary'],
      uniqueKeys: false,
    });

    return new YamlDocumentAdapter(doc, rawYaml);
  }

  public getRawDocument(): Document {
    return this.document;
  }

  public getErrors(): readonly Error[] {
    return this.document.errors;
  }

  public getWarnings(): readonly Error[] {
    return this.document.warnings;
  }

  public toJS<T = unknown>(): T {
    return this.document.toJS() as T;
  }

  public toString(): string {
    return this.document.toString({
      indent: 2,
      singleQuote: false,
    });
  }

  public getIn(path: readonly (string | number)[]): unknown {
    const node = this.document.getIn(path, true);
    if (node === undefined) {
      return undefined;
    }
    if (isScalar(node)) {
      return node.value;
    }
    if (isMap(node) || isSeq(node)) {
      return (node as Node).toJS(this.document);
    }
    return node;
  }

  public setIn(path: readonly (string | number)[], value: unknown): void {
    if (path.length === 0) {
      return;
    }
    // If setting multiline string for script, format cleanly
    if (typeof value === 'string' && value.includes('\n') && (path[path.length - 1] === 'Script' || path[path.length - 1] === 'EquipScript' || path[path.length - 1] === 'UnEquipScript')) {
      const scalar = new Scalar(value);
      scalar.type = Scalar.BLOCK_LITERAL;
      this.document.setIn(path, scalar);
    } else {
      this.document.setIn(path, value);
    }
  }

  public deleteIn(path: readonly (string | number)[]): boolean {
    return this.document.deleteIn(path);
  }

  public getNodeRange(path: readonly (string | number)[]): SourceItemRange | undefined {
    const node = this.document.getIn(path, true);
    if (!node || typeof node !== 'object') {
      return undefined;
    }

    const astNode = node as Node;
    if (!astNode.range) {
      return undefined;
    }

    const [startOffset, endOffset] = astNode.range;
    const startPos = this.offsetToLineCol(startOffset);
    const endPos = this.offsetToLineCol(endOffset);

    return {
      startOffset,
      endOffset,
      startLine: startPos.line,
      startColumn: startPos.column,
      endLine: endPos.line,
      endColumn: endPos.column,
    };
  }

  public getItemRanges(itemIndex: number): {
    entityRange?: SourceItemRange;
    fieldRanges: Record<string, SourceItemRange>;
  } {
    const bodyNode = this.document.get('Body', true);
    if (!isSeq(bodyNode)) {
      return { fieldRanges: {} };
    }

    const itemNode = bodyNode.get(itemIndex, true);
    if (!isMap(itemNode)) {
      return { fieldRanges: {} };
    }

    let entityRange: SourceItemRange | undefined;
    if (itemNode.range) {
      const [startOffset, endOffset] = itemNode.range;
      const startPos = this.offsetToLineCol(startOffset);
      const endPos = this.offsetToLineCol(endOffset);
      entityRange = {
        startOffset,
        endOffset,
        startLine: startPos.line,
        startColumn: startPos.column,
        endLine: endPos.line,
        endColumn: endPos.column,
      };
    }

    const fieldRanges: Record<string, SourceItemRange> = {};

    for (const pair of itemNode.items as Pair[]) {
      if (isScalar(pair.key) && pair.value) {
        const keyName = String(pair.key.value);
        const valueNode = pair.value as Node;
        if (valueNode.range) {
          const [startOffset, endOffset] = valueNode.range;
          const startPos = this.offsetToLineCol(startOffset);
          const endPos = this.offsetToLineCol(endOffset);
          fieldRanges[keyName] = {
            startOffset,
            endOffset,
            startLine: startPos.line,
            startColumn: startPos.column,
            endLine: endPos.line,
            endColumn: endPos.column,
          };
        }
      }
    }

    return { entityRange, fieldRanges };
  }

  private computeLineStarts(content: string): number[] {
    const starts = [0];
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\n') {
        starts.push(i + 1);
      }
    }
    return starts;
  }

  private offsetToLineCol(offset: number): { line: number; column: number } {
    let low = 0;
    let high = this.lineStarts.length - 1;
    let lineIdx = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.lineStarts[mid] <= offset) {
        lineIdx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const line = lineIdx + 1;
    const column = offset - this.lineStarts[lineIdx] + 1;
    return { line, column };
  }
}
