/**
 * YYC Nest: one-click data ingestion.
 * Path in repo: app/api/admin/ingest/route.ts
 *
 * Visit  https://YOUR-SITE.vercel.app/api/admin/ingest?secret=YOUR_INGEST_SECRET
 * It downloads the 6 City of Calgary datasets, counts things per community,
 * and upserts one row per community into Supabase `community_metrics`.
 *
 * No extra npm packages needed (uses fetch + plain math).
 *
 * Vercel env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL       (or SUPABASE_URL)
 *   SUPABASE_SECRET_KEY            (server only, NOT NEXT_PUBLIC_;
 *                                   SUPABASE_SERVICE_ROLE_KEY also works)
 *   INGEST_SECRET                  (any long random string you invent)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const URLS = {
  communities: "https://data.calgary.ca/resource/surr-xmvs.geojson?$limit=5000",
  recreation: "https://data.calgary.ca/resource/hxfu-6d96.json?$limit=5000",
  offleash: "https://data.calgary.ca/resource/enr4-crti.json?$limit=5000",
  parks: "https://data.calgary.ca/resource/g9tt-m7s3.geojson?$limit=50000",
  lrt: "https://data.calgary.ca/resource/2axz-xm4q.geojson?$limit=5000",
  schools: "https://data.calgary.ca/resource/fd9t-tdn2.geojson?$limit=5000",
};

type Ring = number[][];
type Poly = Ring[]; // [outer, ...holes]

// ---------- tiny geometry helpers ----------
function polysOf(geom: any): Poly[] {
  if (!geom) return [];
  if (geom.type === "Polygon") return [geom.coordinates];
  if (geom.type === "MultiPolygon") return geom.coordinates;
  return [];
}

function inRing(x: number, y: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inPoly(x: number, y: number, poly: Poly): boolean {
  if (!inRing(x, y, poly[0])) return false;
  for (let k = 1; k < poly.length; k++) if (inRing(x, y, poly[k])) return false;
  return true;
}

function ringArea(ring: Ring): number {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return a / 2;
}

function ringCentroid(ring: Ring): [number, number] {
  const a = ringArea(ring);
  if (Math.abs(a) < 1e-14) return [ring[0][0], ring[0][1]];
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
  }
  return [cx / (6 * a), cy / (6 * a)];
}

/** Centre of the largest polygon in a (Multi)Polygon. */
function geomCentroid(geom: any): [number, number] | null {
  const polys = polysOf(geom);
  if (!polys.length) return null;
  let best = polys[0];
  for (const p of polys) {
    if (Math.abs(ringArea(p[0])) > Math.abs(ringArea(best[0]))) best = p;
  }
  return ringCentroid(best[0]);
}

