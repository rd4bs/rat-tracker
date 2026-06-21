import { useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise";
import type { Workout, WorkoutStatus } from "@/types/workout";
import {
  getWorkoutStatusIcon,
  getWorkoutStatusLabel,
} from "@/utils/workoutStatus";

type StatusFilter = "all" | WorkoutStatus;

type Props = {
  isOpen: boolean;
  workouts: Workout[];
  exercises: Exercise[];
  onClose: () => void;
};

function setCount(workout: Workout) {
  return workout.exercises.reduce(
    (total, workoutExercise) => total + workoutExercise.sets.length,
    0
  );
}

function workoutMatchesSearch(
  workout: Workout,
  exerciseMap: Map<string, Exercise>,
  search: string
) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return (
    workout.name.toLowerCase().includes(normalizedSearch) ||
    workout.notes?.toLowerCase().includes(normalizedSearch) ||
    workout.exercises.some((workoutExercise) =>
      exerciseMap
        .get(workoutExercise.exerciseId)
        ?.name.toLowerCase()
        .includes(normalizedSearch)
    )
  );
}

export default function WorkoutHistoryModal({
  isOpen,
  workouts,
  exercises,
  onClose,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("");

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const filteredWorkouts = useMemo(() => {
    return workouts
      .filter((workout) =>
        statusFilter === "all" ? true : workout.status === statusFilter
      )
      .filter((workout) => (fromDate ? workout.date >= fromDate : true))
      .filter((workout) => (toDate ? workout.date <= toDate : true))
      .filter((workout) => workoutMatchesSearch(workout, exerciseMap, search))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [exerciseMap, fromDate, search, statusFilter, toDate, workouts]);

  const selectedWorkout =
    filteredWorkouts.find((workout) => workout.id === selectedWorkoutId) ??
    filteredWorkouts[0] ??
    null;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content modal-content--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Workout history"
      >
        <h2 style={{ marginTop: 0 }}>Workout History</h2>

        <div className="history-filters">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search workouts"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
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
            aria-label="History start date"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            aria-label="History end date"
          />
        </div>

        <div className="history-layout">
          <section className="history-list">
            {filteredWorkouts.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No workouts found.</p>
            ) : (
              filteredWorkouts.map((workout) => (
                <button
                  key={workout.id}
                  type="button"
                  className={`history-list-item ${
                    workout.id === selectedWorkout?.id ? "is-selected" : ""
                  }`}
                  onClick={() => setSelectedWorkoutId(workout.id)}
                >
                  <span>
                    <strong>{workout.name || "Unnamed Workout"}</strong>
                    <small>{workout.date}</small>
                  </span>
                  <span>
                    {getWorkoutStatusIcon(workout.status)}{" "}
                    {getWorkoutStatusLabel(workout.status)}
                  </span>
                </button>
              ))
            )}
          </section>

          <section className="history-detail">
            {selectedWorkout ? (
              <>
                <div className="history-detail-header">
                  <div>
                    <h3>{selectedWorkout.name || "Unnamed Workout"}</h3>
                    <p>
                      {selectedWorkout.date} |{" "}
                      {getWorkoutStatusLabel(selectedWorkout.status)} |{" "}
                      {selectedWorkout.exercises.length} exercises |{" "}
                      {setCount(selectedWorkout)} sets
                    </p>
                  </div>
                </div>

                {selectedWorkout.notes ? (
                  <p className="history-note">{selectedWorkout.notes}</p>
                ) : null}

                <div className="history-exercise-list">
                  {selectedWorkout.exercises.map((workoutExercise) => {
                    const exercise = exerciseMap.get(workoutExercise.exerciseId);

                    return (
                      <div
                        key={workoutExercise.id}
                        className="history-exercise-card"
                      >
                        <strong>{exercise?.name ?? "Unknown Exercise"}</strong>

                        {workoutExercise.notes ? (
                          <p>{workoutExercise.notes}</p>
                        ) : null}

                        <div className="history-set-list">
                          {workoutExercise.sets.length === 0 ? (
                            <span>No sets recorded.</span>
                          ) : (
                            workoutExercise.sets.map((set, setIndex) => (
                              <span key={set.id}>
                                Set {setIndex + 1}:{" "}
                                {set.actualReps ?? set.reps ?? set.targetReps ?? "--"}{" "}
                                reps x{" "}
                                {set.actualWeight ??
                                  set.weight ??
                                  set.targetWeight ??
                                  "--"}{" "}
                                lb
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p style={{ color: "#6b7280" }}>Select a workout.</p>
            )}
          </section>
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
