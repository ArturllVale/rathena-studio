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
    <div className="bg-[#0d1117] border border-[#30363d] rounded-md overflow-hidden font-mono text-xs shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-neutral-300">
        <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-sky-400">
          <GitCompare className="w-3.5 h-3.5" />
          <span>{title}</span>
        </div>
        <span className="text-[10px] text-neutral-400 bg-[#21262d] px-2 py-0.5 rounded-full border border-[#30363d]">
          {diffs.length} change{diffs.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Diff Entries */}
      <div className="divide-y divide-[#21262d]/60 max-h-48 overflow-y-auto">
        {diffs.map((diff) => (
          <div key={diff.path} className="text-[11px]">
            {/* Field Path Header */}
            <div className="px-3 py-1 bg-[#161b22]/40 text-neutral-400 font-medium flex items-center justify-between text-[10px] border-b border-[#21262d]/30">
              <span className="text-sky-300/90">{diff.path}</span>
              <span className="text-neutral-500 uppercase text-[9px]">{diff.type}</span>
            </div>

            {/* Old Value (Removed/Replaced) */}
            {(diff.type === 'modified' || diff.type === 'removed') && (
              <div className="flex items-start gap-2 px-3 py-1 bg-red-950/30 text-red-300 border-l-2 border-red-500">
                <span className="text-red-500 font-bold select-none w-3 text-center shrink-0">-</span>
                <span className="break-all whitespace-pre-wrap font-mono line-through opacity-80">
                  {diff.formattedOld}
                </span>
              </div>
            )}

            {/* New Value (Added/Replaced) */}
            {(diff.type === 'modified' || diff.type === 'added') && (
              <div className="flex items-start gap-2 px-3 py-1 bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500">
                <span className="text-emerald-500 font-bold select-none w-3 text-center shrink-0">+</span>
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
