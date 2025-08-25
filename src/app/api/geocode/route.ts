import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode?q=<address>&country=be
 * Retour: { lat:number, lon:number, display_name:string }
 *
 * Utilise Nominatim (OSM). Respecte la policy: User-Agent, rate limit, etc.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const country = (searchParams.get("country") || "be").toLowerCase();

  if (!q) {
    return NextResponse.json({ error: "Missing 'q' parameter" }, { status: 400 });
  }

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=${encodeURIComponent(country)}&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim impose un UA explicite
      // https://operations.osmfoundation.org/policies/nominatim/
      "User-Agent": "RecoPhone/1.0 (https://recophone.be)",
      "Accept-Language": "fr-BE",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: res.status });
  }
  const json = await res.json();
  const hit = json?.[0];
  if (!hit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lat = parseFloat(hit.lat);
  const lon = parseFloat(hit.lon);

  return NextResponse.json({ lat, lon, display_name: hit.display_name });
}
