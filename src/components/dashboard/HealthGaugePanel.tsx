import { useEffect, useState } from "react";
import type { DailyHealthMetrics } from "@/types/health";

type Props = {
  selectedDate: string;
  metrics: DailyHealthMetrics | null;
  onSave: (metrics: DailyHealthMetrics) => Promise<void> | void;
};

type Draft = {
  sleepHours: string;
  stressLevel: string;
  travelMinutes: string;
  cardioMinutes: string;
  calories: string;
  notes: string;
};

function toInputValue(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

function toOptionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

export default function HealthGaugesPanel({
  selectedDate,
  metrics,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<Draft>({
    sleepHours: "",
    stressLevel: "",
    travelMinutes: "",
    cardioMinutes: "",
    calories: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setDraft({
      sleepHours: toInputValue(metrics?.sleepHours),
      stressLevel: toInputValue(metrics?.stressLevel),
      travelMinutes: toInputValue(metrics?.travelMinutes),
      cardioMinutes: toInputValue(metrics?.cardioMinutes),
      calories: toInputValue(metrics?.calories),
      notes: metrics?.notes ?? "",
    });
    setSaveError("");
    setIsSaving(false);
  }, [metrics, selectedDate]);

  const updateDraft = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError("");

    try {
      await onSave({
        date: selectedDate,
        sleepHours: toOptionalNumber(draft.sleepHours),
        stressLevel: toOptionalNumber(draft.stressLevel),
        travelMinutes: toOptionalNumber(draft.travelMinutes),
        cardioMinutes: toOptionalNumber(draft.cardioMinutes),
        calories: toOptionalNumber(draft.calories),
        notes: draft.notes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save health metrics:", error);
      setSaveError("Health gauges save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Health Gauges</h2>
      <p style={{ color: "#6b7280" }}>{selectedDate}</p>

      <div className="health-gauge-grid">
        <label>
          Sleep
          <input
            type="number"
            min="0"
            step="0.25"
            value={draft.sleepHours}
            onChange={(event) => updateDraft("sleepHours", event.target.value)}
            placeholder="Hours"
          />
        </label>

        <label>
          Stress
          <input
            type="number"
            min="0"
            max="10"
            value={draft.stressLevel}
            onChange={(event) => updateDraft("stressLevel", event.target.value)}
            placeholder="0-10"
          />
        </label>

        <label>
          Travel
          <input
            type="number"
            min="0"
            value={draft.travelMinutes}
            onChange={(event) =>
              updateDraft("travelMinutes", event.target.value)
            }
            placeholder="Minutes"
          />
        </label>

        <label>
          Cardio
          <input
            type="number"
            min="0"
            value={draft.cardioMinutes}
            onChange={(event) =>
              updateDraft("cardioMinutes", event.target.value)
            }
            placeholder="Minutes"
          />
        </label>

        <label>
          Calories
          <input
            type="number"
            min="0"
            value={draft.calories}
            onChange={(event) => updateDraft("calories", event.target.value)}
            placeholder="kcal"
          />
        </label>
      </div>

      <label className="health-notes-field">
        Notes
        <textarea
          value={draft.notes}
          onChange={(event) => updateDraft("notes", event.target.value)}
          rows={3}
        />
      </label>

      {saveError ? (
        <p className="app-alert app-alert--error" role="alert">
          {saveError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="health-save-button"
      >
        {isSaving ? "Saving..." : "Save Health Gauges"}
      </button>
    </div>
  );
}
