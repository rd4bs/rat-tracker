import { useMemo, useState } from "react";
import { MUSCLES } from "@/data/muscles";
import type { Exercise } from "@/types/exercise";
import type { Muscle } from "@/types/muscle";
import type { Workout } from "@/types/workout";

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
  exerciseId?: string;
  exerciseName?: string;
  equipment?: string[];
  muscles?: Muscle[];
  setNumber?: number;
  note: string;
};

function exerciseMuscles(exercise: Exercise | undefined): Muscle[] {
  if (!exercise) return [];

  return [
    ...exercise.muscles.primary,
    ...(exercise.muscles.secondary ?? []),
    ...(exercise.muscles.stabilizer ?? []),
  ];
}

export default function NotesReviewModal({
  isOpen,
  workouts,
  exercises,
  onClose,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<Muscle | "">("");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [exerciseFilter, setExerciseFilter] = useState("");

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const equipmentOptions = useMemo(() => {
    return Array.from(
      new Set(exercises.flatMap((exercise) => exercise.equipment ?? []))
    ).sort((a, b) => a.localeCompare(b));
  }, [exercises]);

  const sortedExercises = useMemo(() => {
    return [...exercises].sort((a, b) => a.name.localeCompare(b.name));
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
        const muscles = exerciseMuscles(exercise);

        if (workoutExercise.notes?.trim()) {
          items.push({
            id: `${workoutExercise.id}-exercise-note`,
            type: "exercise",
            date: workout.date,
            workoutName: workout.name || "Unnamed Workout",
            exerciseId: workoutExercise.exerciseId,
            exerciseName: exercise?.name || "Unknown Exercise",
            equipment: exercise?.equipment ?? [],
            muscles,
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
              exerciseId: workoutExercise.exerciseId,
              exerciseName: exercise?.name || "Unknown Exercise",
              equipment: exercise?.equipment ?? [],
              muscles,
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
    const normalizedSearch = search.trim().toLowerCase();

    if (activeFilter !== "all" && note.type !== activeFilter) return false;
    if (fromDate && note.date < fromDate) return false;
    if (toDate && note.date > toDate) return false;
    if (muscleFilter && !note.muscles?.includes(muscleFilter)) return false;
    if (equipmentFilter && !note.equipment?.includes(equipmentFilter)) {
      return false;
    }
    if (exerciseFilter && note.exerciseId !== exerciseFilter) return false;

    if (!normalizedSearch) return true;

    return [
      note.note,
      note.workoutName,
      note.exerciseName ?? "",
      note.date,
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content modal-content--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Notes review"
      >
        <div className="notes-header">
          <h2>Notes Review</h2>

          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="notes-filters">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes"
          />

          <select
            value={activeFilter}
            onChange={(event) =>
              setActiveFilter(event.target.value as ActiveFilter)
            }
          >
            <option value="all">All notes</option>
            <option value="workout">Workout</option>
            <option value="exercise">Exercise</option>
            <option value="set">Set</option>
          </select>

          <select
            value={muscleFilter}
            onChange={(event) => setMuscleFilter(event.target.value as Muscle | "")}
          >
            <option value="">All muscles</option>
            {MUSCLES.map((muscle) => (
              <option key={muscle} value={muscle}>
                {muscle}
              </option>
            ))}
          </select>

          <select
            value={equipmentFilter}
            onChange={(event) => setEquipmentFilter(event.target.value)}
          >
            <option value="">All equipment</option>
            {equipmentOptions.map((equipment) => (
              <option key={equipment} value={equipment}>
                {equipment}
              </option>
            ))}
          </select>

          <select
            value={exerciseFilter}
            onChange={(event) => setExerciseFilter(event.target.value)}
          >
            <option value="">All exercises</option>
            {sortedExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            aria-label="Notes start date"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            aria-label="Notes end date"
          />
        </div>

        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No notes found.</p>
          ) : (
            filteredNotes.map((item) => (
              <div key={item.id} className="notes-item">
                <div className="notes-meta">
                  {item.date} | {item.type.toUpperCase()}
                </div>

                <strong>{item.workoutName}</strong>

                {item.exerciseName ? (
                  <div className="notes-exercise-name">
                    {item.exerciseName}
                    {item.setNumber ? ` | Set ${item.setNumber}` : ""}
                  </div>
                ) : null}

                <p>{item.note}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
