import { db } from "@/db/db";
import type { Exercise } from "@/types/exercise";
import type { Workout } from "@/types/workout";

const BACKUP_APP_ID = "gym-tracker";
const BACKUP_VERSION = 1;

export type GymTrackerBackup = {
  app: typeof BACKUP_APP_ID;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  exercises: Exercise[];
  workouts: Workout[];
};

export type BackupImportResult = {
  exerciseCount: number;
  workoutCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isExercise(value: unknown): value is Exercise {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return false;
  }

  if (!isRecord(value.muscles) || !isStringArray(value.muscles.primary)) {
    return false;
  }

  if (
    value.muscles.secondary !== undefined &&
    !isStringArray(value.muscles.secondary)
  ) {
    return false;
  }

  if (
    value.muscles.stabilizer !== undefined &&
    !isStringArray(value.muscles.stabilizer)
  ) {
    return false;
  }

  return true;
}

function isWorkout(value: unknown): value is Workout {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.date !== "string" ||
    !Array.isArray(value.exercises)
  ) {
    return false;
  }

  return value.exercises.every((workoutExercise) => {
    if (!isRecord(workoutExercise)) return false;
    if (
      typeof workoutExercise.id !== "string" ||
      typeof workoutExercise.exerciseId !== "string" ||
      !Array.isArray(workoutExercise.sets)
    ) {
      return false;
    }

    return workoutExercise.sets.every(
      (set) => isRecord(set) && typeof set.id === "string"
    );
  });
}

function parseBackup(value: unknown): GymTrackerBackup {
  if (!isRecord(value)) {
    throw new Error("The selected file is not a Gym Tracker backup.");
  }

  if (value.app !== BACKUP_APP_ID || value.version !== BACKUP_VERSION) {
    throw new Error("The selected backup is not compatible with this app.");
  }

  if (!Array.isArray(value.exercises) || !Array.isArray(value.workouts)) {
    throw new Error("The selected backup is missing required data.");
  }

  if (!value.exercises.every(isExercise)) {
    throw new Error("The selected backup contains invalid exercise data.");
  }

  if (!value.workouts.every(isWorkout)) {
    throw new Error("The selected backup contains invalid workout data.");
  }

  return value as GymTrackerBackup;
}

export async function createGymTrackerBackup(): Promise<GymTrackerBackup> {
  const [exercises, workouts] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
  ]);

  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    exercises,
    workouts,
  };
}

export async function importGymTrackerBackup(
  backupText: string
): Promise<BackupImportResult> {
  const backup = parseBackup(JSON.parse(backupText));

  await db.transaction("rw", db.exercises, db.workouts, async () => {
    await db.exercises.bulkPut(backup.exercises);
    await db.workouts.bulkPut(backup.workouts);
  });

  return {
    exerciseCount: backup.exercises.length,
    workoutCount: backup.workouts.length,
  };
}
