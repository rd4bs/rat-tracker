import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutTemplate,
} from "@/types/workout";
import { createId } from "./id.ts";

function setTargetReps(set: WorkoutSet) {
  return set.targetReps ?? set.reps ?? set.actualReps;
}

function setTargetWeight(set: WorkoutSet) {
  return set.targetWeight ?? set.weight ?? set.actualWeight;
}

export function cloneSetForPlannedWorkout(
  set: WorkoutSet,
  includeActualResults = false
): WorkoutSet {
  const plannedSet: WorkoutSet = {
    id: createId(),
    targetReps: setTargetReps(set),
    targetWeight: setTargetWeight(set),
    durationSec: set.durationSec,
    distance: set.distance,
  };

  if (!includeActualResults) {
    return plannedSet;
  }

  return {
    ...plannedSet,
    actualReps: set.actualReps,
    actualWeight: set.actualWeight,
    reps: set.reps,
    weight: set.weight,
    completed: set.completed,
    notes: set.notes,
  };
}

export function cloneExerciseForPlannedWorkout(
  workoutExercise: WorkoutExercise,
  includeActualResults = false
): WorkoutExercise {
  return {
    id: createId(),
    exerciseId: workoutExercise.exerciseId,
    notes: workoutExercise.notes,
    sets: workoutExercise.sets.map((set) =>
      cloneSetForPlannedWorkout(set, includeActualResults)
    ),
  };
}

export function createPlannedWorkoutFromWorkout(
  sourceWorkout: Workout,
  date: string,
  includeActualResults = false,
  name = sourceWorkout.name
): Workout {
  return {
    id: createId(),
    date,
    name: name.trim() || sourceWorkout.name,
    notes: sourceWorkout.notes,
    status: "planned",
    exercises: sourceWorkout.exercises.map((workoutExercise) =>
      cloneExerciseForPlannedWorkout(workoutExercise, includeActualResults)
    ),
  };
}

export function createWorkoutTemplateFromWorkout(
  sourceWorkout: Workout
): WorkoutTemplate {
  const now = new Date().toISOString();

  return {
    id: createId(),
    name: sourceWorkout.name || "Workout Template",
    notes: sourceWorkout.notes,
    exercises: sourceWorkout.exercises.map((workoutExercise) =>
      cloneExerciseForPlannedWorkout(workoutExercise)
    ),
    createdAt: now,
    updatedAt: now,
  };
}

export function createPlannedWorkoutFromTemplate(
  template: WorkoutTemplate,
  date: string,
  name = template.name
): Workout {
  return {
    id: createId(),
    date,
    name: name.trim() || template.name,
    notes: template.notes,
    status: "planned",
    exercises: template.exercises.map((workoutExercise) =>
      cloneExerciseForPlannedWorkout(workoutExercise)
    ),
  };
}
