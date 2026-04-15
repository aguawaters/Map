import { useEffect, useMemo, useRef, useState } from "react";
import { Globe as GlobeIcon, Pause, Play, RotateCcw } from "lucide-react";
import { AssetDetailPanel } from "@/components/AssetDetailPanel";
import { BriefingPanel } from "@/components/BriefingPanel";
import { ControlsPanel } from "@/components/ControlsPanel";
import { GlobeSurface } from "@/components/GlobeSurface";
import { RegistryPanel } from "@/components/RegistryPanel";
import { ChokepointPanel, LiveFeedPanel, MilitaryBriefPanel } from "@/components/RightRailPanels";
import { TimelinePanel } from "@/components/TimelinePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildInitialTracks,
  buildLiveEntries,
  filterTracks,
  getAssetDossier,
  nearestTimelineEvent,
  stepTrack,
  summarizeChokepointTraffic,
  summarizeMilitary,
  summarizeStats,
  validateTracks,
} from "@/lib/tracks";
import { hasLonLat } from "@/lib/utils";

const BASELINE_TRACKS = buildInitialTracks();

const DEFAULT_FILTERS = {
  query: "",
  onlyMilitary: false,
  hideCommercial: false,
  vesselClass: "all",
  showTypes: { aircraft: true, vessel: true, satellite: true },
};

const DEFAULT_DISPLAY = {
  labels: true,
  trails: true,
  routes: true,
  chokepoints: true,
};

function buildInitialHistory(tracks) {
  return tracks.reduce((acc, track) => {
    if (hasLonLat(track)) acc[track.id] = [[track.lon, track.lat]];
    return acc;
  }, {});
}

