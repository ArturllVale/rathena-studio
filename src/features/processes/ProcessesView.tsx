import { Cpu, TerminalSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function ProcessesView() {
  return (
    <div className="h-full w-full p-6 flex flex-col items-center justify-center bg-[#18181b] overflow-auto">
      <Card className="max-w-lg w-full bg-[#1f1f23] border-[#27272a]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-2 w-fit">
            <Cpu className="h-6 w-6 text-emerald-400" />
          </div>
          <CardTitle className="text-sm font-medium text-neutral-100">
            Process Manager
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            Target Phase 8 & 9 (Runtime Engine)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2 text-xs text-neutral-400">
          <div className="bg-[#141416] p-3 rounded border border-[#27272a] space-y-2">
            <div className="text-[11px] font-mono text-neutral-300 font-semibold">Planned Controls:</div>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-neutral-400">
              <li>Login Server process lifecycle (Start/Stop/Restart)</li>
              <li>Char Server process lifecycle</li>
              <li>Map Server process lifecycle</li>
              <li>MySQL/MariaDB service supervisor interface</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
            <TerminalSquare className="h-3.5 w-3.5" />
            <span>Process manager backend module prepared in Tauri core.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
