import type { WorkoutStatus } from "@/types/workout";

export function getWorkoutStatusLabel(status?: WorkoutStatus) {
  if (status === "in_progress") return "In Progress";
  if (status === "completed") return "Completed";
  return "Planned";
}

export function getWorkoutStatusIcon(status?: WorkoutStatus) {
  if (status === "in_progress") return "IP";
  if (status === "completed") return "C";
  return "P";
}