export default function PublicSituationalAwarenessDashboard() {
  const frameRef = useRef(0);
  const tracksRef = useRef(BASELINE_TRACKS);
  const selectedIdRef = useRef(BASELINE_TRACKS[0]?.id || null);

  const [tracks, setTracks] = useState(BASELINE_TRACKS);
  const [selectedId, setSelectedId] = useState(BASELINE_TRACKS[0]?.id || null);
  const [history, setHistory] = useState(() => buildInitialHistory(BASELINE_TRACKS));
  const [playing, setPlaying] = useState(true);
  const [liveMode, setLiveMode] = useState(true);
  const [timeline, setTimeline] = useState([56]);
  const [regionKey, setRegionKey] = useState("global");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [display, setDisplay] = useState(DEFAULT_DISPLAY);
  const [refreshMs, setRefreshMs] = useState([1200]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [liveFeed, setLiveFeed] = useState(() => [
    { id: "boot-0", ts: new Date(), level: "info", title: "Live feed ready", detail: "Simulated global watch surface online." },
    { id: "boot-1", ts: new Date(), level: "info", title: "Global traffic baseline", detail: `${BASELINE_TRACKS.filter((track) => track.type === "aircraft").length} air tracks and ${BASELINE_TRACKS.filter((track) => track.type === "vessel").length} maritime tracks initialized.` },
  ]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (!playing || !liveMode) return undefined;

    const timer = window.setInterval(() => {
      const nextFrame = frameRef.current + 1;
      frameRef.current = nextFrame;
      const nextTracks = tracksRef.current.map((track) => stepTrack(track, nextFrame)).filter(Boolean);
      tracksRef.current = nextTracks;

      setTracks(nextTracks);
      setHistory((current) => {
        const copy = { ...current };
        nextTracks.forEach((track) => {
          if (!hasLonLat(track)) return;
          copy[track.id] = [...(copy[track.id] || []), [track.lon, track.lat]].slice(-22);
        });
        return copy;
      });
      setLastUpdated(new Date());
      setLiveFeed((current) => [...buildLiveEntries(nextTracks, nextFrame, selectedIdRef.current), ...current].slice(0, 26));
    }, refreshMs[0]);

    return () => window.clearInterval(timer);
  }, [liveMode, playing, refreshMs]);

  const safeTracks = useMemo(() => tracks.filter(hasLonLat), [tracks]);
  const filteredTracks = useMemo(() => filterTracks(safeTracks, filters), [filters, safeTracks]);
  const selectedTrack = useMemo(() => safeTracks.find((track) => track.id === selectedId) || filteredTracks[0] || safeTracks[0] || null, [filteredTracks, safeTracks, selectedId]);
  const selectedDossier = useMemo(() => getAssetDossier(selectedTrack, history), [history, selectedTrack]);
  const stats = useMemo(() => summarizeStats(safeTracks), [safeTracks]);
  const militarySummary = useMemo(() => summarizeMilitary(safeTracks), [safeTracks]);
  const chokepointTraffic = useMemo(() => summarizeChokepointTraffic(safeTracks), [safeTracks]);
  const timelineEvent = useMemo(() => nearestTimelineEvent(timeline[0]), [timeline]);
  const validationErrors = useMemo(() => validateTracks(BASELINE_TRACKS), []);
  const liveStatus = liveMode ? (playing ? "Live" : "Standby") : "Offline";

  const selectTrack = (id) => {
    if (!id) return;
    setSelectedId(id);
    setSelectedCountry(null);
  };

  const resetAll = () => {
    const resetTracks = buildInitialTracks();
    frameRef.current = 0;
    tracksRef.current = resetTracks;
    selectedIdRef.current = resetTracks[0]?.id || null;
    setTracks(resetTracks);
    setHistory(buildInitialHistory(resetTracks));
    setSelectedId(resetTracks[0]?.id || null);
    setRegionKey("global");
    setTimeline([56]);
    setSelectedCountry(null);
    setFilters(DEFAULT_FILTERS);
    setDisplay(DEFAULT_DISPLAY);
    setLastUpdated(new Date());
    setLiveFeed([{ id: `boot-${Date.now()}`, ts: new Date(), level: "info", title: "Feed reset", detail: "Live stream reset to baseline simulated state." }]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100 md:p-8">
      <div className="mx-auto max-w-[1860px] space-y-6">
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <ControlsPanel
              filters={filters}
              setFilters={setFilters}
              display={display}
              setDisplay={setDisplay}
              liveMode={liveMode}
              setLiveMode={setLiveMode}
              refreshMs={refreshMs}
              setRefreshMs={setRefreshMs}
              stats={stats}
              liveStatus={liveStatus}
              lastUpdated={lastUpdated}
              militarySummary={militarySummary}
              validationErrors={validationErrors}
            />
            <RegistryPanel tracks={filteredTracks} selectedId={selectedTrack?.id} onSelect={selectTrack} />
          </div>

          <div className="space-y-6">
            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60 shadow-2xl shadow-black/30">
              <CardHeader>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <GlobeIcon className="h-6 w-6 text-cyan-300" /> Stable map
                    </CardTitle>
                    <CardDescription className="mt-2 text-zinc-400">Deterministic SVG globe with synthetic air, sea, and orbital tracks.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={liveMode ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-zinc-700 bg-zinc-900 text-zinc-400"}>{liveStatus}</Badge>
                    <Button variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-100" onClick={() => setPlaying((value) => !value)}>
                      {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {playing ? "Pause" : "Play"}
                    </Button>
                    <Button variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-100" onClick={resetAll}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <GlobeSurface
                  tracks={filteredTracks}
                  selectedId={selectedTrack?.id}
                  onSelect={selectTrack}
                  regionKey={regionKey}
                  setRegionKey={setRegionKey}
                  display={display}
                  setDisplay={setDisplay}
                  stats={stats}
                  history={history}
                />
              </CardContent>
            </Card>

            <BriefingPanel selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} />
            <TimelinePanel timeline={timeline} setTimeline={setTimeline} timelineEvent={timelineEvent} />
          </div>

          <div className="space-y-6">
            <AssetDetailPanel track={selectedTrack} dossier={selectedDossier} onOpenCountry={setSelectedCountry} />
            <ChokepointPanel items={chokepointTraffic} onSelect={selectTrack} />
            <MilitaryBriefPanel summary={militarySummary} />
            <LiveFeedPanel entries={liveFeed} />
          </div>
        </div>
      </div>
    </div>
  );
}
