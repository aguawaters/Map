import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMilitaryProfile } from "@/lib/tracks";
import { badgeTone, vesselClassTone } from "@/lib/styles";
import { TrackIcon } from "@/components/TrackIcon";

function RegistryRow({ track, selectedId, onSelect }) {
  const military = getMilitaryProfile(track);
  const selected = selectedId === track.id;

  return (
    <button onClick={() => onSelect(track.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected ? "border-cyan-400/50 bg-zinc-900" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-zinc-900 p-2">
            <TrackIcon type={track.type} />
          </div>
          <div>
            <div className="font-medium text-zinc-100">{track.id}</div>
            <div className="text-xs text-zinc-400">{track.operator}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={badgeTone(track.type, track.category)}>{track.category}</Badge>
          {track.vesselClass && <Badge className={vesselClassTone(track.vesselClass)}>{track.vesselClass}</Badge>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
        <div>{track.type}</div>
        <div>Lat {track.lat.toFixed(1)}</div>
        <div>Lon {track.lon.toFixed(1)}</div>
      </div>
      {track.chokepoints?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {track.chokepoints.map((name) => (
            <Badge key={name} className="border-zinc-700 bg-zinc-900 text-zinc-100">
              {name}
            </Badge>
          ))}
        </div>
      )}
      {military && (
        <div className="mt-3 rounded-xl border border-orange-400/15 bg-orange-500/5 p-2 text-[11px] text-zinc-300">
          <div>
            {military.nation} • {military.service}
          </div>
          <div className="text-zinc-400">
            {military.role}, {military.mission}
          </div>
        </div>
      )}
    </button>
  );
}

export function RegistryPanel({ tracks, selectedId, onSelect }) {
  return (
    <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5 text-violet-300" /> Registry
        </CardTitle>
        <CardDescription className="text-zinc-400">{tracks.length} rendered tracks after filters.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[760px] pr-4">
          <div className="space-y-3">
            {tracks.map((track) => (
              <RegistryRow key={track.id} track={track} selectedId={selectedId} onSelect={onSelect} />
            ))}
            {tracks.length === 0 && <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">No tracks match the current filters.</div>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
