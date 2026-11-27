export type Transport = "drive" | "transit"

export type PriorityKey = "parks" | "recreation" | "schools"

export type MetricKey = "parks" | "recreation" | "offLeash" | "schools" | "lrt"

export interface Profile {
  rawInput: string
  hasDog: boolean
  transport: Transport
  /** 0–100 importance for each user-set priority */
  priorities: Record<PriorityKey, number>
}

export interface CommunityMetrics {
  parks: number
  greenSpaceHectares: number
  recreationFacilities: number
  offLeashAreas: number
  schools: number
  lrtDistanceKm: number
}

export interface Community {
  id: string
  name: string
  quadrant: "NE" | "NW" | "SE" | "SW"
  coordinates: [number, number]
  metrics: CommunityMetrics
}

export interface RankedCommunity extends Community {
  rank: number
  matchScore: number
  /** 0–100 factor scores used in the bar breakdown */
  scores: Record<MetricKey, number>
  summary: string
  tradeOff: string
}

export interface ScoringBranch {
  id: string
  label: string
  description: string
  fired: boolean
}

export interface Report {
  id: string
  createdAt: string
  dataUpdated: string
  profile: Profile
  communitiesScored: number
  weights: Record<MetricKey, number>
  branches: ScoringBranch[]
  verifier: { claimsChecked: number; claimsPassed: number }
  communities: RankedCommunity[]
}

export const METRIC_LABELS: Record<MetricKey, string> = {
  parks: "Parks",
  recreation: "Recreation",
  offLeash: "Off-leash",
  schools: "Schools",
  lrt: "LRT access",
}

export const PRIORITY_LABELS: Record<PriorityKey, string> = {
  parks: "Parks and green space",
  recreation: "Recreation facilities",
  schools: "Schools",
}

export const DATA_UPDATED = "2026-11-03"

export const COMMUNITIES: Record<string, Community> = {
  bridgeland: {
    id: "bridgeland",
    name: "Bridgeland-Riverside",
    quadrant: "NE",
    coordinates: [51.0545, -114.039],
    metrics: {
      parks: 14,
      greenSpaceHectares: 38.2,
      recreationFacilities: 3,
      offLeashAreas: 2,
      schools: 4,
      lrtDistanceKm: 0.6,
    },
  },
  kensington: {
    id: "kensington",
    name: "Kensington (Hillhurst)",
    quadrant: "NW",
    coordinates: [51.0525, -114.088],
    metrics: {
      parks: 11,
      greenSpaceHectares: 29.4,
      recreationFacilities: 2,
      offLeashAreas: 1,
      schools: 3,
      lrtDistanceKm: 0.4,
    },
  },
  "marda-loop": {
    id: "marda-loop",
    name: "Marda Loop (Altadore)",
    quadrant: "SW",
    coordinates: [51.0185, -114.102],
    metrics: {
      parks: 12,
      greenSpaceHectares: 41.7,
      recreationFacilities: 2,
      offLeashAreas: 3,
      schools: 5,
      lrtDistanceKm: 3.1,
    },
  },
  sunnyside: {
    id: "sunnyside",
    name: "Sunnyside",
    quadrant: "NW",
    coordinates: [51.0565, -114.0805],
    metrics: {
      parks: 8,
      greenSpaceHectares: 17.9,
      recreationFacilities: 1,
      offLeashAreas: 1,
      schools: 2,
      lrtDistanceKm: 0.2,
    },
  },
  tuscany: {
    id: "tuscany",
    name: "Tuscany",
    quadrant: "NW",
    coordinates: [51.1235, -114.2395],
    metrics: {
      parks: 22,
      greenSpaceHectares: 96.3,
      recreationFacilities: 2,
      offLeashAreas: 2,
      schools: 6,
      lrtDistanceKm: 0.9,
    },
  },
}

function rank(
  id: string,
  rankNo: number,
  matchScore: number,
  scores: Record<MetricKey, number>,
  summary: string,
  tradeOff: string,
): RankedCommunity {
  return { ...COMMUNITIES[id], rank: rankNo, matchScore, scores, summary, tradeOff }
}

