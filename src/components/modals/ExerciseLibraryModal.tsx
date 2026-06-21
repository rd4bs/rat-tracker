import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { MUSCLES } from "@/data/muscles";
import type { Exercise } from "@/types/exercise";
import type { Muscle } from "@/types/muscle";
import { createId } from "@/utils/id";

type Props = {
  isOpen: boolean;
  exercises: Exercise[];
  onClose: () => void;
  onSaveExercise: (exercise: Exercise) => Promise<void> | void;
  onArchiveExercise: (exerciseId: string) => Promise<void> | void;
  onRestoreExercise: (exerciseId: string) => Promise<void> | void;
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTags(value: string[] | undefined) {
  return value?.join(", ") ?? "";
}

function selectedMuscles(event: ChangeEvent<HTMLSelectElement>): Muscle[] {
  return Array.from(event.currentTarget.selectedOptions).map(
    (option) => option.value as Muscle
  );
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export default function ExerciseLibraryModal({
  isOpen,
  exercises,
  onClose,
  onSaveExercise,
  onArchiveExercise,
  onRestoreExercise,
}: Props) {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [name, setName] = useState("");
  const [movement, setMovement] = useState("");
  const [equipment, setEquipment] = useState("");
  const [primaryMuscles, setPrimaryMuscles] = useState<Muscle[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<Muscle[]>([]);
  const [stabilizerMuscles, setStabilizerMuscles] = useState<Muscle[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const customExercises = useMemo(() => {
    const normalizedSearch = normalizeName(search);

    return exercises
      .filter((exercise) => exercise.isCustom)
      .filter((exercise) => showArchived || !exercise.isArchived)
      .filter((exercise) =>
        normalizedSearch
          ? normalizeName(exercise.name).includes(normalizedSearch)
          : true
      )
      .sort((a, b) => {
        if (!!a.isArchived !== !!b.isArchived) {
          return a.isArchived ? 1 : -1;
        }

        return a.name.localeCompare(b.name);
      });
  }, [exercises, search, showArchived]);

  useEffect(() => {
    if (!isOpen) return;

    setEditingExercise(null);
    setName("");
    setMovement("");
    setEquipment("");
    setPrimaryMuscles([]);
    setSecondaryMuscles([]);
    setStabilizerMuscles([]);
    setSearch("");
    setShowArchived(false);
    setIsSaving(false);
    setFormError("");
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingExercise(null);
    setName("");
    setMovement("");
    setEquipment("");
    setPrimaryMuscles([]);
    setSecondaryMuscles([]);
    setStabilizerMuscles([]);
    setFormError("");
  };

  const startEditing = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setName(exercise.name);
    setMovement(formatTags(exercise.movement));
    setEquipment(formatTags(exercise.equipment));
    setPrimaryMuscles(exercise.muscles.primary);
    setSecondaryMuscles(exercise.muscles.secondary ?? []);
    setStabilizerMuscles(exercise.muscles.stabilizer ?? []);
    setFormError("");
  };

  const hasDuplicateName = () => {
    const nextName = normalizeName(name);

    return exercises.some(
      (exercise) =>
        !exercise.isArchived &&
        exercise.id !== editingExercise?.id &&
        normalizeName(exercise.name) === nextName
    );
  };

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError("Exercise name is required.");
      return;
    }

    if (primaryMuscles.length === 0) {
      setFormError("Select at least one primary muscle.");
      return;
    }

    if (hasDuplicateName()) {
      setFormError("An active exercise with this name already exists.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const exercise: Exercise = {
      id: editingExercise?.id ?? `custom_${createId()}`,
      name: trimmedName,
      movement: parseTags(movement),
      equipment: parseTags(equipment),
      muscles: {
        primary: primaryMuscles,
        secondary: secondaryMuscles,
        stabilizer: stabilizerMuscles,
      },
      isCustom: true,
      isArchived: editingExercise?.isArchived,
      archivedAt: editingExercise?.archivedAt,
    };

    try {
      await onSaveExercise(exercise);
      resetForm();
    } catch (error) {
      console.error("Failed to save custom exercise:", error);
      setFormError("Exercise save failed. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (exerciseId: string) => {
    setFormError("");

    try {
      await onArchiveExercise(exerciseId);

      if (editingExercise?.id === exerciseId) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to archive custom exercise:", error);
      setFormError("Exercise archive failed. Try again.");
    }
  };

  const handleRestore = async (exerciseId: string) => {
    setFormError("");

    try {
      await onRestoreExercise(exerciseId);
    } catch (error) {
      console.error("Failed to restore custom exercise:", error);
      setFormError("Exercise restore failed. Check for a duplicate name.");
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content modal-content--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Exercise library"
      >
        <h2 style={{ marginTop: 0 }}>Exercise Library</h2>

        <div className="exercise-library-layout">
          <section className="exercise-library-form">
            <h3 style={{ marginTop: 0 }}>
              {editingExercise ? "Edit Custom Exercise" : "New Custom Exercise"}
            </h3>

            <label className="exercise-field">
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Exercise name"
              />
            </label>

            <label className="exercise-field">
              Movement
              <input
                type="text"
                value={movement}
                onChange={(event) => setMovement(event.target.value)}
                placeholder="push, pull, hinge"
              />
            </label>

            <label className="exercise-field">
              Equipment
              <input
                type="text"
                value={equipment}
                onChange={(event) => setEquipment(event.target.value)}
                placeholder="dumbbell, cable, machine"
              />
            </label>

            <label className="exercise-field">
              Primary Muscles
              <select
                multiple
                value={primaryMuscles}
                onChange={(event) => setPrimaryMuscles(selectedMuscles(event))}
                className="exercise-multi-select"
              >
                {MUSCLES.map((muscle) => (
                  <option key={muscle} value={muscle}>
                    {muscle}
                  </option>
                ))}
              </select>
            </label>

            <label className="exercise-field">
              Secondary Muscles
              <select
                multiple
                value={secondaryMuscles}
                onChange={(event) =>
                  setSecondaryMuscles(selectedMuscles(event))
                }
                className="exercise-multi-select"
              >
                {MUSCLES.map((muscle) => (
                  <option key={muscle} value={muscle}>
                    {muscle}
                  </option>
                ))}
              </select>
            </label>

            <label className="exercise-field">
              Stabilizer Muscles
              <select
                multiple
                value={stabilizerMuscles}
                onChange={(event) =>
                  setStabilizerMuscles(selectedMuscles(event))
                }
                className="exercise-multi-select"
              >
                {MUSCLES.map((muscle) => (
                  <option key={muscle} value={muscle}>
                    {muscle}
                  </option>
                ))}
              </select>
            </label>

            {formError ? (
              <p className="app-alert app-alert--error" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="exercise-library-actions">
              <button type="button" onClick={resetForm}>
                Clear
              </button>
              <button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Exercise"}
              </button>
            </div>
          </section>

          <section className="exercise-library-list-panel">
            <div className="exercise-library-toolbar">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search custom exercises"
              />

              <label className="exercise-library-toggle">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(event) => setShowArchived(event.target.checked)}
                />
                Show archived
              </label>
            </div>

            {customExercises.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No custom exercises yet.</p>
            ) : (
              <div className="exercise-library-list">
                {customExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className={`exercise-library-item ${
                      exercise.isArchived ? "is-archived" : ""
                    }`}
                  >
                    <div>
                      <strong>{exercise.name}</strong>
                      {exercise.isArchived ? (
                        <span className="exercise-archive-label">Archived</span>
                      ) : null}
                      <p>
                        {exercise.muscles.primary.join(", ")}
                      </p>
                    </div>

                    <div className="exercise-library-item-actions">
                      <button
                        type="button"
                        onClick={() => startEditing(exercise)}
                      >
                        Edit
                      </button>

                      {exercise.isArchived ? (
                        <button
                          type="button"
                          onClick={() => handleRestore(exercise.id)}
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleArchive(exercise.id)}
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
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
