import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type TouchEvent,
} from "react";
import type { Exercise } from "@/types/exercise";
import type { WorkoutSet } from "@/types/workout";
import { createId } from "@/utils/id";
import ExercisePicker from "@/components/exercises/ExercisePicker";

type PlannedExerciseDraft = {
  exerciseId: string;
  sets: WorkoutSet[];
};

type Props = {
  isOpen: boolean;
  initialDate: string;
  exercises: Exercise[];
  onClose: () => void;
  onSave: (values: {
    date: string;
    name: string;
    notes: string;
    exercises: PlannedExerciseDraft[];
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [plannedExercises, setPlannedExercises] = useState<
    PlannedExerciseDraft[]
  >([]);
  const workoutTypeRef = useRef<HTMLSelectElement>(null);
  const lastTouchActionAtRef = useRef(0);

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
    setIsSaving(false);
    setSaveError("");
    setPlannedExercises([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddExercise = () => {
    const exerciseId = selectedExerciseId;
    if (!exerciseId) return;

    const exercise = exercises.find((item) => item.id === exerciseId);
    if (!exercise || exercise.isArchived) return;

    setSaveError("");

    setPlannedExercises((currentExercises) => {
      if (
        currentExercises.some((item) => item.exerciseId === exerciseId)
      ) {
        return currentExercises;
      }

      return [
        ...currentExercises,
        {
          exerciseId,
          sets: [
            {
              id: createId(),
            },
          ],
        },
      ];
    });

    setSelectedExerciseId("");
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setPlannedExercises((currentExercises) =>
      currentExercises.filter((item) => item.exerciseId !== exerciseId)
    );
  };

  const handleAddPlannedSet = (exerciseId: string) => {
    const newSet: WorkoutSet = {
      id: createId(),
    };

    setSaveError("");

    setPlannedExercises((currentExercises) =>
      currentExercises.map((item) =>
        item.exerciseId === exerciseId
          ? { ...item, sets: [...item.sets, newSet] }
          : item
      )
    );
  };

  const handleRemovePlannedSet = (exerciseId: string, setId: string) => {
    setPlannedExercises((currentExercises) =>
      currentExercises.map((item) =>
        item.exerciseId === exerciseId
          ? {
              ...item,
              sets: item.sets.filter((set) => set.id !== setId),
            }
          : item
      )
    );
  };

  const handleUpdatePlannedSet = (
    exerciseId: string,
    setId: string,
    field: "targetReps" | "targetWeight",
    value: string
  ) => {
    const nextValue = value === "" ? undefined : Number(value);

    setPlannedExercises((currentExercises) =>
      currentExercises.map((item) =>
        item.exerciseId === exerciseId
          ? {
              ...item,
              sets: item.sets.map((set) =>
                set.id === setId ? { ...set, [field]: nextValue } : set
              ),
            }
          : item
      )
    );
  };

  const handleSave = async () => {
    if (isSaving) return;

    const workoutName = name.trim() || workoutTypeRef.current?.value || "";

    if (!workoutName) {
      setSaveError("Select a workout type before saving.");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      await onSave({
        date,
        name: workoutName,
        notes: notes.trim(),
        exercises: plannedExercises,
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to save workout plan:", error);
      setSaveError("Workout save failed. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTouchPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    action: () => void | Promise<void>
  ) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;

    event.preventDefault();
    const now = Date.now();
    if (now - lastTouchActionAtRef.current < 350) return;

    lastTouchActionAtRef.current = now;
    void action();
  };

  const handleTouchStart = (
    event: TouchEvent<HTMLButtonElement>,
    action: () => void | Promise<void>
  ) => {
    event.preventDefault();

    const now = Date.now();
    if (now - lastTouchActionAtRef.current < 350) return;

    lastTouchActionAtRef.current = now;
    void action();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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
              ref={workoutTypeRef}
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

            <div className="exercise-picker-add-row">
              <ExercisePicker
                exercises={exercises}
                selectedExerciseId={selectedExerciseId}
                onSelectExercise={setSelectedExerciseId}
                label="Planned Exercise"
              />

              <button
                type="button"
                onClick={handleAddExercise}
                onPointerDown={(event) =>
                  handleTouchPointerDown(event, handleAddExercise)
                }
                onTouchStart={(event) =>
                  handleTouchStart(event, handleAddExercise)
                }
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
                {plannedExercises.map((plannedExercise) => {
                  const exercise = exercises.find(
                    (item) => item.id === plannedExercise.exerciseId
                  );

                  return (
                    <div
                      key={plannedExercise.exerciseId}
                      style={{
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        background: "#f9fafb",
                      }}
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
                        <strong>{exercise?.name ?? "Unknown Exercise"}</strong>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveExercise(plannedExercise.exerciseId)
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

                      {plannedExercise.sets.length === 0 ? (
                        <p style={{ margin: "10px 0 0", color: "#6b7280" }}>
                          No planned sets yet.
                        </p>
                      ) : (
                        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                          {plannedExercise.sets.map((set, setIndex) => (
                            <div
                              key={set.id}
                              className="planned-set-row"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                                padding: 10,
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                background: "#ffffff",
                              }}
                            >
                              <strong style={{ minWidth: 52 }}>
                                Set {setIndex + 1}
                              </strong>

                              <label className="planned-set-field">
                                Target Reps{" "}
                                <input
                                  type="number"
                                  min="0"
                                  value={set.targetReps ?? ""}
                                  onChange={(e) =>
                                    handleUpdatePlannedSet(
                                      plannedExercise.exerciseId,
                                      set.id,
                                      "targetReps",
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    width: 90,
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #d1d5db",
                                  }}
                                />
                              </label>

                              <label className="planned-set-field">
                                Target Weight{" "}
                                <input
                                  type="number"
                                  min="0"
                                  value={set.targetWeight ?? ""}
                                  onChange={(e) =>
                                    handleUpdatePlannedSet(
                                      plannedExercise.exerciseId,
                                      set.id,
                                      "targetWeight",
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    width: 110,
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #d1d5db",
                                  }}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemovePlannedSet(
                                    plannedExercise.exerciseId,
                                    set.id
                                  )
                                }
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  border: "none",
                                  background: "#ef4444",
                                  color: "#ffffff",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleAddPlannedSet(plannedExercise.exerciseId)
                        }
                        onPointerDown={(event) =>
                          handleTouchPointerDown(event, () =>
                            handleAddPlannedSet(plannedExercise.exerciseId)
                          )
                        }
                        onTouchStart={(event) =>
                          handleTouchStart(event, () =>
                            handleAddPlannedSet(plannedExercise.exerciseId)
                          )
                        }
                        style={{
                          marginTop: 10,
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                          background: "#ffffff",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        + Add Planned Set
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

        {saveError ? (
          <p
            role="alert"
            style={{
              margin: "14px 0 0",
              color: "#b91c1c",
              fontWeight: 600,
            }}
          >
            {saveError}
          </p>
        ) : null}

        <div className="modal-actions">
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
            onPointerDown={(event) =>
              handleTouchPointerDown(event, handleSave)
            }
            onTouchStart={(event) => handleTouchStart(event, handleSave)}
            disabled={isSaving}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? "Saving..." : "Save Workout"}
          </button>
        </div>
      </div>
    </div>
  );
}
