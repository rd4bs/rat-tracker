export type WorkoutStatus = "planned" | "in_progress" | "completed";

export type WorkoutSet = {
  id: string;

  reps: number;
  weight: number;

  targetReps?: number;
  targetWeight?: number;

  durationSec?: number;
  distance?: number;
  completed?: boolean;
  notes?: string;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
};

export type Workout = {
  id: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
  notes?: string;
  status?: WorkoutStatus;
  completedAt?: string;
};