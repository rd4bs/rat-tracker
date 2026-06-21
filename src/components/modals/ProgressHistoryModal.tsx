import { useMemo, useState } from "react";
import ExercisePicker from "@/components/exercises/ExercisePicker";
import type { Exercise } from "@/types/exercise";
import type { Workout, WorkoutSet } from "@/types/workout";

type Props = {
  isOpen: boolean;
  workouts: Workout[];
  exercises: Exercise[];
  onClose: () => void;
};

type ProgressEntry = {
  workoutId: string;
  workoutName: string;
  date: string;
  setCount: number;
  bestReps?: number;
  bestWeight?: number;
  bestVolume: number;
  totalVolume: number;
  sets: WorkoutSet[];
};

function setReps(set: WorkoutSet) {
  return set.actualReps ?? set.reps ?? set.targetReps;
}

function setWeight(set: WorkoutSet) {
  return set.actualWeight ?? set.weight ?? set.targetWeight;
}

function setVolume(set: WorkoutSet) {
  return (setReps(set) ?? 0) * (setWeight(set) ?? 0);
}

function formatValue(value: number | undefined, fallback = "--") {
  return value === undefined ? fallback : String(value);
}

export default function ProgressHistoryModal({
  isOpen,
  workouts,
  exercises,
  onClose,
}: Props) {
  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId),
    [exercises, selectedExerciseId]
  );

  const entries = useMemo<ProgressEntry[]>(() => {
    if (!selectedExerciseId) return [];

    return workouts
      .flatMap((workout) =>
        workout.exercises
          .filter(
            (workoutExercise) =>
              workoutExercise.exerciseId === selectedExerciseId
          )
          .map((workoutExercise) => {
            const bestSet = [...workoutExercise.sets].sort(
              (a, b) => setVolume(b) - setVolume(a)
            )[0];

            return {
              workoutId: workout.id,
              workoutName: workout.name || "Unnamed Workout",
              date: workout.date,
              setCount: workoutExercise.sets.length,
              bestReps: bestSet ? setReps(bestSet) : undefined,
              bestWeight: bestSet ? setWeight(bestSet) : undefined,
              bestVolume: bestSet ? setVolume(bestSet) : 0,
              totalVolume: workoutExercise.sets.reduce(
                (total, set) => total + setVolume(set),
                0
              ),
              sets: workoutExercise.sets,
            };
          })
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedExerciseId, workouts]);

  const bestEntry = entries.reduce<ProgressEntry | null>((best, entry) => {
    if (!best) return entry;
    return entry.bestVolume > best.bestVolume ? entry : best;
  }, null);

  const totalSets = entries.reduce((total, entry) => total + entry.setCount, 0);
  const totalVolume = entries.reduce(
    (total, entry) => total + entry.totalVolume,
    0
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--wide">
        <h2 style={{ marginTop: 0 }}>Exercise Progress</h2>

        <ExercisePicker
          exercises={exercises}
          selectedExerciseId={selectedExerciseId}
          onSelectExercise={setSelectedExerciseId}
          includeArchived
        />

        {selectedExercise ? (
          <div className="progress-summary">
            <div>
              <span>Sessions</span>
              <strong>{entries.length}</strong>
            </div>
            <div>
              <span>Total Sets</span>
              <strong>{totalSets}</strong>
            </div>
            <div>
              <span>Total Volume</span>
              <strong>{totalVolume}</strong>
            </div>
            <div>
              <span>Best Set</span>
              <strong>
                {bestEntry
                  ? `${formatValue(bestEntry.bestReps)} reps x ${formatValue(
                      bestEntry.bestWeight
                    )} lb`
                  : "--"}
              </strong>
            </div>
          </div>
        ) : null}

        <div className="progress-history-list">
          {!selectedExercise ? (
            <p style={{ color: "#6b7280" }}>Select an exercise.</p>
          ) : entries.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No history for this exercise.</p>
          ) : (
            entries.map((entry) => (
              <div key={`${entry.workoutId}-${entry.date}`} className="progress-entry">
                <div className="progress-entry-header">
                  <strong>{entry.workoutName}</strong>
                  <span>{entry.date}</span>
                </div>

                <div className="progress-set-grid">
                  {entry.sets.map((set, index) => (
                    <span key={set.id}>
                      Set {index + 1}: {formatValue(setReps(set))} reps x{" "}
                      {formatValue(setWeight(set))} lb
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
