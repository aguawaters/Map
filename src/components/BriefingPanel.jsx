import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COUNTRY_INTEL, SCENARIO_BRIEFINGS } from "@/data/constants";

export function BriefingPanel({ selectedCountry, setSelectedCountry }) {
  const countryBrief = selectedCountry ? COUNTRY_INTEL[selectedCountry] || null : null;

  return (
    <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5 text-cyan-300" /> Scenario briefing
        </CardTitle>
        <CardDescription className="text-zinc-400">Simulated context for the operating picture. No live intelligence claims are made.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-100" onClick={() => setSelectedCountry(null)}>
            Overview
          </Button>
          {Object.keys(COUNTRY_INTEL).map((country) => (
            <button key={country} onClick={() => setSelectedCountry(country)} className={`rounded-full border px-3 py-1 text-xs ${selectedCountry === country ? "border-cyan-400/50 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}>
              {country}
            </button>
          ))}
        </div>

        {countryBrief ? (
          <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{selectedCountry}</div>
                <div className="mt-2 text-sm text-zinc-200">{countryBrief.stance}</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Why it matters</div>
                <div className="mt-2 text-sm text-zinc-300">{countryBrief.significance}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Alliances</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {countryBrief.alliances.map((item) => (
                    <Badge key={item} className="border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Tensions</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {countryBrief.tensions.map((item) => (
                    <Badge key={item} className="border-orange-400/20 bg-orange-500/10 text-orange-200">
                      {item}
                    </Badge>
                  ))}
                  {countryBrief.tensions.length === 0 && <span className="text-xs text-zinc-500">None modeled</span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {SCENARIO_BRIEFINGS.map((item) => (
              <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-sm text-zinc-100">{item.title}</div>
                <div className="mt-2 text-sm text-zinc-300">{item.summary}</div>
                <div className="mt-2 text-xs text-zinc-400">Why significant: {item.significance}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <button key={tag} onClick={() => COUNTRY_INTEL[tag] && setSelectedCountry(tag)} className={`rounded-full border px-3 py-1 text-xs ${COUNTRY_INTEL[tag] ? "border-zinc-700 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-500"}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
