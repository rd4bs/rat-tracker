import { db } from "@/db/db";
import type { Exercise } from "@/types/exercise";
import type { DailyHealthMetrics } from "@/types/health";
import type { Workout, WorkoutTemplate } from "@/types/workout";

const BACKUP_APP_ID = "rat-tracker";
const LEGACY_BACKUP_APP_IDS = ["gym-tracker"] as const;
const SUPPORTED_BACKUP_APP_IDS = [
  BACKUP_APP_ID,
  ...LEGACY_BACKUP_APP_IDS,
] as const;
const BACKUP_VERSION = 3;
const SUPPORTED_BACKUP_VERSIONS = [1, 2, 3];

export type RatTrackerBackup = {
  app: (typeof SUPPORTED_BACKUP_APP_IDS)[number];
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

export type BackupImportMode = "overwrite" | "skipExisting";

export type BackupImportPreview = {
  exportedAt: string;
  version: number;
  counts: BackupImportResult;
  conflicts: BackupImportResult;
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

function parseBackup(value: unknown): RatTrackerBackup {
  if (!isRecord(value)) {
    throw new Error("The selected file is not a Rat Tracker backup.");
  }

  if (
    !SUPPORTED_BACKUP_APP_IDS.includes(
      value.app as (typeof SUPPORTED_BACKUP_APP_IDS)[number]
    ) ||
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

  return value as RatTrackerBackup;
}

function backupCounts(backup: RatTrackerBackup): BackupImportResult {
  return {
    exerciseCount: backup.exercises.length,
    workoutCount: backup.workouts.length,
    healthMetricCount: backup.healthMetrics?.length ?? 0,
    templateCount: backup.workoutTemplates?.length ?? 0,
  };
}

async function countExisting<T>(
  records: T[],
  getKey: (record: T) => string,
  table: { bulkGet: (keys: string[]) => Promise<unknown[]> }
) {
  if (records.length === 0) return 0;

  const existingRecords = await table.bulkGet(records.map(getKey));
  return existingRecords.filter(Boolean).length;
}

async function filterNewRecords<T>(
  records: T[],
  getKey: (record: T) => string,
  table: { bulkGet: (keys: string[]) => Promise<unknown[]> }
) {
  if (records.length === 0) return records;

  const keys = records.map(getKey);
  const existingRecords = await table.bulkGet(keys);

  return records.filter((_, index) => !existingRecords[index]);
}

export async function previewRatTrackerBackup(
  backupText: string
): Promise<BackupImportPreview> {
  const backup = parseBackup(JSON.parse(backupText));

  const [
    exerciseConflicts,
    workoutConflicts,
    healthMetricConflicts,
    templateConflicts,
  ] = await Promise.all([
    countExisting(backup.exercises, (exercise) => exercise.id, db.exercises),
    countExisting(backup.workouts, (workout) => workout.id, db.workouts),
    countExisting(
      backup.healthMetrics ?? [],
      (healthMetric) => healthMetric.date,
      db.healthMetrics
    ),
    countExisting(
      backup.workoutTemplates ?? [],
      (template) => template.id,
      db.workoutTemplates
    ),
  ]);

  return {
    exportedAt: backup.exportedAt,
    version: backup.version,
    counts: backupCounts(backup),
    conflicts: {
      exerciseCount: exerciseConflicts,
      workoutCount: workoutConflicts,
      healthMetricCount: healthMetricConflicts,
      templateCount: templateConflicts,
    },
  };
}

export async function createRatTrackerBackup(): Promise<RatTrackerBackup> {
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

export async function importRatTrackerBackup(
  backupText: string,
  mode: BackupImportMode = "overwrite"
): Promise<BackupImportResult> {
  const backup = parseBackup(JSON.parse(backupText));

  const exercises =
    mode === "skipExisting"
      ? await filterNewRecords(
          backup.exercises,
          (exercise) => exercise.id,
          db.exercises
        )
      : backup.exercises;
  const workouts =
    mode === "skipExisting"
      ? await filterNewRecords(
          backup.workouts,
          (workout) => workout.id,
          db.workouts
        )
      : backup.workouts;
  const healthMetrics =
    mode === "skipExisting"
      ? await filterNewRecords(
          backup.healthMetrics ?? [],
          (healthMetric) => healthMetric.date,
          db.healthMetrics
        )
      : backup.healthMetrics ?? [];
  const workoutTemplates =
    mode === "skipExisting"
      ? await filterNewRecords(
          backup.workoutTemplates ?? [],
          (template) => template.id,
          db.workoutTemplates
        )
      : backup.workoutTemplates ?? [];

  await db.transaction(
    "rw",
    db.exercises,
    db.workouts,
    db.healthMetrics,
    db.workoutTemplates,
    async () => {
      await db.exercises.bulkPut(exercises);
      await db.workouts.bulkPut(workouts);

      if (healthMetrics.length) {
        await db.healthMetrics.bulkPut(healthMetrics);
      }

      if (workoutTemplates.length) {
        await db.workoutTemplates.bulkPut(workoutTemplates);
      }
    }
  );

  return {
    exerciseCount: exercises.length,
    workoutCount: workouts.length,
    healthMetricCount: healthMetrics.length,
    templateCount: workoutTemplates.length,
  };
}