export const REPORTS: Report[] = [
  {
    id: "r-1024",
    createdAt: "2026-11-24T15:42:00-07:00",
    dataUpdated: DATA_UPDATED,
    communitiesScored: 214,
    profile: {
      rawInput:
        "Moving from Toronto with a husky. I drive to work downtown. I want parks and a rec centre close by.",
      hasDog: true,
      transport: "drive",
      priorities: { parks: 85, recreation: 70, schools: 20 },
    },
    weights: { parks: 0.3, recreation: 0.25, offLeash: 0.3, schools: 0.08, lrt: 0.07 },
    branches: [
      {
        id: "A",
        label: "Branch A: dog owner",
        description: "Off-leash weight raised from 0.05 to 0.30.",
        fired: true,
      },
      {
        id: "B",
        label: "Branch B: transit",
        description: "LRT distance counts at full weight.",
        fired: false,
      },
      {
        id: "C",
        label: "Branch C: driver",
        description: "LRT weight lowered to 0.07 since you drive.",
        fired: true,
      },
    ],
    verifier: { claimsChecked: 27, claimsPassed: 27 },
    communities: [
      rank(
        "bridgeland",
        1,
        92,
        { parks: 94, recreation: 90, offLeash: 88, schools: 70, lrt: 92 },
        "Riverside pathways, a busy off-leash area at Tom Campbell's Hill and the Bridgeland community rec centre all within a short walk.",
        "Older housing stock and limited street parking near Edmonton Trail.",
      ),
      rank(
        "marda-loop",
        2,
        87,
        { parks: 86, recreation: 72, offLeash: 96, schools: 84, lrt: 38 },
        "The most off-leash space of your top 3, with River Park and Sandy Beach right on the Elbow River.",
        "3.1 km to the nearest LRT station, so you will rely on your car.",
      ),
      rank(
        "kensington",
        3,
        81,
        { parks: 78, recreation: 76, offLeash: 62, schools: 64, lrt: 96 },
        "Walkable streets next to Riley Park and the Bow River pathway, with the Louise Riley Library close by.",
        "Only 1 off-leash area, the fewest of your top 3.",
      ),
    ],
  },
  {
    id: "r-1019",
    createdAt: "2026-11-18T09:10:00-07:00",
    dataUpdated: DATA_UPDATED,
    communitiesScored: 214,
    profile: {
      rawInput: "No car, I take the train downtown. Want a gym nearby and a quiet street.",
      hasDog: false,
      transport: "transit",
      priorities: { parks: 40, recreation: 90, schools: 10 },
    },
    weights: { parks: 0.18, recreation: 0.37, offLeash: 0.02, schools: 0.05, lrt: 0.38 },
    branches: [
      {
        id: "A",
        label: "Branch A: dog owner",
        description: "Off-leash weight raised.",
        fired: false,
      },
      {
        id: "B",
        label: "Branch B: transit",
        description: "LRT distance counts at full weight (0.38).",
        fired: true,
      },
      {
        id: "C",
        label: "Branch C: driver",
        description: "LRT weight lowered.",
        fired: false,
      },
    ],
    verifier: { claimsChecked: 24, claimsPassed: 24 },
    communities: [
      rank(
        "sunnyside",
        1,
        90,
        { parks: 62, recreation: 70, offLeash: 50, schools: 52, lrt: 99 },
        "Sunnyside station is 0.2 km away and the downtown core is one stop across the river.",
        "Only 1 recreation facility inside the community boundary.",
      ),
      rank(
        "kensington",
        2,
        88,
        { parks: 78, recreation: 76, offLeash: 62, schools: 64, lrt: 96 },
        "Two recreation facilities and a 0.4 km walk to the LRT.",
        "Busier streets on 10 Street and Kensington Road on weekends.",
      ),
      rank(
        "bridgeland",
        3,
        84,
        { parks: 94, recreation: 90, offLeash: 88, schools: 70, lrt: 92 },
        "Bridgeland/Memorial station at 0.6 km and the highest recreation score of your top 3.",
        "A slightly longer walk to the station than Sunnyside or Kensington.",
      ),
    ],
  },
  {
    id: "r-1007",
    createdAt: "2026-11-02T19:25:00-07:00",
    dataUpdated: "2026-10-06",
    communitiesScored: 212,
    profile: {
      rawInput:
        "Relocating from Vancouver with two kids in elementary school. We have a lab and want lots of parks.",
      hasDog: true,
      transport: "drive",
      priorities: { parks: 90, recreation: 50, schools: 95 },
    },
    weights: { parks: 0.28, recreation: 0.1, offLeash: 0.2, schools: 0.35, lrt: 0.07 },
    branches: [
      {
        id: "A",
        label: "Branch A: dog owner",
        description: "Off-leash weight raised to 0.20.",
        fired: true,
      },
      {
        id: "B",
        label: "Branch B: transit",
        description: "LRT distance counts at full weight.",
        fired: false,
      },
      {
        id: "C",
        label: "Branch C: driver",
        description: "LRT weight lowered to 0.07.",
        fired: true,
      },
    ],
    verifier: { claimsChecked: 26, claimsPassed: 26 },
    communities: [
      rank(
        "tuscany",
        1,
        93,
        { parks: 99, recreation: 72, offLeash: 84, schools: 96, lrt: 88 },
        "22 parks and 6 schools, the most of any community in your results.",
        "About a 25 minute drive to downtown at rush hour (not scored).",
      ),
      rank(
        "marda-loop",
        2,
        86,
        { parks: 86, recreation: 72, offLeash: 96, schools: 84, lrt: 38 },
        "Five schools and three off-leash areas along the Elbow River.",
        "Fewer parks than Tuscany and further from the LRT.",
      ),
      rank(
        "bridgeland",
        3,
        79,
        { parks: 94, recreation: 90, offLeash: 88, schools: 70, lrt: 92 },
        "Strong parks and rec access close to the city centre.",
        "Four schools, the fewest of your top 3.",
      ),
    ],
  },
]

export const INITIAL_SHORTLIST: string[] = ["bridgeland", "marda-loop", "kensington", "tuscany"]

export const EXAMPLE_PROMPTS = [
  "Moving from Toronto with a husky. I drive. I want parks and a rec centre.",
  "No car, I take the train downtown. Want a gym nearby.",
  "Two kids starting elementary school and a lab. Lots of parks, please.",
]

export const CURRENT_USER = {
  name: "Priya Raman",
  email: "priya.raman@northlinehealth.ca",
  initials: "PR",
}

export function getReport(id: string): Report | undefined {
  return REPORTS.find((report) => report.id === id)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function realNumbers(metrics: CommunityMetrics) {
  return [
    { key: "parks" as const, label: `${metrics.parks} parks`, detail: `${metrics.greenSpaceHectares} ha of green space` },
    {
      key: "recreation" as const,
      label: `${metrics.recreationFacilities} recreation ${metrics.recreationFacilities === 1 ? "facility" : "facilities"}`,
    },
    {
      key: "offLeash" as const,
      label: `${metrics.offLeashAreas} off-leash ${metrics.offLeashAreas === 1 ? "area" : "areas"}`,
    },
    { key: "schools" as const, label: `${metrics.schools} schools` },
    { key: "lrt" as const, label: `${metrics.lrtDistanceKm} km to nearest LRT` },
  ]
}
