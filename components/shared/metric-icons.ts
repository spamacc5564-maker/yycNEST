import { Dog, Dumbbell, GraduationCap, TrainFront, Trees, type LucideIcon } from "lucide-react"
import type { MetricKey } from "@/lib/mock-data"

export const METRIC_ICONS: Record<MetricKey, LucideIcon> = {
  parks: Trees,
  recreation: Dumbbell,
  offLeash: Dog,
  schools: GraduationCap,
  lrt: TrainFront,
}
