import { useEffect, useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise";
import type { WorkoutTemplate } from "@/types/workout";

type Props = {
  isOpen: boolean;
  initialDate: string;
  templates: WorkoutTemplate[];
  exercises: Exercise[];
  onClose: () => void;
  onCreateWorkout: (
    templateId: string,
    date: string,
    name: string
  ) => Promise<void> | void;
  onDeleteTemplate: (templateId: string) => Promise<void> | void;
};

function templateSetCount(template: WorkoutTemplate) {
  return template.exercises.reduce(
    (total, workoutExercise) => total + workoutExercise.sets.length,
    0
  );
}

export default function WorkoutTemplateModal({
  isOpen,
  initialDate,
  templates,
  exercises,
  onClose,
  onCreateWorkout,
  onDeleteTemplate,
}: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [date, setDate] = useState(initialDate);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ??
    templates[0] ??
    null;

  useEffect(() => {
    if (!isOpen) return;

    setDate(initialDate);
    setSelectedTemplateId(templates[0]?.id ?? "");
    setName(templates[0]?.name ?? "");
    setIsSaving(false);
    setError("");
  }, [initialDate, isOpen, templates]);

  useEffect(() => {
    if (selectedTemplate) {
      setName(selectedTemplate.name);
    }
  }, [selectedTemplate]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!selectedTemplate) {
      setError("Select a template first.");
      return;
    }

    if (!date) {
      setError("Select a date first.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onCreateWorkout(selectedTemplate.id, date, name);
      onClose();
    } catch (createError) {
      console.error("Failed to create workout from template:", createError);
      setError("Template workout creation failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    setError("");

    try {
      await onDeleteTemplate(templateId);
    } catch (deleteError) {
      console.error("Failed to delete workout template:", deleteError);
      setError("Template delete failed.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--wide">
        <h2 style={{ marginTop: 0 }}>Workout Templates</h2>

        <div className="template-layout">
          <section className="template-list">
            {templates.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No templates saved yet.</p>
            ) : (
              templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`template-list-item ${
                    selectedTemplate?.id === template.id ? "is-selected" : ""
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <strong>{template.name}</strong>
                  <span>
                    {template.exercises.length} exercises |{" "}
                    {templateSetCount(template)} sets
                  </span>
                </button>
              ))
            )}
          </section>

          <section className="template-detail">
            {selectedTemplate ? (
              <>
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

                {selectedTemplate.notes ? (
                  <p className="history-note">{selectedTemplate.notes}</p>
                ) : null}

                <div className="template-exercise-list">
                  {selectedTemplate.exercises.map((workoutExercise) => {
                    const exercise = exerciseMap.get(workoutExercise.exerciseId);

                    return (
                      <div
                        key={workoutExercise.id}
                        className="template-exercise-card"
                      >
                        <strong>{exercise?.name ?? "Unknown Exercise"}</strong>
                        <span>{workoutExercise.sets.length} planned sets</span>
                      </div>
                    );
                  })}
                </div>

                <div className="template-actions">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isSaving}
                  >
                    {isSaving ? "Creating..." : "Create Plan"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(selectedTemplate.id)}
                  >
                    Delete Template
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: "#6b7280" }}>
                Save a workout as a template to use this workflow.
              </p>
            )}
          </section>
        </div>

        {error ? (
          <p className="app-alert app-alert--error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
