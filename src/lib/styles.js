export function pointColor(track) {
  if (track.type === "aircraft") return track.category === "military" ? "#fb923c" : "#67e8f9";
  if (track.type === "satellite") return track.category === "military" ? "#fb7185" : "#c4b5fd";
  if (track.category === "military") return "#fda4af";
  if (track.vesselClass === "tanker") return "#fb923c";
  if (track.vesselClass === "lng") return "#d946ef";
  if (track.vesselClass === "bulk") return "#f59e0b";
  if (track.vesselClass === "ro-ro") return "#10b981";
  return "#86efac";
}

export function badgeTone(type, category) {
  if (type === "aircraft") return category === "military" ? "bg-orange-500/15 text-orange-200 border-orange-400/20" : "bg-cyan-500/15 text-cyan-200 border-cyan-400/20";
  if (type === "satellite") return category === "military" ? "bg-rose-500/15 text-rose-200 border-rose-400/20" : "bg-violet-500/15 text-violet-200 border-violet-400/20";
  return category === "military" ? "bg-pink-500/15 text-pink-200 border-pink-500/15" : "bg-emerald-500/10 text-emerald-200 border-emerald-400/20";
}

export function vesselClassTone(vesselClass) {
  const tones = {
    container: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
    tanker: "border-orange-400/20 bg-orange-500/10 text-orange-200",
    bulk: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    lng: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200",
    "ro-ro": "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    naval: "border-rose-400/20 bg-rose-500/15 text-rose-200",
  };
  return tones[vesselClass] || "border-zinc-700 bg-zinc-900 text-zinc-100";
}
