import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { LIVE_EVENTS } from "@/data/constants";

export function TimelinePanel({ timeline, setTimeline, timelineEvent }) {
  return (
    <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-zinc-300" /> Event timeline
        </CardTitle>
        <CardDescription className="text-zinc-400">Use the globe for place, then this for sequence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">Closest event at current time marker</div>
          <Badge className="border-zinc-700 bg-zinc-900 text-zinc-100">T+ {timeline[0]} min</Badge>
        </div>
        <Slider value={timeline} onValueChange={setTimeline} min={0} max={100} step={1} />
        <div className="grid gap-3 md:grid-cols-4">
          {LIVE_EVENTS.map((event) => (
            <button key={event.t} onClick={() => setTimeline([event.t])} className={`rounded-2xl border p-4 text-left ${timelineEvent.t === event.t ? "border-cyan-400/40 bg-zinc-900" : "border-zinc-800 bg-zinc-950"}`}>
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">T+ {event.t}</div>
              <div className="mt-1 font-medium text-zinc-100">{event.title}</div>
              <div className="mt-2 text-xs text-zinc-400">{event.detail}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
