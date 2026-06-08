import type { Workout } from "@/types/workout";
import { getWorkoutTypeIcon } from "@/utils/workoutIcons";
import {
  getWorkoutStatusIcon,
  getWorkoutStatusLabel,
} from "@/utils/workoutStatus";

type Props = {
  selectedDate: string;
  workouts: Workout[];
  onEditWorkout: (workout: Workout) => void;
  onStartWorkout: (workout: Workout) => void;
};

export default function TodayPlanPanel({
  selectedDate,
  workouts,
  onEditWorkout,
  onStartWorkout,
}: Props) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Today</h2>
      <p style={{ color: "#6b7280" }}>{selectedDate}</p>

      {workouts.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No workouts planned for this day.</p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {workouts.map((workout) => (
            <div
              key={workout.id}
              style={{
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>
                  {getWorkoutTypeIcon(workout.name)}
                </span>

                <strong>{workout.name || "Unnamed Workout"}</strong>
              </div>

              <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                {getWorkoutStatusIcon(workout.status)} {getWorkoutStatusLabel(workout.status)}
              </p>

              {workout.notes ? (
                <p style={{ marginTop: 8, marginBottom: 0, color: "#6b7280" }}>
                  {workout.notes}
                </p>
              ) : null}

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => onEditWorkout(workout)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Edit Today&apos;s Plan
                </button>

                <button
                  onClick={() => onStartWorkout(workout)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "#111827",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Start Workout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}