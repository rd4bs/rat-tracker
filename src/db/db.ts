import Dexie, { type Table } from "dexie";
import type { Exercise } from "@/types/exercise";
import type { Workout } from "@/types/workout";

export class GymTrackerDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;

  constructor() {
    super("gymTrackerDB");

    this.version(1).stores({
      exercises: "id, name, isCustom",
      workouts: "id, date, name",
    });
  }
}

export const db = new GymTrackerDB();