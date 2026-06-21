import dayjs from "dayjs";
import type { Workout } from "@/types/workout";
import { getWorkoutTypeIcon } from "@/utils/workoutIcons";
import {
  getWorkoutStatusIcon,
  getWorkoutStatusLabel,
} from "@/utils/workoutStatus";

type Props = {
  workouts: Workout[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
};

export default function WeekNavigation({
  workouts,
  selectedDate,
  onDateSelect,
}: Props) {
  const startOfWeek = dayjs(selectedDate).startOf("week");

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfWeek.add(i, "day");
    const formatted = date.format("YYYY-MM-DD");
    const dayWorkouts = workouts.filter((workout) => workout.date === formatted);

    return {
      label: date.format("dd"),
      dayNumber: date.format("D"),
      fullDate: formatted,
      workouts: dayWorkouts,
      isSelected: formatted === selectedDate,
    };
  });

  return (
    <section className="week-navigation" aria-label="Week navigation">
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>
        Week of {startOfWeek.format("MMM D")}
      </h2>

      <div className="week-navigation__scroller">
        <div className="week-navigation__grid">
          {days.map((day) => (
            <button
              key={day.fullDate}
              className={`week-navigation__day${
                day.isSelected ? " is-selected" : ""
              }`}
              onClick={() => onDateSelect(day.fullDate)}
              aria-current={day.isSelected ? "date" : undefined}
              aria-label={`${day.fullDate}: ${
                day.workouts.length === 0
                  ? "no workouts"
                  : `${day.workouts.length} workouts`
              }`}
            >
              <div style={{ fontSize: 12, color: "#6b7280" }}>{day.label}</div>

              <div style={{ fontWeight: 700, marginTop: 4 }}>
                {day.dayNumber}
              </div>

              <div className="week-navigation__workouts">
                {day.workouts.length === 0 ? (
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>-</span>
                ) : (
                  day.workouts.map((workout) => (
                    <span
                      key={workout.id}
                      className="week-navigation__workout-icon"
                      title={`${workout.name} - ${getWorkoutStatusLabel(
                        workout.status
                      )}`}
                    >
                      <span>{getWorkoutTypeIcon(workout.name)}</span>
                      <span>{getWorkoutStatusIcon(workout.status)}</span>
                    </span>
                  ))
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
