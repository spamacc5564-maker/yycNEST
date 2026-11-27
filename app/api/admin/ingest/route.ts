/**
 * YYC Nest: ingest City of Calgary open data into Supabase `community_metrics`.
 *
 * Run (Node 20+):
 *   npm i -D tsx
 *   npm i @supabase/supabase-js @turf/turf
 *   npx tsx --env-file=.env.local scripts/ingest-calgary-data.ts
 *
 * .env.local needs:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (server/script only, never NEXT_PUBLIC_)
 */
import { createClient } from "@supabase/supabase-js";
import * as turf from "@turf/turf";

const URLS = {
  communities: "https://data.calgary.ca/resource/surr-xmvs.geojson?$limit=5000",
  recreation: "https://data.calgary.ca/resource/hxfu-6d96.json?$limit=5000",
  offleash: "https://data.calgary.ca/resource/enr4-crti.json?$limit=5000",
  parks: "https://data.calgary.ca/resource/g9tt-m7s3.geojson?$limit=50000",
  lrt: "https://data.calgary.ca/resource/2axz-xm4q.geojson?$limit=5000",
  schools: "https://data.calgary.ca/resource/fd9t-tdn2.geojson?$limit=5000",
};

async function getJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

type Metrics = {
  community_name: string;
  park_count: number;
  rec_facility_count: number;
  offleash_count: number;
  school_count: number;
  km_to_nearest_lrt: number | null;
  centroid_lat: number;
  centroid_lng: number;
  updated_at: string;
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  const supabase = createClient(url, key);

  console.log("Downloading datasets...");
  const [communities, recreation, offleash, parks, lrt, schools] =
    await Promise.all(Object.values(URLS).map(getJson));

  // 1. Residential communities only (skip industrial, parks, etc.)
  const comms = communities.features.filter(
    (f: any) => f.properties.class === "Residential" && f.geometry
  );
  console.log(`Communities: ${comms.length}`);

  const byCode = new Map<string, Metrics>();
  const polys = new Map<string, any>();
  for (const f of comms) {
    const c = turf.centroid(f).geometry.coordinates;
    byCode.set(f.properties.comm_code, {
      community_name: titleCase(f.properties.name),
      park_count: 0,
      rec_facility_count: 0,
      offleash_count: 0,
      school_count: 0,
      km_to_nearest_lrt: null,
      centroid_lng: c[0],
      centroid_lat: c[1],
      updated_at: new Date().toISOString(),
    });
    polys.set(f.properties.comm_code, f);
  }

  // Find which community a [lng, lat] point sits in
  const locate = (lng: number, lat: number): string | null => {
    const pt = turf.point([lng, lat]);
    for (const [code, poly] of polys) {
      if (turf.booleanPointInPolygon(pt, poly)) return code;
    }
    return null;
  };

  // 2. Parks: already tagged with comm_cd, no geometry work needed
  for (const f of parks.features) {
    const p = f.properties;
    if (p.life_cycle_status !== "ACTIVE") continue;
    if (!String(p.is_park ?? "").toUpperCase().startsWith("YES")) continue;
    const m = byCode.get(p.comm_cd);
    if (m) m.park_count++;
  }

  // 3. Recreation facilities (JSON, `point` = GeoJSON Point)
  for (const r of recreation) {
    const c = r.point?.coordinates;
    if (!c) continue;
    const code = locate(c[0], c[1]);
    if (code) byCode.get(code)!.rec_facility_count++;
  }

  // 4. Off-leash areas (JSON, `multipolygon`): use the area's centre point
  for (const o of offleash) {
    if (o.status !== "OPEN" || !o.multipolygon) continue;
    const c = turf.centroid(turf.feature(o.multipolygon)).geometry.coordinates;
    const code = locate(c[0], c[1]);
    if (code) byCode.get(code)!.offleash_count++;
  }

  // 5. Schools (skip post-secondary)
  for (const s of schools.features) {
    if (s.properties.postsecond === "Y" || !s.geometry) continue;
    const [lng, lat] = s.geometry.coordinates;
    const code = locate(lng, lat);
    if (code) byCode.get(code)!.school_count++;
  }

  // 6. LRT: de-duplicate stations (each has one row per leg/direction)
  const stations = new Map<string, number[]>();
  for (const s of lrt.features) {
    if (s.properties.status !== "Current" || !s.geometry) continue;
    stations.set(s.properties.stationnam, s.geometry.coordinates);
  }
  console.log(`LRT stations: ${stations.size}`);
  for (const m of byCode.values()) {
    const from = turf.point([m.centroid_lng, m.centroid_lat]);
    let best = Infinity;
    for (const c of stations.values()) {
      best = Math.min(best, turf.distance(from, turf.point(c), { units: "kilometers" }));
    }
    m.km_to_nearest_lrt = Math.round(best * 100) / 100;
  }

  // 7. Upsert into Supabase
  const rows = [...byCode.values()];
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase
      .from("community_metrics")
      .upsert(rows.slice(i, i + 100), { onConflict: "community_name" });
    if (error) throw error;
  }
  console.log(`Upserted ${rows.length} communities. Sample:`, rows[0]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
