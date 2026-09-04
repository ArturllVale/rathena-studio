import { useMemo } from 'react';
import { computeSemanticDiff } from '@/utils/semanticDiff';
import { GitCompare } from 'lucide-react';

interface SemanticDiffViewerProps {
  original: Record<string, unknown>;
  pending: Record<string, unknown>;
  title?: string;
}

export function SemanticDiffViewer({
  original,
  pending,
  title = 'Unsaved Changes',
}: SemanticDiffViewerProps) {
  const diffs = useMemo(() => {
    return computeSemanticDiff(original, pending);
  }, [original, pending]);

  if (diffs.length === 0) return null;

  return (
    <div className="bg-card border border-border/80 rounded-xl overflow-hidden font-mono text-xs shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border/80 text-foreground">
        <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-pastel-blue">
          <GitCompare className="w-3.5 h-3.5" />
          <span>{title}</span>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border/60 font-medium">
          {diffs.length} change{diffs.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Diff Entries */}
      <div className="divide-y divide-border/40 max-h-48 overflow-y-auto">
        {diffs.map((diff) => (
          <div key={diff.path} className="text-[11px]">
            {/* Field Path Header */}
            <div className="px-3 py-1 bg-muted/30 text-muted-foreground font-medium flex items-center justify-between text-[10px] border-b border-border/30">
              <span className="text-pastel-blue/90 font-semibold">{diff.path}</span>
              <span className="text-muted-foreground/70 uppercase text-[9px]">{diff.type}</span>
            </div>

            {/* Old Value (Removed/Replaced) */}
            {(diff.type === 'modified' || diff.type === 'removed') && (
              <div className="flex items-start gap-2 px-3 py-1 bg-destructive/10 text-destructive border-l-2 border-destructive">
                <span className="text-destructive font-bold select-none w-3 text-center shrink-0">-</span>
                <span className="break-all whitespace-pre-wrap font-mono line-through opacity-80">
                  {diff.formattedOld}
                </span>
              </div>
            )}

            {/* New Value (Added/Replaced) */}
            {(diff.type === 'modified' || diff.type === 'added') && (
              <div className="flex items-start gap-2 px-3 py-1 bg-pastel-mint/15 text-pastel-mint border-l-2 border-pastel-mint">
                <span className="text-pastel-mint font-bold select-none w-3 text-center shrink-0">+</span>
                <span className="break-all whitespace-pre-wrap font-mono font-medium">
                  {diff.formattedNew}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
