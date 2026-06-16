import { Activity, ExternalLink, Layers, Radio, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { osintSeverityTone, vesselClassTone } from "@/lib/styles";
import { formatClock, formatShortDateTime } from "@/lib/utils";

export function ChokepointPanel({ items, onSelect }) {
  return (
    <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ship className="h-5 w-5 text-emerald-300" /> Strait traffic
        </CardTitle>
        <CardDescription className="text-zinc-400">Tagged traffic through modeled chokepoints.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-zinc-100">{item.name}</div>
                <div className="text-xs text-zinc-400">{item.note}</div>
              </div>
              <Badge className={item.severity === "high" ? "border-red-400/20 bg-red-500/10 text-red-200" : "border-zinc-700 bg-zinc-900 text-zinc-100"}>
                {item.tracks.length} tracks
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
              <div>
                Vessels
                <br />
                <span className="text-zinc-100">{item.vessels.length}</span>
              </div>
              <div>
                Aircraft
                <br />
                <span className="text-zinc-100">{item.aircraft.length}</span>
              </div>
              <div>
                Military
                <br />
                <span className="text-zinc-100">{item.military.length}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.vesselClasses.map((kind) => (
                <Badge key={kind.name} className={vesselClassTone(kind.name)}>
                  {kind.name}: {kind.count}
                </Badge>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {item.tracks.slice(0, 4).map((track) => (
                <button key={track.id} onClick={() => onSelect(track.id)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-left text-xs text-zinc-300">
                  <span className="text-zinc-100">{track.id}</span> - {track.operator} - {track.type}
                </button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MilitaryBriefPanel({ summary }) {
  return (
    <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5 text-orange-300" /> Military brief
        </CardTitle>
        <CardDescription className="text-zinc-400">Nation, service, theater, and priority breakdown.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SummaryList title="Top nations" items={summary.nations} />
        <div className="grid gap-3 md:grid-cols-2">
          <SummaryList title="Services" items={summary.services} />
          <SummaryList title="Theaters" items={summary.theaters} />
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Priority bands</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.priorities.map((item) => (
              <Badge key={item.name} className={item.name === "High" ? "border-red-400/20 bg-red-500/10 text-red-200" : item.name === "Elevated" ? "border-orange-400/20 bg-orange-500/10 text-orange-200" : "border-zinc-700 bg-zinc-900 text-zinc-100"}>
                {item.name}: {item.count}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryList({ title, items }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{title}</div>
      <div className="mt-3 space-y-2 text-sm text-zinc-300">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span>{item.name}</span>
            <span className="text-zinc-100">{item.count}</span>
          </div>
        ))}
        {items.length === 0 && <div className="text-zinc-500">No tracks in this group.</div>}
      </div>
    </div>
  );
}

export function LiveFeedPanel({ entries }) {
  return (
    <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-emerald-300" /> Live feed
        </CardTitle>
        <CardDescription className="text-zinc-400">Rolling updates generated from the moving world picture.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-zinc-100">{entry.title}</div>
                  <div className="text-xs text-zinc-400">{formatClock(entry.ts)}</div>
                </div>
                <Badge className={entry.level === "warning" ? "border-orange-400/20 bg-orange-500/10 text-orange-200" : "border-zinc-700 bg-zinc-900 text-zinc-100"}>
                  {entry.level}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-zinc-300">{entry.detail}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function OsintPanel({ status, events, resources }) {
  return (
    <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Radio className="h-5 w-5 text-sky-300" /> OSINT explorer
        </CardTitle>
        <CardDescription className="text-zinc-400">Live public feeds are separated from deeper sources that need keys, proxies, or manual collection.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="live">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-950">
            <TabsTrigger value="live">Live feeds</TabsTrigger>
            <TabsTrigger value="catalog">Resources</TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-zinc-100">Status</div>
                  <div className="mt-1 text-zinc-400">{status.state} • {events.length} mapped events</div>
                </div>
                <Badge className={status.state === "connected" ? osintSeverityTone("low") : status.state === "degraded" ? osintSeverityTone("medium") : osintSeverityTone("high")}>
                  {status.state}
                </Badge>
              </div>
              <div className="mt-3 space-y-2">
                {status.sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between gap-3">
                    <span>{source.name}</span>
                    <span className={source.ok ? "text-emerald-200" : "text-orange-200"}>
                      {source.ok ? `${source.count} events` : source.error || "unavailable"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {events.slice(0, 8).map((item) => (
                <a key={item.id} href={item.link || "#"} target="_blank" rel="noreferrer" className="block rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition hover:bg-zinc-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-zinc-100">{item.title}</div>
                      <div className="mt-1 text-xs text-zinc-400">{item.sourceName} • {formatShortDateTime(item.updatedAt)}</div>
                    </div>
                    <Badge className={osintSeverityTone(item.severity)}>{item.category}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">{item.detail}</div>
                  {item.note && <div className="mt-2 text-xs text-zinc-500">{item.note}</div>}
                </a>
              ))}
              {events.length === 0 && <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">No live public events are loaded right now.</div>}
            </div>
          </TabsContent>
          <TabsContent value="catalog" className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-zinc-100">{resource.name}</div>
                    <div className="mt-1 text-xs text-zinc-400">{resource.category}</div>
                  </div>
                  <Badge className={resource.access === "browser" ? osintSeverityTone("low") : resource.access === "api-key" || resource.access === "registration" ? osintSeverityTone("medium") : osintSeverityTone("high")}>
                    {resource.access}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-zinc-300">{resource.note}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={resource.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-100">
                    Docs <ExternalLink className="h-3 w-3" />
                  </a>
                  <a href={resource.feedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
                    Endpoint <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
