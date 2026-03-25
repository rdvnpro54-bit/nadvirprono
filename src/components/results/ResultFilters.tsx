import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface ResultFiltersProps {
  sport: string;
  setSport: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  period: string;
  setPeriod: (v: string) => void;
}

export function ResultFilters({ sport, setSport, status, setStatus, period, setPeriod }: ResultFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={sport} onValueChange={setSport}>
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous sports</SelectItem>
          <SelectItem value="football">⚽ Football</SelectItem>
          <SelectItem value="tennis">🎾 Tennis</SelectItem>
          <SelectItem value="basketball">🏀 Basketball</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="high_conf">💎 Haute confiance</SelectItem>
          <SelectItem value="win">✅ Gagnés</SelectItem>
          <SelectItem value="loss">❌ Perdus</SelectItem>
        </SelectContent>
      </Select>
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toute période</SelectItem>
          <SelectItem value="today">Aujourd'hui</SelectItem>
          <SelectItem value="yesterday">Hier</SelectItem>
          <SelectItem value="week">Cette semaine</SelectItem>
          <SelectItem value="month">Ce mois</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
