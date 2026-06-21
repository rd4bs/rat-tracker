import { useRef, type ChangeEvent } from "react";

type Props = {
  onOpenCreatePlan: () => void;
  onOpenExerciseLibrary: () => void;
  onOpenHistory: () => void;
  onOpenProgress: () => void;
  onOpenTemplates: () => void;
  onExportBackup: () => Promise<void> | void;
  onImportBackup: (file: File) => Promise<void> | void;
  backupMessage?: string;
  backupError?: string;
  isBackupBusy?: boolean;
};

export default function PlannerPanel({
  onOpenCreatePlan,
  onOpenExerciseLibrary,
  onOpenHistory,
  onOpenProgress,
  onOpenTemplates,
  onExportBackup,
  onImportBackup,
  backupMessage,
  backupError,
  isBackupBusy = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (file) {
      void onImportBackup(file);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Plan / Schedule</h2>
      <p style={{ color: "#6b7280" }}>
        Create and assign workouts to a day.
      </p>

      <div className="planner-actions">
        <button
          onClick={onOpenCreatePlan}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Create / Plan Workout
        </button>

        <button
          type="button"
          onClick={onOpenExerciseLibrary}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Manage Exercises
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Workout History
        </button>

        <button
          type="button"
          onClick={onOpenProgress}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Exercise Progress
        </button>

        <button
          type="button"
          onClick={onOpenTemplates}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Templates
        </button>
      </div>

      <div className="data-safety-actions">
        <h3 style={{ margin: "0 0 4px" }}>Local Data</h3>

        <div className="data-safety-buttons">
          <button
            type="button"
            onClick={onExportBackup}
            disabled={isBackupBusy}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              fontWeight: 700,
              cursor: isBackupBusy ? "not-allowed" : "pointer",
              opacity: isBackupBusy ? 0.7 : 1,
            }}
          >
            Export Backup
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBackupBusy}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              fontWeight: 700,
              cursor: isBackupBusy ? "not-allowed" : "pointer",
              opacity: isBackupBusy ? 0.7 : 1,
            }}
          >
            Import Backup
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFileChange}
          style={{ display: "none" }}
        />

        {backupMessage ? (
          <p className="data-safety-message" role="status">
            {backupMessage}
          </p>
        ) : null}

        {backupError ? (
          <p className="data-safety-error" role="alert">
            {backupError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
