import { useMemo, useState } from "react";
import type { Workout } from "@/types/workout";
import type { Exercise } from "@/types/exercise";
import type { WorkoutStatus } from "@/types/workout";

type Props = {
  workouts: Workout[];
  exercises: Exercise[];
  onOpenNotes: () => void;
};

type StatusFilter = "all" | WorkoutStatus;

export default function MuscleDensityPanel({ workouts, exercises, onOpenNotes, }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const filteredWorkouts = useMemo(() => {
    return workouts
      .filter((workout) =>
        statusFilter === "all" ? true : workout.status === statusFilter
      )
      .filter((workout) => (fromDate ? workout.date >= fromDate : true))
      .filter((workout) => (toDate ? workout.date <= toDate : true));
  }, [fromDate, statusFilter, toDate, workouts]);

  const entries = useMemo(() => {
    const muscleCount: Record<string, number> = {};

    filteredWorkouts.forEach((workout) => {
      workout.exercises.forEach((workoutExercise) => {
        const exercise = exerciseMap.get(workoutExercise.exerciseId);
        if (!exercise) return;

        [
          ...exercise.muscles.primary,
          ...(exercise.muscles.secondary ?? []),
          ...(exercise.muscles.stabilizer ?? []),
        ].forEach((muscle) => {
          muscleCount[muscle] = (muscleCount[muscle] ?? 0) + 1;
        });
      });
    });

    return Object.entries(muscleCount).sort((a, b) => b[1] - a[1]);
  }, [exerciseMap, filteredWorkouts]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Muscle Density</h2>

      <div className="density-filters">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          aria-label="Muscle density start date"
        />

        <input
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          aria-label="Muscle density end date"
        />
      </div>

      <button
        onClick={onOpenNotes}
        style={{
          marginBottom: 12,
          padding: "10px 14px",
          borderRadius: 10,
          border: "none",
          background: "#111827",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        View Notes
      </button>


      {entries.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No muscles tracked for this range.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {entries.map(([muscle, count]) => (
            <div
              key={muscle}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#f9fafb",
              }}
            >
              <span>{muscle}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
