import { useEffect, useState } from "react";
import type { Exercise } from "@/types/exercise";
import type { Workout, WorkoutExercise } from "@/types/workout";

type Props = {
  isOpen: boolean;
  workout: Workout | null;
  exercises: Exercise[];
  onClose: () => void;
  onSave: (updatedWorkout: Workout) => Promise<void> | void;
  onDelete: (workoutId: string) => Promise<void> | void;
};

const workoutTypes = ["Upper Body", "Lower Body", "Cardio", "Core", "Sauna"];

export default function EditTodayPlanModal({
  isOpen,
  workout,
  exercises = [],
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [plannedExercises, setPlannedExercises] = useState<WorkoutExercise[]>([]);

  useEffect(() => {
    if (!workout) {
      setName("");
      setNotes("");
      setSelectedExerciseId("");
      setPlannedExercises([]);
      return;
    }

    setName(workout.name ?? "");
    setNotes(workout.notes ?? "");
    setSelectedExerciseId("");
    setPlannedExercises(workout.exercises ?? []);
  }, [workout]);

  if (!isOpen || !workout) return null;

  const handleAddExercise = () => {
    if (!selectedExerciseId) return;

    const alreadyAdded = plannedExercises.some(
      (item) => item.exerciseId === selectedExerciseId
    );

    if (alreadyAdded) {
      setSelectedExerciseId("");
      return;
    }

    const newWorkoutExercise: WorkoutExercise = {
      id: crypto.randomUUID(),
      exerciseId: selectedExerciseId,
      sets: [],
    };

    setPlannedExercises((current) => [...current, newWorkoutExercise]);
    setSelectedExerciseId("");
  };

  const handleRemoveExercise = (workoutExerciseId: string) => {
    setPlannedExercises((current) =>
      current.filter((item) => item.id !== workoutExerciseId)
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    await onSave({
      ...workout,
      name: name.trim(),
      notes: notes.trim() || undefined,
      exercises: plannedExercises,
    });

    onClose();
  };

  const handleDelete = async () => {
    await onDelete(workout.id);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Edit Today&apos;s Plan</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Workout Type</span>

            <select
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#fff",
              }}
            >
              <option value="">Select Workout Type</option>

              {workoutTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Planned Exercises</span>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 240,
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
                type="button"
                onClick={handleAddExercise}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add Exercise
              </button>
            </div>

            {plannedExercises.length === 0 ? (
              <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                No exercises planned yet.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                {plannedExercises.map((workoutExercise) => {
                  const exercise = exercises.find(
                    (item) => item.id === workoutExercise.exerciseId
                  );

                  return (
                    <div
                      key={workoutExercise.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        background: "#f9fafb",
                      }}
                    >
                      <span>{exercise?.name ?? "Unknown Exercise"}</span>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveExercise(workoutExercise.id)
                        }
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: "#dc2626",
                          color: "#ffffff",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Notes</span>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                resize: "vertical",
              }}
            />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleDelete}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#dc2626",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Delete Workout
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}