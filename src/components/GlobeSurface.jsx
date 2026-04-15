import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import countriesAtlas from "world-atlas/countries-110m.json";
import { Globe as GlobeIcon, LocateFixed, Plane, RotateCcw, Satellite, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHOKEPOINTS, CITY_LABELS, COUNTRY_LABELS, NO_FLY_ZONES, REGION_KEYS, REGION_PRESETS } from "@/data/constants";
import { AIRPORTS, AIR_ROUTES, PORTS, SEA_LANES } from "@/data/mockAssets";
import { buildArcPoints } from "@/lib/geo";
import { pointColor } from "@/lib/styles";
import { clamp, hasLonLat, normalizeLon } from "@/lib/utils";

function projectPoint(projection, lon, lat) {
  const point = projection([normalizeLon(lon), lat]);
  return point && Number.isFinite(point[0]) && Number.isFinite(point[1]) ? point : null;
}

export function GlobeSurface({ tracks, selectedId, onSelect, regionKey, setRegionKey, display, setDisplay, stats, history }) {
  const mapHostRef = useRef(null);
  const dragRef = useRef(null);
  const viewRef = useRef(null);
  const rafRef = useRef(null);
  const interactionTimerRef = useRef(null);
  const countryFeatures = useMemo(() => feature(countriesAtlas, countriesAtlas.objects.countries).features, []);
  const [view, setView] = useState(() => {
    const preset = REGION_PRESETS[regionKey] || REGION_PRESETS.global;
    return { lon: preset.lng, lat: preset.lat, scale: Math.round(260 / preset.altitude) };
  });
  const [mapMoving, setMapMoving] = useState(false);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const preset = REGION_PRESETS[regionKey] || REGION_PRESETS.global;
    const nextView = { lon: preset.lng, lat: preset.lat, scale: Math.round(260 / preset.altitude) };
    viewRef.current = nextView;
    setView(nextView);
  }, [regionKey]);

  useEffect(() => {
    const node = mapHostRef.current;
    if (!node) return undefined;
    const preventWheel = (event) => event.preventDefault();
    node.addEventListener("wheel", preventWheel, { passive: false });
    return () => node.removeEventListener("wheel", preventWheel);
  }, []);

  useEffect(() => () => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
  }, []);

  const markMoving = () => {
    setMapMoving(true);
    if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = window.setTimeout(() => setMapMoving(false), 180);
  };

  const applyView = (updater) => {
    const baseView = viewRef.current || view;
    const nextView = updater(baseView);
    viewRef.current = nextView;
    markMoving();
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      setView(viewRef.current);
    });
  };

  const projection = useMemo(() => geoOrthographic().translate([600, 340]).scale(view.scale).rotate([-view.lon, -view.lat]).clipAngle(90).precision(mapMoving ? 1.25 : 0.55), [mapMoving, view.lat, view.lon, view.scale]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule10(), []);
  const selected = tracks.find((track) => track.id === selectedId) || null;
  const isFront = (lon, lat) => hasLonLat({ lon, lat }) && geoDistance([normalizeLon(lon), lat], [view.lon, view.lat]) <= Math.PI / 2;
  const safePath = (obj) => {
    try {
      return path(obj) || "";
    } catch {
      return "";
    }
  };

  const visibleTracks = useMemo(() => tracks.filter((track) => isFront(track.lon, track.lat)), [tracks, view.lat, view.lon]);

  const airArcs = useMemo(() => {
    if (!display.routes || mapMoving) return [];
    return AIR_ROUTES.map((route, index) => {
      const from = AIRPORTS[route.from];
      const to = AIRPORTS[route.to];
      if (!from || !to || !hasLonLat(from) || !hasLonLat(to)) return null;
      const d = safePath({ type: "LineString", coordinates: buildArcPoints({ lat: from.lat, lng: from.lon }, { lat: to.lat, lng: to.lon }).map((point) => [point.lng, point.lat]) });
      return { id: `air-${index}`, category: route.category, d };
    }).filter(Boolean);
  }, [display.routes, mapMoving, path]);

  const seaArcs = useMemo(() => {
    if (!display.routes || mapMoving) return [];
    return SEA_LANES.map((route, index) => {
      const from = PORTS[route.from];
      const to = PORTS[route.to];
      if (!from || !to || !hasLonLat(from) || !hasLonLat(to)) return null;
      const d = safePath({ type: "LineString", coordinates: buildArcPoints({ lat: from.lat, lng: from.lon }, { lat: to.lat, lng: to.lon }).map((point) => [point.lng, point.lat]) });
      return { id: `sea-${index}`, category: route.category, vesselClass: route.vesselClass || null, d };
    }).filter(Boolean);
  }, [display.routes, mapMoving, path]);

  const projectedCountryLabels = useMemo(() => {
    if (!display.labels || mapMoving) return [];
    return COUNTRY_LABELS.filter((item) => isFront(item.lon, item.lat))
      .map((item) => {
        const point = projectPoint(projection, item.lon, item.lat);
        return point ? { ...item, x: point[0], y: point[1] } : null;
      })
      .filter(Boolean);
  }, [display.labels, mapMoving, projection, view.lat, view.lon]);

  const projectedCityLabels = useMemo(() => {
    if (!display.labels || mapMoving || view.scale <= 360) return [];
    return CITY_LABELS.filter((item) => isFront(item.lon, item.lat))
      .map((item) => {
        const point = projectPoint(projection, item.lon, item.lat);
        return point ? { ...item, x: point[0], y: point[1] } : null;
      })
      .filter(Boolean);
  }, [display.labels, mapMoving, projection, view.lat, view.lon, view.scale]);

  const projectedChokepoints = useMemo(() => {
    if (!display.chokepoints || mapMoving) return [];
    return CHOKEPOINTS.filter((item) => isFront(item.centerLon, item.centerLat))
      .map((item) => {
        const point = projectPoint(projection, item.centerLon, item.centerLat);
        return point ? { ...item, x: point[0], y: point[1] } : null;
      })
      .filter(Boolean);
  }, [display.chokepoints, mapMoving, projection, view.lat, view.lon]);

  const zoomBy = (factor) => applyView((current) => ({ ...current, scale: clamp(current.scale * factor, 180, 2200) }));
  const focusSelected = () => {
    if (!selected || !hasLonLat(selected)) return;
    const nextView = { lon: normalizeLon(selected.lon), lat: selected.lat, scale: selected.type === "satellite" ? 900 : 1500 };
    viewRef.current = nextView;
    setView(nextView);
  };

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, lon: view.lon, lat: view.lat };
    markMoving();
  };

  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    const currentView = viewRef.current || view;
    const sensitivity = 120 / currentView.scale;
    applyView(() => ({ ...currentView, lon: normalizeLon(dragRef.current.lon - dx * sensitivity), lat: clamp(dragRef.current.lat + dy * sensitivity, -80, 80) }));
  };

  const onPointerUp = (event) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-100">Areas</div>
            <div className="text-xs text-zinc-400">Preset theaters plus drag and deep zoom.</div>
          </div>
          <Badge className="border-zinc-700 bg-zinc-900 text-zinc-100">{REGION_PRESETS[regionKey].name}</Badge>
        </div>
        <Tabs value={regionKey} onValueChange={setRegionKey}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-zinc-950 p-1">
            {REGION_KEYS.map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {REGION_PRESETS[key].name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{stats.aircraft} aircraft</Badge>
            <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">{stats.vessels} vessels</Badge>
            <Badge className="border-orange-400/20 bg-orange-500/10 text-orange-200">{stats.militaryVessels} naval / military</Badge>
            <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-200">{stats.satellites} satellites</Badge>
          </div>
          <div className="text-xs text-zinc-400">Drag rotates. Wheel zooms inside the globe.</div>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <Badge className="border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
            <Plane className="mr-2 h-4 w-4" /> Aircraft
          </Badge>
          <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
            <Ship className="mr-2 h-4 w-4" /> Commercial vessels
          </Badge>
          <Badge className="border-rose-400/20 bg-rose-500/15 text-rose-200">
            <Ship className="mr-2 h-4 w-4" /> Military vessels
          </Badge>
          <Badge className="border-violet-400/20 bg-violet-500/15 text-violet-200">
            <Satellite className="mr-2 h-4 w-4" /> Satellites
          </Badge>
        </div>

        <div ref={mapHostRef} className="overflow-hidden rounded-[24px] border border-zinc-800 bg-black" style={{ overscrollBehavior: "contain", touchAction: "none" }}>
          <svg
            viewBox="0 0 1200 680"
            className="h-[680px] w-full select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={(event) => {
              event.preventDefault();
              zoomBy(event.deltaY < 0 ? 1.14 : 0.88);
            }}
          >
            <defs>
              <radialGradient id="globeFill" cx="44%" cy="35%" r="75%">
                <stop offset="0%" stopColor="#15314d" />
                <stop offset="68%" stopColor="#09111d" />
                <stop offset="100%" stopColor="#020406" />
              </radialGradient>
            </defs>
            <path d={safePath({ type: "Sphere" })} fill="url(#globeFill)" stroke="rgba(255,255,255,0.24)" strokeWidth="1.5" />
            <path d={safePath(graticule)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

            {countryFeatures.map((country, index) => (
              <path key={index} d={safePath(country)} fill="rgba(80,130,220,0.16)" stroke="rgba(230,240,255,0.34)" strokeWidth={view.scale > 700 ? 1 : 0.7} />
            ))}

            {NO_FLY_ZONES.map((zone) => (
              <path
                key={zone.name}
                d={safePath({ type: "Polygon", coordinates: [[[zone.west, zone.south], [zone.east, zone.south], [zone.east, zone.north], [zone.west, zone.north], [zone.west, zone.south]]] })}
                fill={zone.kind === "high" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)"}
                stroke={zone.kind === "high" ? "rgba(248,113,113,0.85)" : "rgba(251,191,36,0.85)"}
                strokeDasharray="6 5"
              />
            ))}

            {airArcs.map((arc) => (
              <path key={arc.id} d={arc.d} fill="none" stroke={arc.category === "military" ? "rgba(251,146,60,0.52)" : "rgba(103,232,249,0.22)"} strokeWidth={arc.category === "military" ? 1.5 : 1} />
            ))}
            {seaArcs.map((arc) => (
              <path
                key={arc.id}
                d={arc.d}
                fill="none"
                stroke={arc.category === "military" ? "rgba(253,164,175,0.48)" : arc.vesselClass === "tanker" ? "rgba(251,146,60,0.28)" : arc.vesselClass === "lng" ? "rgba(217,70,239,0.28)" : "rgba(134,239,172,0.22)"}
                strokeWidth={arc.category === "military" ? 1.5 : 1.1}
                strokeDasharray={arc.category === "military" ? "4 3" : undefined}
              />
            ))}

            {display.trails && !mapMoving && visibleTracks.map((track) => (
              <path
                key={`${track.id}-trail`}
                d={safePath({ type: "LineString", coordinates: (history[track.id] || []).filter((point) => Array.isArray(point)).map((point) => [normalizeLon(point[0]), point[1]]) })}
                fill="none"
                stroke={pointColor(track)}
                strokeOpacity="0.34"
                strokeWidth={track.type === "satellite" ? 1.5 : 2}
              />
            ))}

            {visibleTracks.map((track) => {
              const point = projectPoint(projection, track.lon, track.lat);
              if (!point) return null;
              const selectedNow = selectedId === track.id;
              return (
                <g key={track.id} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSelect(track.id); }} className="cursor-pointer">
                  <circle cx={point[0]} cy={point[1]} r={selectedNow ? 13 : track.type === "vessel" ? 8 : track.type === "aircraft" ? 7 : 6} fill={pointColor(track)} fillOpacity={track.type === "vessel" ? "0.28" : "0.18"} stroke={selectedNow ? "#ffffff" : pointColor(track)} strokeOpacity="0.85" strokeWidth={selectedNow ? 1.5 : 0.8} />
                  {track.type === "aircraft" && <path d={`M ${point[0]} ${point[1] - 7} L ${point[0] + 5} ${point[1] + 6} L ${point[0]} ${point[1] + 3} L ${point[0] - 5} ${point[1] + 6} Z`} fill={pointColor(track)} />}
                  {track.type === "satellite" && (
                    <g>
                      <rect x={point[0] - 2} y={point[1] - 2} width="4" height="4" fill={pointColor(track)} />
                      <line x1={point[0] - 6} y1={point[1]} x2={point[0] - 2} y2={point[1]} stroke={pointColor(track)} />
                      <line x1={point[0] + 2} y1={point[1]} x2={point[0] + 6} y2={point[1]} stroke={pointColor(track)} />
                    </g>
                  )}
                  {track.type === "vessel" && <path d={`M ${point[0]} ${point[1] - 7} L ${point[0] + 6} ${point[1] + 6} L ${point[0] - 6} ${point[1] + 6} Z`} fill={pointColor(track)} stroke="rgba(0,0,0,0.55)" strokeWidth="0.8" />}
                  {display.labels && !mapMoving && view.scale > 320 && (
                    <>
                      <line x1={point[0]} y1={point[1]} x2={point[0] + 12} y2={point[1] - 9} stroke={pointColor(track)} strokeOpacity="0.7" />
                      <text x={point[0] + 15} y={point[1] - 11} fill={pointColor(track)} fontSize="10.5">{track.id}</text>
                    </>
                  )}
                </g>
              );
            })}

            {projectedCountryLabels.map((label) => (
              <text key={label.name} x={label.x} y={label.y} textAnchor="middle" fill="rgba(255,255,255,0.84)" fontSize={view.scale > 700 ? 12 : 10.5}>
                {label.name.toUpperCase()}
              </text>
            ))}
            {projectedCityLabels.map((label) => (
              <g key={label.name}>
                <circle cx={label.x} cy={label.y} r={label.tier === 1 ? 2.8 : 2.2} fill="rgba(255,255,255,0.92)" />
                <text x={label.x + 5} y={label.y - 4} fill="rgba(190,210,255,0.82)" fontSize={label.tier === 1 ? 10 : 9}>{label.name}</text>
              </g>
            ))}
            {projectedChokepoints.map((item) => (
              <g key={item.name}>
                <circle cx={item.x} cy={item.y} r={view.scale > 700 ? 14 : 10} fill="none" stroke={item.severity === "high" ? "rgba(251,113,133,0.8)" : "rgba(96,165,250,0.8)"} strokeWidth="1.4" strokeDasharray="4 4" />
                <text x={item.x} y={item.y - 16} textAnchor="middle" fill={item.severity === "high" ? "rgba(251,113,133,0.92)" : "rgba(96,165,250,0.92)"} fontSize="10.5">{item.name}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 lg:grid-cols-3">
        <Button variant="outline" className="justify-start border-zinc-700 bg-zinc-950 text-zinc-100" onClick={focusSelected}>
          <LocateFixed className="mr-2 h-4 w-4" /> Focus asset
        </Button>
        <Button variant="outline" className="justify-start border-zinc-700 bg-zinc-950 text-zinc-300" onClick={() => setRegionKey("global")}>
          <GlobeIcon className="mr-2 h-4 w-4" /> Reset view
        </Button>
        <Button variant="outline" className="justify-start border-zinc-700 bg-zinc-950 text-zinc-300" onClick={() => setDisplay({ labels: true, trails: true, routes: true, chokepoints: true })}>
          <RotateCcw className="mr-2 h-4 w-4" /> Restore layers
        </Button>
      </div>
    </div>
  );
}
