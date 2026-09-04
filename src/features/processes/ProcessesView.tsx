import { Cpu, TerminalSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function ProcessesView() {
  return (
    <div className="h-full w-full p-8 flex flex-col items-center justify-center bg-background text-foreground overflow-auto">
      <Card className="max-w-lg w-full border-border/80 shadow-sm rounded-2xl">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto p-4 bg-mint/15 border border-mint/30 rounded-2xl mb-2 w-fit shadow-xs">
            <Cpu className="h-7 w-7 text-mint" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground">
            Process Manager
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Runtime Engine &amp; Service Supervisor Interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-1 text-xs text-muted-foreground">
          <div className="bg-muted/30 p-4 rounded-xl border border-border/80 space-y-2.5">
            <div className="text-xs font-mono text-foreground font-semibold">Planned Controls:</div>
            <ul className="list-disc list-inside space-y-1.5 font-mono text-xs text-muted-foreground leading-relaxed">
              <li>Login Server process lifecycle (Start / Stop / Restart)</li>
              <li>Char Server process lifecycle</li>
              <li>Map Server process lifecycle</li>
              <li>MySQL / MariaDB service supervisor interface</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs px-1">
            <TerminalSquare className="h-4 w-4 text-mint shrink-0" />
            <span>Process manager backend module prepared in Tauri core.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
