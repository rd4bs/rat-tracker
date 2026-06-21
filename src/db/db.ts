import Dexie, { type Table } from "dexie";
import type { Exercise } from "@/types/exercise";
import type { DailyHealthMetrics } from "@/types/health";
import type { Workout, WorkoutTemplate } from "@/types/workout";

export class GymTrackerDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  healthMetrics!: Table<DailyHealthMetrics, string>;
  workoutTemplates!: Table<WorkoutTemplate, string>;

  constructor() {
    super("gymTrackerDB");

    this.version(1).stores({
      exercises: "id, name, isCustom",
      workouts: "id, date, name",
    });

    this.version(2).stores({
      exercises: "id, name, isCustom",
      workouts: "id, date, name",
      healthMetrics: "date",
    });

    this.version(3).stores({
      exercises: "id, name, isCustom",
      workouts: "id, date, name",
      healthMetrics: "date",
      workoutTemplates: "id, name, updatedAt",
    });
  }
}

export const db = new GymTrackerDB();
