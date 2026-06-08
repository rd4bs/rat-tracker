import { useMemo, useState } from "react";
import { db } from "@/db/db";
import type { Exercise } from "@/types/exercise";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/types/workout";

type Props = {
  workout: Workout;
  exercises: Exercise[];
  onBack: () => void;
  onSaved: () => Promise<void> | void;
};

export default function WorkoutTrackerPage({
  workout,
  exercises,
  onBack,
  onSaved,
}: Props) {
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [localWorkout, setLocalWorkout] = useState<Workout>(workout);

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const addExerciseById = (exerciseId: string) => {
    const exercise = exerciseMap.get(exerciseId);
    if (!exercise) return;

    const newExercise: WorkoutExercise = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      sets: [],
      notes: "",
    };

    setLocalWorkout((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }));

    setSelectedExerciseId("");
  };

  const removeExercise = (exerciseIndex: number) => {
    setLocalWorkout((prev) => {
      const nextExercises = [...prev.exercises];
      nextExercises.splice(exerciseIndex, 1);

      return {
        ...prev,
        exercises: nextExercises,
      };
    });
  };

  const addSet = (exerciseIndex: number) => {
    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      reps: 0,
      weight: 0,
      notes: "",
    };

    setLocalWorkout((prev) => {
      const nextExercises = [...prev.exercises];
      const targetExercise = nextExercises[exerciseIndex];

      nextExercises[exerciseIndex] = {
        ...targetExercise,
        sets: [...targetExercise.sets, newSet],
      };

      return {
        ...prev,
        exercises: nextExercises,
      };
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setLocalWorkout((prev) => {
      const nextExercises = [...prev.exercises];
      const targetExercise = nextExercises[exerciseIndex];
      const nextSets = [...targetExercise.sets];

      nextSets.splice(setIndex, 1);

      nextExercises[exerciseIndex] = {
        ...targetExercise,
        sets: nextSets,
      };

      return {
        ...prev,
        exercises: nextExercises,
      };
    });
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: string | number | boolean
  ) => {
    setLocalWorkout((prev) => {
      const nextExercises = [...prev.exercises];
      const targetExercise = nextExercises[exerciseIndex];
      const nextSets = [...targetExercise.sets];

      nextSets[setIndex] = {
        ...nextSets[setIndex],
        [field]: value,
      };

      nextExercises[exerciseIndex] = {
        ...targetExercise,
        sets: nextSets,
      };

      return {
        ...prev,
        exercises: nextExercises,
      };
    });
  };

  const updateExerciseNote = (exerciseIndex: number, notes: string) => {
    setLocalWorkout((prev) => {
      const nextExercises = [...prev.exercises];
      const targetExercise = nextExercises[exerciseIndex];

      nextExercises[exerciseIndex] = {
        ...targetExercise,
        notes,
      };

      return {
        ...prev,
        exercises: nextExercises,
      };
    });
  };

  const updateWorkoutNotes = (notes: string) => {
    setLocalWorkout((prev) => ({
      ...prev,
      notes,
    }));
  };
  const saveProgress = async () => {
    await db.workouts.put({
      ...localWorkout,
      status: "in_progress",
    });

    await onSaved();
    onBack();
  };

  const completeWorkout = async () => {
    await db.workouts.put({
      ...localWorkout,
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    await onSaved();
    onBack();
  };

  return (
    <div className="app-page">
      <div className="app-container app-container--tracker">
        <div className="tracker-header">
          <div>
            <h1 style={{ margin: 0 }}>
              {localWorkout.name || "Workout Tracker"}
            </h1>
            <p style={{ marginTop: 8, color: "#6b7280" }}>
              {localWorkout.date}
            </p>
          </div>

          <button
            onClick={onBack}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>

        <section className="tracker-card">
          <section className="tracker-card">
            <h2 style={{ marginTop: 0 }}>Workout Notes</h2>

            <textarea
              value={localWorkout.notes ?? ""}
              onChange={(e) => updateWorkoutNotes(e.target.value)}
              rows={4}
              placeholder="Overall notes for this workout..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </section>

          <h2 style={{ marginTop: 0 }}>Add Exercise</h2>

          <div className="tracker-add-exercise-row">
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              style={{
                minWidth: 260,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#fff",
              }}
            >
              <option value="">Select Exercise</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (!selectedExerciseId) return;
                addExerciseById(selectedExerciseId);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Add Exercise
            </button>
          </div>
        </section>

        <section className="tracker-exercise-list">
          {localWorkout.exercises.length === 0 ? (
            <div className="tracker-card">
              <p style={{ margin: 0, color: "#6b7280" }}>
                No exercises added yet.
              </p>
            </div>
          ) : (
            localWorkout.exercises.map((workoutExercise, exerciseIndex) => {
              const exercise = exerciseMap.get(workoutExercise.exerciseId);
              if (!exercise) return null;

              return (
                <div
                  key={workoutExercise.id}
                  className="tracker-card tracker-exercise-card"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>{exercise.name}</h3>

                    <button
                      onClick={() => removeExercise(exerciseIndex)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "#dc2626",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  <p style={{ color: "#6b7280", lineHeight: 1.5 }}>
                    <strong>Primary:</strong>{" "}
                    {exercise.muscles.primary.join(", ")}
                    {" | "}
                    <strong>Secondary:</strong>{" "}
                    {(exercise.muscles.secondary ?? []).join(", ")}
                    {" | "}
                    <strong>Stabilizer:</strong>{" "}
                    {(exercise.muscles.stabilizer ?? []).join(", ")}
                  </p>

                  <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>Exercise Notes</span>
                    <textarea
                      value={workoutExercise.notes ?? ""}
                      onChange={(e) => updateExerciseNote(exerciseIndex, e.target.value)}
                      rows={2}
                      placeholder="Notes for this exercise..."
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        resize: "vertical",
                      }}
                    />
                  </label>

                  <div className="tracker-set-list">
                    {workoutExercise.sets.map((set, setIndex) => (
                      <div key={set.id} className="tracker-set-row">
                        <span className="tracker-set-number">
                          Set {setIndex + 1}
                        </span>

                        <label className="tracker-set-field">
                          Reps{" "}
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(
                                exerciseIndex,
                                setIndex,
                                "reps",
                                Number(e.target.value)
                              )
                            }
                            className="tracker-set-input tracker-set-input--reps"
                          />
                        </label>

                        <label className="tracker-set-field">
                          Weight{" "}
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) =>
                              updateSet(
                                exerciseIndex,
                                setIndex,
                                "weight",
                                Number(e.target.value)
                              )
                            }
                            className="tracker-set-input tracker-set-input--weight"
                          />
                        </label>

                        <label className="tracker-set-field tracker-set-field--notes">
                          Notes{" "}
                          <input
                            type="text"
                            value={set.notes ?? ""}
                            onChange={(e) =>
                              updateSet(exerciseIndex, setIndex, "notes", e.target.value)
                            }
                            placeholder="Set note..."
                            className="tracker-set-input tracker-set-input--notes"
                          />
                        </label>

                        <button
                          className="tracker-set-remove"
                          onClick={() => removeSet(exerciseIndex, setIndex)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "#ef4444",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addSet(exerciseIndex)}
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add Set
                  </button>
                </div>
              );
            })
          )}
        </section>

        <div className="tracker-actions">
          <button
            onClick={saveProgress}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Save Progress
          </button>

          <button
            onClick={completeWorkout}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Complete Workout
          </button>
        </div>
      </div>
    </div>
  );
}
