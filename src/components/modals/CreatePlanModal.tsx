import { useEffect, useState } from "react";
import type { Exercise } from "@/types/exercise";

type Props = {
  isOpen: boolean;
  initialDate: string;
  exercises: Exercise[];
  onClose: () => void;
  onSave: (values: {
    date: string;
    name: string;
    notes: string;
    exercises: string[];
  }) => Promise<void> | void;
};

const workoutTypes = ["Upper Body", "Lower Body", "Cardio", "Core", "Sauna"];

export default function CreatePlanModal({
  isOpen,
  initialDate,
  exercises,
  onClose,
  onSave,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [plannedExercises, setPlannedExercises] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate);
    }
  }, [initialDate, isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setDate(initialDate);
    setName("");
    setNotes("");
    setSelectedExerciseId("");
    setPlannedExercises([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddExercise = () => {
    if (!selectedExerciseId) return;

    setPlannedExercises((currentExercises) => {
      if (currentExercises.includes(selectedExerciseId)) {
        return currentExercises;
      }

      return [...currentExercises, selectedExerciseId];
    });

    setSelectedExerciseId("");
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setPlannedExercises((currentExercises) =>
      currentExercises.filter((id) => id !== exerciseId)
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    await onSave({
      date,
      name: name.trim(),
      notes: notes.trim(),
      exercises: plannedExercises,
    });

    resetForm();
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
        <h2 style={{ marginTop: 0 }}>Create / Plan Workout</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
              }}
            />
          </label>

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
                {plannedExercises.map((exerciseId) => {
                  const exercise = exercises.find(
                    (item) => item.id === exerciseId
                  );

                  return (
                    <div
                      key={exerciseId}
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
                        onClick={() => handleRemoveExercise(exerciseId)}
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
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#fff",
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
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Save Workout
          </button>
        </div>
      </div>
    </div>
  );
}