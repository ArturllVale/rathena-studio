import { Database, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function DatabasesView() {
  return (
    <div className="h-full w-full p-6 flex flex-col items-center justify-center bg-[#18181b] overflow-auto">
      <Card className="max-w-lg w-full bg-[#1f1f23] border-[#27272a]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl mb-2 w-fit">
            <Database className="h-6 w-6 text-sky-400" />
          </div>
          <CardTitle className="text-sm font-medium text-neutral-100">
            rAthena Database Engine
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            Target Phase 3 & 4 (Item Database & YAML Engine)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2 text-xs text-neutral-400">
          <div className="bg-[#141416] p-3 rounded border border-[#27272a] space-y-2">
            <div className="text-[11px] font-mono text-neutral-300 font-semibold">Planned Pipeline:</div>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-neutral-400">
              <li>YAML Parser & Serializer (Preserving comments & structure)</li>
              <li>Schema Validation & Semantic Error Model</li>
              <li>Item Database (item_db.yml) Structured Editor</li>
              <li>Integrated Monaco YAML Split View</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Architecture ready for database engine integration.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
