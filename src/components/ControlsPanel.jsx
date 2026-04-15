import { Activity, Layers, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { VESSEL_CLASS_OPTIONS } from "@/data/constants";
import { vesselClassTone } from "@/lib/styles";
import { formatClock } from "@/lib/utils";

export function ControlsPanel({
  filters,
  setFilters,
  display,
  setDisplay,
  liveMode,
  setLiveMode,
  refreshMs,
  setRefreshMs,
  stats,
  liveStatus,
  lastUpdated,
  militarySummary,
  validationErrors,
}) {
  const updateFilters = (patch) => setFilters((current) => ({ ...current, ...patch }));
  const toggleType = (type) => {
    setFilters((current) => ({
      ...current,
      showTypes: { ...current.showTypes, [type]: !current.showTypes[type] },
    }));
  };
  const toggleDisplay = (key) => setDisplay((current) => ({ ...current, [key]: !current[key] }));

  return (
    <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5 text-cyan-300" /> Controls
        </CardTitle>
        <CardDescription className="text-zinc-400">Filter tracks and tune the simulated live view.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input value={filters.query} onChange={(event) => updateFilters({ query: event.target.value })} placeholder="Search track, operator, route, airport, port" className="border-zinc-700 bg-zinc-950" />

        <div className="grid grid-cols-2 gap-2">
          {[
            ["aircraft", `Aircraft ${stats.aircraft}`],
            ["vessel", `Vessels ${stats.vessels}`],
            ["satellite", `Satellites ${stats.satellites}`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => toggleType(key)} className={`rounded-xl border px-3 py-2 text-left text-sm ${filters.showTypes[key] ? "border-cyan-400/40 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-500"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
            <div>
              <div className="font-medium">Only military</div>
              <div className="text-xs text-zinc-400">Cut the noise fast</div>
            </div>
            <Switch checked={filters.onlyMilitary} onCheckedChange={(value) => updateFilters({ onlyMilitary: value })} />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
            <div>
              <div className="font-medium">Hide commercial</div>
              <div className="text-xs text-zinc-400">Keep state-linked traffic</div>
            </div>
            <Switch checked={filters.hideCommercial} onCheckedChange={(value) => updateFilters({ hideCommercial: value })} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Commercial vessel classes</div>
          <div className="flex flex-wrap gap-2">
            {VESSEL_CLASS_OPTIONS.map((kind) => (
              <button key={kind} onClick={() => updateFilters({ vesselClass: kind })} className={`rounded-full border px-3 py-1 text-xs ${filters.vesselClass === kind ? "border-cyan-400/40 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}>
                {kind === "all" ? "All" : kind}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.vesselClasses.map((item) => (
              <Badge key={item.name} className={vesselClassTone(item.name)}>
                {item.name}: {item.count}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className={`h-4 w-4 ${liveMode ? "text-emerald-300" : "text-zinc-500"}`} />
              <div>
                <div className="text-sm font-medium text-zinc-100">Live stream</div>
                <div className="text-xs text-zinc-400">
                  {liveStatus} • last update {formatClock(lastUpdated)}
                </div>
              </div>
            </div>
            <Switch checked={liveMode} onCheckedChange={setLiveMode} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Refresh cadence</span>
              <span>{refreshMs[0]} ms</span>
            </div>
            <Slider value={refreshMs} onValueChange={setRefreshMs} min={500} max={3000} step={100} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-100">
            <Layers className="h-4 w-4 text-violet-300" /> Map layers
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["labels", "Labels"],
              ["trails", "Trails"],
              ["routes", "Route lines"],
              ["chokepoints", "Chokepoints"],
            ].map(([key, label]) => (
              <button key={key} onClick={() => toggleDisplay(key)} className={`rounded-xl border px-3 py-2 text-left text-sm ${display[key] ? "border-cyan-400/50 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}>
                {label} {display[key] ? "On" : "Off"}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
          <div className="mb-2 font-medium text-zinc-100">Military posture</div>
          <div>
            Total military tracks: <span className="text-zinc-100">{militarySummary.total}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {militarySummary.nations.map((item) => (
              <Badge key={item.name} className="border-orange-400/20 bg-orange-500/10 text-orange-200">
                {item.name}: {item.count}
              </Badge>
            ))}
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-100">
            {validationErrors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
