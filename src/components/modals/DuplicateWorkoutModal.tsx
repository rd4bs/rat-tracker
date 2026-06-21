import { useEffect, useState } from "react";
import type { Workout } from "@/types/workout";

type Props = {
  isOpen: boolean;
  workout: Workout | null;
  initialDate: string;
  onClose: () => void;
  onDuplicate: (
    workout: Workout,
    date: string,
    name: string,
    includeActualResults: boolean
  ) => Promise<void> | void;
};

export default function DuplicateWorkoutModal({
  isOpen,
  workout,
  initialDate,
  onClose,
  onDuplicate,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [name, setName] = useState("");
  const [includeActualResults, setIncludeActualResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setDate(initialDate);
    setName(workout?.name ?? "");
    setIncludeActualResults(false);
    setIsSaving(false);
    setError("");
  }, [initialDate, isOpen, workout]);

  if (!isOpen || !workout) return null;

  const handleDuplicate = async () => {
    if (!date) {
      setError("Select a date first.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onDuplicate(workout, date, name, includeActualResults);
      onClose();
    } catch (duplicateError) {
      console.error("Failed to duplicate workout:", duplicateError);
      setError("Workout duplicate failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ marginTop: 0 }}>Duplicate Workout</h2>

        <div className="duplicate-form">
          <label>
            Planned Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label>
            Workout Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="duplicate-checkbox">
            <input
              type="checkbox"
              checked={includeActualResults}
              onChange={(event) =>
                setIncludeActualResults(event.target.checked)
              }
            />
            Include actual results and set notes
          </label>
        </div>

        <p style={{ color: "#6b7280", lineHeight: 1.5 }}>
          By default, the duplicated workout keeps planned targets and removes
          actual reps, actual weight, completion state, and set notes.
        </p>

        {error ? (
          <p className="app-alert app-alert--error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDuplicate}
            disabled={isSaving}
          >
            {isSaving ? "Duplicating..." : "Duplicate"}
          </button>
        </div>
      </div>
    </div>
  );
}
