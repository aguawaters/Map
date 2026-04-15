import { LocateFixed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COUNTRY_INTEL } from "@/data/constants";
import { badgeTone, vesselClassTone } from "@/lib/styles";
import { getCountryFromTrack, getMilitaryProfile, getTrackSignificance } from "@/lib/tracks";

export function AssetDetailPanel({ track, dossier, onOpenCountry }) {
  const selectedMilitary = getMilitaryProfile(track);
  const linkedCountry = getCountryFromTrack(track);
  const significance = getTrackSignificance(track);

  return (
    <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <LocateFixed className="h-5 w-5 text-cyan-300" /> Selected asset
        </CardTitle>
        <CardDescription className="text-zinc-400">Click any aircraft, vessel, or satellite for route, ownership, history, and inferred purpose.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-zinc-100">{dossier?.id || "No selection"}</div>
              <div className="text-xs text-zinc-400">{dossier?.operator || "Pick a track from the globe or registry"}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {track?.type && <Badge className={badgeTone(track.type, track.category)}>{track.category}</Badge>}
              {track?.vesselClass && <Badge className={vesselClassTone(track.vesselClass)}>{track.vesselClass}</Badge>}
            </div>
          </div>

          {dossier && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                Nation / flag
                <br />
                <span className="text-zinc-100">{dossier.nation}</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                Type
                <br />
                <span className="text-zinc-100">{dossier.type}</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                Heading
                <br />
                <span className="text-zinc-100">{dossier.heading} deg</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                Speed
                <br />
                <span className="text-zinc-100">{dossier.speed || "--"}</span>
              </div>
            </div>
          )}

          <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-300">
            <div className="text-zinc-100">Route / flight path</div>
            <div className="mt-1 text-zinc-400">{dossier?.route || "No route available."}</div>
            {dossier?.historySummary && <div className="mt-2 text-zinc-500">{dossier.historySummary}</div>}
          </div>

          <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-300">
            <div className="text-zinc-100">Why this matters</div>
            <div className="mt-1 text-zinc-400">{significance}</div>
            {linkedCountry && COUNTRY_INTEL[linkedCountry] && (
              <Button variant="outline" className="mt-3 border-zinc-700 bg-zinc-950 text-zinc-100" onClick={() => onOpenCountry(linkedCountry)}>
                Open {linkedCountry} brief
              </Button>
            )}
          </div>

          {dossier?.prediction && (
            <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs text-cyan-200">
              <div className="text-zinc-100">Predicted purpose</div>
              <div className="mt-1">{dossier.prediction.purpose}</div>
              <div className="mt-2 text-zinc-400">Confidence: {dossier.prediction.confidence}</div>
            </div>
          )}
        </div>

        {selectedMilitary && (
          <div className="rounded-2xl border border-orange-400/15 bg-orange-500/5 p-4 text-xs text-zinc-300">
            <div className="grid grid-cols-2 gap-3">
              <div>
                Nation
                <br />
                <span className="text-zinc-100">{selectedMilitary.nation}</span>
              </div>
              <div>
                Service
                <br />
                <span className="text-zinc-100">{selectedMilitary.service}</span>
              </div>
              <div>
                Role
                <br />
                <span className="text-zinc-100">{selectedMilitary.role}</span>
              </div>
              <div>
                Priority
                <br />
                <span className="text-zinc-100">{selectedMilitary.priority}</span>
              </div>
            </div>
            <div className="mt-3">
              Mission
              <br />
              <span className="text-zinc-100">{selectedMilitary.mission}</span>
            </div>
            <div className="mt-3">
              Theater
              <br />
              <span className="text-zinc-100">{selectedMilitary.theater}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
          <div className="rounded-xl bg-zinc-950 p-3">
            Lat
            <br />
            <span className="text-zinc-200">{track?.lat?.toFixed(2) || "--"}</span>
          </div>
          <div className="rounded-xl bg-zinc-950 p-3">
            Lon
            <br />
            <span className="text-zinc-200">{track?.lon?.toFixed(2) || "--"}</span>
          </div>
          <div className="rounded-xl bg-zinc-950 p-3">
            Heading
            <br />
            <span className="text-zinc-200">{track ? `${Math.round(track.heading || 0)} deg` : "--"}</span>
          </div>
          <div className="rounded-xl bg-zinc-950 p-3">
            Speed
            <br />
            <span className="text-zinc-200">{track ? Math.round(track.speed || 0) : "--"}</span>
          </div>
        </div>

        {track?.chokepoints?.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Linked chokepoints</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {track.chokepoints.map((name) => (
                <Badge key={name} className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
