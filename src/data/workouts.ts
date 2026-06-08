// src/types/workout.ts

export type WorkoutStatus =
  | "planned"
  | "in_progress"
  | "completed";

export type WorkoutSet = {
  id: string;
  reps: number;
  weight: number;

  // Future features
  durationSec?: number;
  distance?: number;

  // Notes
  notes?: string;

  // Future planned prescriptions
  targetReps?: number;
  targetWeight?: number;

  completed?: boolean;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;

  sets: WorkoutSet[];

  // Exercise-level notes
  notes?: string;
};

export type Workout = {
  id: string;

  // Currently being used as workout type
  // (Upper Body, Lower Body, Cardio, etc.)
  name: string;

  date: string;

  exercises: WorkoutExercise[];

  // Workout-level notes
  notes?: string;

  // Status system
  status: WorkoutStatus;

  completedAt?: string;
};