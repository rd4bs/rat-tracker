import { db } from "@/db/db";
import type { Exercise } from "@/types/exercise";
import type { DailyHealthMetrics } from "@/types/health";
import type { Workout, WorkoutTemplate } from "@/types/workout";

const BACKUP_APP_ID = "gym-tracker";
const BACKUP_VERSION = 3;
const SUPPORTED_BACKUP_VERSIONS = [1, 2, 3];

export type GymTrackerBackup = {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  workouts: Workout[];
  healthMetrics?: DailyHealthMetrics[];
  workoutTemplates?: WorkoutTemplate[];
};

export type BackupImportResult = {
  exerciseCount: number;
  workoutCount: number;
  healthMetricCount: number;
  templateCount: number;
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

function isHealthMetric(value: unknown): value is DailyHealthMetrics {
  if (!isRecord(value)) return false;

  return (
    typeof value.date === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isWorkoutTemplate(value: unknown): value is WorkoutTemplate {
  if (!isRecord(value)) return false;

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !Array.isArray(value.exercises) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return false;
  }

  return value.exercises.every((workoutExercise) => {
    if (!isRecord(workoutExercise)) return false;

    return (
      typeof workoutExercise.id === "string" &&
      typeof workoutExercise.exerciseId === "string" &&
      Array.isArray(workoutExercise.sets) &&
      workoutExercise.sets.every(
        (set) => isRecord(set) && typeof set.id === "string"
      )
    );
  });
}

function parseBackup(value: unknown): GymTrackerBackup {
  if (!isRecord(value)) {
    throw new Error("The selected file is not a Gym Tracker backup.");
  }

  if (
    value.app !== BACKUP_APP_ID ||
    typeof value.version !== "number" ||
    !SUPPORTED_BACKUP_VERSIONS.includes(value.version)
  ) {
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

  if (
    value.healthMetrics !== undefined &&
    (!Array.isArray(value.healthMetrics) ||
      !value.healthMetrics.every(isHealthMetric))
  ) {
    throw new Error("The selected backup contains invalid health data.");
  }

  if (
    value.workoutTemplates !== undefined &&
    (!Array.isArray(value.workoutTemplates) ||
      !value.workoutTemplates.every(isWorkoutTemplate))
  ) {
    throw new Error("The selected backup contains invalid template data.");
  }

  return value as GymTrackerBackup;
}

export async function createGymTrackerBackup(): Promise<GymTrackerBackup> {
  const [exercises, workouts, healthMetrics, workoutTemplates] =
    await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.healthMetrics.toArray(),
    db.workoutTemplates.toArray(),
  ]);

  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    exercises,
    workouts,
    healthMetrics,
    workoutTemplates,
  };
}

export async function importGymTrackerBackup(
  backupText: string
): Promise<BackupImportResult> {
  const backup = parseBackup(JSON.parse(backupText));

  await db.transaction(
    "rw",
    db.exercises,
    db.workouts,
    db.healthMetrics,
    db.workoutTemplates,
    async () => {
      await db.exercises.bulkPut(backup.exercises);
      await db.workouts.bulkPut(backup.workouts);

      if (backup.healthMetrics?.length) {
        await db.healthMetrics.bulkPut(backup.healthMetrics);
      }

      if (backup.workoutTemplates?.length) {
        await db.workoutTemplates.bulkPut(backup.workoutTemplates);
      }
    }
  );

  return {
    exerciseCount: backup.exercises.length,
    workoutCount: backup.workouts.length,
    healthMetricCount: backup.healthMetrics?.length ?? 0,
    templateCount: backup.workoutTemplates?.length ?? 0,
  };
}