function bboxOf(polys: Poly[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polys) {
    for (const [x, y] of p[0]) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

function haversineKm(lng1: number, lat1: number, lng2: number, lat2: number) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// ---------- the route ----------
export async function GET(req: Request) {
  try {
    const secret = new URL(req.url).searchParams.get("secret");
    if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supaUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    // Supabase's new dashboard calls this SUPABASE_SECRET_KEY (sb_secret_...);
    // older projects call it SUPABASE_SERVICE_ROLE_KEY. Either works here.
    const serviceKey =
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supaUrl || !serviceKey) {
      return Response.json(
        { error: "Missing Supabase URL or SUPABASE_SECRET_KEY" },
        { status: 500 }
      );
    }
    // New-style sb_secret_ keys are not JWTs, so only legacy keys (eyJ...)
    // may be sent as a Bearer token.
    const authHeaders: Record<string, string> = { apikey: serviceKey };
    if (serviceKey.startsWith("eyJ")) {
      authHeaders.Authorization = `Bearer ${serviceKey}`;
    }

    const [communities, recreation, offleash, parks, lrt, schools] =
      await Promise.all(Object.values(URLS).map(getJson));

    // 1. Residential communities
    type Comm = {
      code: string;
      name: string;
      polys: Poly[];
      bbox: ReturnType<typeof bboxOf>;
      lng: number;
      lat: number;
      parks: number;
      rec: number;
      offleash: number;
      schools: number;
      lrtKm: number | null;
    };
    const comms = new Map<string, Comm>();
    for (const f of communities.features) {
      const p = f.properties;
      if (p.class !== "Residential") continue;
      const polys = polysOf(f.geometry);
      const c = geomCentroid(f.geometry);
      if (!polys.length || !c) continue;
      comms.set(p.comm_code, {
        code: p.comm_code,
        name: titleCase(p.name),
        polys,
        bbox: bboxOf(polys),
        lng: c[0],
        lat: c[1],
        parks: 0,
        rec: 0,
        offleash: 0,
        schools: 0,
        lrtKm: null,
      });
    }

    const locate = (x: number, y: number): Comm | null => {
      for (const c of comms.values()) {
        const b = c.bbox;
        if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) continue;
        if (c.polys.some((p) => inPoly(x, y, p))) return c;
      }
      return null;
    };

    // 2. Parks (already tagged with community code)
    for (const f of parks.features) {
      const p = f.properties;
      if (p.life_cycle_status !== "ACTIVE") continue;
      if (!String(p.is_park ?? "").toUpperCase().startsWith("YES")) continue;
      const c = comms.get(p.comm_cd);
      if (c) c.parks++;
    }

    // 3. Recreation facilities
    for (const r of recreation) {
      const co = r.point?.coordinates;
      if (!co) continue;
      const c = locate(co[0], co[1]);
      if (c) c.rec++;
    }

    // 4. Off-leash areas (open ones, by centre point)
    for (const o of offleash) {
      if (o.status !== "OPEN") continue;
      const ctr = geomCentroid(o.multipolygon);
      if (!ctr) continue;
      const c = locate(ctr[0], ctr[1]);
      if (c) c.offleash++;
    }

    // 5. Schools (skip post-secondary)
    for (const s of schools.features) {
      if (s.properties.postsecond === "Y" || !s.geometry) continue;
      const [x, y] = s.geometry.coordinates;
      const c = locate(x, y);
      if (c) c.schools++;
    }

    // 6. LRT: one point per station name
    const stations = new Map<string, number[]>();
    for (const s of lrt.features) {
      if (s.properties.status !== "Current" || !s.geometry) continue;
      stations.set(s.properties.stationnam, s.geometry.coordinates);
    }
    for (const c of comms.values()) {
      let best = Infinity;
      for (const [sx, sy] of stations.values()) {
        best = Math.min(best, haversineKm(c.lng, c.lat, sx, sy));
      }
      c.lrtKm = Math.round(best * 100) / 100;
    }

    // 7. Build rows (dedupe by name since name is the primary key)
    const now = new Date().toISOString();
    const rowsByName = new Map<string, any>();
    for (const c of comms.values()) {
      const prev = rowsByName.get(c.name);
      rowsByName.set(c.name, {
        community_name: c.name,
        park_count: (prev?.park_count ?? 0) + c.parks,
        rec_facility_count: (prev?.rec_facility_count ?? 0) + c.rec,
        offleash_count: (prev?.offleash_count ?? 0) + c.offleash,
        school_count: (prev?.school_count ?? 0) + c.schools,
        km_to_nearest_lrt: c.lrtKm,
        centroid_lat: c.lat,
        centroid_lng: c.lng,
        updated_at: now,
      });
    }
    const rows = [...rowsByName.values()];

    // 8. Upsert into Supabase through its REST API (no SDK needed)
    for (let i = 0; i < rows.length; i += 100) {
      const res = await fetch(
        `${supaUrl}/rest/v1/community_metrics?on_conflict=community_name`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(rows.slice(i, i + 100)),
        }
      );
      if (!res.ok) {
        throw new Error(`Supabase ${res.status}: ${await res.text()}`);
      }
    }

    return Response.json({
      ok: true,
      communities: rows.length,
      lrt_stations: stations.size,
      sample: rows.slice(0, 3),
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
