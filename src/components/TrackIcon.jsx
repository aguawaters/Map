import { Plane, Satellite, Ship } from "lucide-react";

export function TrackIcon({ type, className = "h-4 w-4" }) {
  if (type === "aircraft") return <Plane className={className} />;
  if (type === "satellite") return <Satellite className={className} />;
  return <Ship className={className} />;
}
