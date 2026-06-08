import { useMemo, useState } from "react";
import type { Workout } from "@/types/workout";
import type { Exercise } from "@/types/exercise";

type NoteType = "workout" | "exercise" | "set";
type ActiveFilter = "all" | NoteType;

type Props = {
  isOpen: boolean;
  workouts: Workout[];
  exercises: Exercise[];
  onClose: () => void;
};

type NoteItem = {
  id: string;
  type: NoteType;
  date: string;
  workoutName: string;
  exerciseName?: string;
  setNumber?: number;
  note: string;
};

export default function NotesReviewModal({
  isOpen,
  workouts,
  exercises,
  onClose,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const notes = useMemo<NoteItem[]>(() => {
    const items: NoteItem[] = [];

    workouts.forEach((workout) => {
      if (workout.notes?.trim()) {
        items.push({
          id: `${workout.id}-workout-note`,
          type: "workout",
          date: workout.date,
          workoutName: workout.name || "Unnamed Workout",
          note: workout.notes,
        });
      }

      workout.exercises.forEach((workoutExercise) => {
        const exercise = exerciseMap.get(workoutExercise.exerciseId);

        if (workoutExercise.notes?.trim()) {
          items.push({
            id: `${workoutExercise.id}-exercise-note`,
            type: "exercise",
            date: workout.date,
            workoutName: workout.name || "Unnamed Workout",
            exerciseName: exercise?.name || "Unknown Exercise",
            note: workoutExercise.notes,
          });
        }

        workoutExercise.sets.forEach((set, setIndex) => {
          if (set.notes?.trim()) {
            items.push({
              id: `${set.id}-set-note`,
              type: "set",
              date: workout.date,
              workoutName: workout.name || "Unnamed Workout",
              exerciseName: exercise?.name || "Unknown Exercise",
              setNumber: setIndex + 1,
              note: set.notes,
            });
          }
        });
      });
    });

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [workouts, exerciseMap]);

  const filteredNotes = notes.filter((note) => {
    if (activeFilter === "all") return true;
    return note.type === activeFilter;
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
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
          maxWidth: 760,
          maxHeight: "85vh",
          background: "#ffffff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Notes Review</h2>

          <button
            onClick={onClose}
            style={{
              border: "1px solid #d1d5db",
              background: "#fff",
              borderRadius: 8,
              padding: "8px 10px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {(["all", "workout", "exercise", "set"] as ActiveFilter[]).map(
            (filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border:
                    activeFilter === filter
                      ? "2px solid #2563eb"
                      : "1px solid #d1d5db",
                  background: activeFilter === filter ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {filter}
              </button>
            )
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {["Most Recent", "History", "Muscle", "Machine / Exercise"].map((tab) => (
            <button
              key={tab}
              disabled={tab !== "Most Recent"}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: tab === "Most Recent" ? "#111827" : "#f9fafb",
                color: tab === "Most Recent" ? "#fff" : "#9ca3af",
                cursor: tab === "Most Recent" ? "pointer" : "not-allowed",
                fontWeight: 600,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          style={{
            overflowY: "auto",
            display: "grid",
            gap: 12,
            paddingRight: 4,
          }}
        >
          {filteredNotes.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No notes found.</p>
          ) : (
            filteredNotes.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: "#f9fafb",
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                  {item.date} · {item.type.toUpperCase()}
                </div>

                <strong>{item.workoutName}</strong>

                {item.exerciseName ? (
                  <div style={{ marginTop: 4, color: "#374151" }}>
                    {item.exerciseName}
                    {item.setNumber ? ` · Set ${item.setNumber}` : ""}
                  </div>
                ) : null}

                <p style={{ marginBottom: 0, lineHeight: 1.5 }}>{item.note}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}