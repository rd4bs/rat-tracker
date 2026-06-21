import { useMemo, useState } from "react";
import dayjs from "dayjs";
import type { Workout } from "@/types/workout";
import {
  getWorkoutStatusIcon,
  getWorkoutStatusLabel,
} from "@/utils/workoutStatus";

type Props = {
  isOpen: boolean;
  selectedDate: string;
  workouts: Workout[];
  onClose: () => void;
  onDateSelect: (date: string) => void;
};

export default function MonthPlanningModal({
  isOpen,
  selectedDate,
  workouts,
  onClose,
  onDateSelect,
}: Props) {
  const [visibleMonth, setVisibleMonth] = useState(
    dayjs(selectedDate).startOf("month")
  );

  const days = useMemo(() => {
    const start = visibleMonth.startOf("month").startOf("week");

    return Array.from({ length: 42 }, (_, index) => {
      const date = start.add(index, "day");
      const formatted = date.format("YYYY-MM-DD");

      return {
        date,
        formatted,
        workouts: workouts.filter((workout) => workout.date === formatted),
        isCurrentMonth: date.month() === visibleMonth.month(),
        isSelected: formatted === selectedDate,
        isToday: formatted === dayjs().format("YYYY-MM-DD"),
      };
    });
  }, [selectedDate, visibleMonth, workouts]);

  if (!isOpen) return null;

  const handleDateSelect = (date: string) => {
    onDateSelect(date);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--wide">
        <div className="month-calendar-header">
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => current.subtract(1, "month"))}
          >
            Previous
          </button>

          <h2>{visibleMonth.format("MMMM YYYY")}</h2>

          <button
            type="button"
            onClick={() => setVisibleMonth((current) => current.add(1, "month"))}
          >
            Next
          </button>
        </div>

        <div className="month-calendar-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <strong key={day}>{day}</strong>
          ))}
        </div>

        <div className="month-calendar-grid">
          {days.map((day) => (
            <button
              key={day.formatted}
              type="button"
              className={[
                "month-calendar-day",
                day.isCurrentMonth ? "" : "is-outside-month",
                day.isSelected ? "is-selected" : "",
                day.isToday ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleDateSelect(day.formatted)}
            >
              <span className="month-calendar-date">
                {day.date.format("D")}
              </span>

              {day.workouts.length === 0 ? (
                <span className="month-calendar-empty">No workouts</span>
              ) : (
                <span className="month-calendar-workouts">
                  {day.workouts.slice(0, 3).map((workout) => (
                    <span key={workout.id}>
                      {getWorkoutStatusIcon(workout.status)}{" "}
                      {workout.name || getWorkoutStatusLabel(workout.status)}
                    </span>
                  ))}
                  {day.workouts.length > 3 ? (
                    <span>+{day.workouts.length - 3} more</span>
                  ) : null}
                </span>
              )}
            </button>
          ))}
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
