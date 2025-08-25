import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/distance?from=<lat,lon>&to=<lat,lon>
 * Retour: { distanceKm:number, durationMin?:number, mode:"osrm"|"haversine" }
 *
 * Essaie OSRM (route routière) puis fallback Haversine si échec.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // "lat,lon"
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Missing 'from' or 'to'" }, { status: 400 });
  }

  const [fLatStr, fLonStr] = from.split(",").map((s) => s.trim());
  const [tLatStr, tLonStr] = to.split(",").map((s) => s.trim());
  const fLat = parseFloat(fLatStr), fLon = parseFloat(fLonStr);
  const tLat = parseFloat(tLatStr), tLon = parseFloat(tLonStr);

  if ([fLat, fLon, tLat, tLon].some((v) => Number.isNaN(v))) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // --- 1) Try OSRM public demo server (driving) ---
  // Docs: https://project-osrm.org/docs/v5.5.1/api/
  try {
    // OSRM attend "lon,lat"
    const url = `https://router.project-osrm.org/route/v1/driving/${fLon},${fLat};${tLon},${tLat}?overview=false`;
    const res = await fetch(url, { next: { revalidate: 60 } }); // 1 min cache
    if (res.ok) {
      const json = await res.json();
      const distMeters = json?.routes?.[0]?.distance;
      const durSec = json?.routes?.[0]?.duration;
      if (typeof distMeters === "number") {
        return NextResponse.json({
          distanceKm: distMeters / 1000,
          durationMin: durSec ? durSec / 60 : undefined,
          mode: "osrm",
        });
      }
    }
  } catch {
    // ignore
  }

  // --- 2) Fallback Haversine (vol d'oiseau) ---
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(tLat - fLat);
  const dLon = toRad(tLon - fLon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fLat)) * Math.cos(toRad(tLat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return NextResponse.json({ distanceKm: d, mode: "haversine" });
}
