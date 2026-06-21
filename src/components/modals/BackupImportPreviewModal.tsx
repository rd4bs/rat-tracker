import { useState } from "react";
import type {
  BackupImportMode,
  BackupImportPreview,
} from "@/db/backup";

type Props = {
  isOpen: boolean;
  preview: BackupImportPreview | null;
  onClose: () => void;
  onConfirm: (mode: BackupImportMode) => Promise<void> | void;
};

function totalConflicts(preview: BackupImportPreview) {
  return (
    preview.conflicts.exerciseCount +
    preview.conflicts.workoutCount +
    preview.conflicts.healthMetricCount +
    preview.conflicts.templateCount
  );
}

export default function BackupImportPreviewModal({
  isOpen,
  preview,
  onClose,
  onConfirm,
}: Props) {
  const [mode, setMode] = useState<BackupImportMode>("overwrite");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !preview) return null;

  const handleConfirm = async () => {
    setIsImporting(true);
    setError("");

    try {
      await onConfirm(mode);
      onClose();
    } catch (confirmError) {
      console.error("Failed to import backup:", confirmError);
      setError("Backup import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="Import backup preview"
      >
        <h2 style={{ marginTop: 0 }}>Import Backup</h2>

        <p style={{ color: "#6b7280", lineHeight: 1.5 }}>
          Backup version {preview.version} exported {preview.exportedAt}.
        </p>

        <div className="backup-preview-grid">
          <span>Exercises</span>
          <strong>{preview.counts.exerciseCount}</strong>
          <small>{preview.conflicts.exerciseCount} matching existing</small>

          <span>Workouts</span>
          <strong>{preview.counts.workoutCount}</strong>
          <small>{preview.conflicts.workoutCount} matching existing</small>

          <span>Health Entries</span>
          <strong>{preview.counts.healthMetricCount}</strong>
          <small>{preview.conflicts.healthMetricCount} matching existing</small>

          <span>Templates</span>
          <strong>{preview.counts.templateCount}</strong>
          <small>{preview.conflicts.templateCount} matching existing</small>
        </div>

        <fieldset className="backup-import-options">
          <legend>Conflict Handling</legend>

          <label>
            <input
              type="radio"
              name="backup-import-mode"
              value="overwrite"
              checked={mode === "overwrite"}
              onChange={() => setMode("overwrite")}
            />
            Overwrite matching local records
          </label>

          <label>
            <input
              type="radio"
              name="backup-import-mode"
              value="skipExisting"
              checked={mode === "skipExisting"}
              onChange={() => setMode("skipExisting")}
            />
            Only add records that do not already exist
          </label>
        </fieldset>

        {totalConflicts(preview) > 0 ? (
          <p className="app-alert app-alert--info" role="status">
            This backup has matching local records. Choose how those matches
            should be handled before importing.
          </p>
        ) : null}

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
            onClick={handleConfirm}
            disabled={isImporting}
          >
            {isImporting ? "Importing..." : "Import Backup"}
          </button>
        </div>
      </div>
    </div>
  );
}
