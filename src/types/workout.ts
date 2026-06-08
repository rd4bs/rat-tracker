export type WorkoutStatus = "planned" | "in_progress" | "completed";

export type WorkoutSet = {
  id: string;

  targetReps?: number;
  targetWeight?: number;

  actualReps?: number;
  actualWeight?: number;

  reps?: number;
  weight?: number;

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
