import { useMemo, useState } from "react";
import { MUSCLES } from "@/data/muscles";
import type { Exercise } from "@/types/exercise";
import type { Muscle } from "@/types/muscle";

type Props = {
  exercises: Exercise[];
  selectedExerciseId: string;
  onSelectExercise: (exerciseId: string) => void;
  label?: string;
  includeArchived?: boolean;
};

function exerciseMuscles(exercise: Exercise) {
  return [
    ...exercise.muscles.primary,
    ...(exercise.muscles.secondary ?? []),
    ...(exercise.muscles.stabilizer ?? []),
  ];
}

export default function ExercisePicker({
  exercises,
  selectedExerciseId,
  onSelectExercise,
  label = "Exercise",
  includeArchived = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<Muscle | "">("");
  const [equipmentFilter, setEquipmentFilter] = useState("");

  const availableExercises = useMemo(
    () =>
      includeArchived
        ? exercises
        : exercises.filter((exercise) => !exercise.isArchived),
    [exercises, includeArchived]
  );

  const equipmentOptions = useMemo(() => {
    return Array.from(
      new Set(
        availableExercises.flatMap((exercise) => exercise.equipment ?? [])
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [availableExercises]);

  const filteredExercises = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return availableExercises
      .filter((exercise) =>
        normalizedSearch
          ? exercise.name.toLowerCase().includes(normalizedSearch)
          : true
      )
      .filter((exercise) =>
        muscleFilter ? exerciseMuscles(exercise).includes(muscleFilter) : true
      )
      .filter((exercise) =>
        equipmentFilter
          ? (exercise.equipment ?? []).includes(equipmentFilter)
          : true
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableExercises, equipmentFilter, muscleFilter, search]);

  const selectedExerciseExists = filteredExercises.some(
    (exercise) => exercise.id === selectedExerciseId
  );

  return (
    <div className="exercise-picker">
      <div className="exercise-picker-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search exercises"
          className="exercise-picker-input"
        />

        <select
          value={muscleFilter}
          onChange={(event) =>
            setMuscleFilter(event.target.value as Muscle | "")
          }
          className="exercise-picker-input"
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
          className="exercise-picker-input"
        >
          <option value="">All equipment</option>
          {equipmentOptions.map((equipment) => (
            <option key={equipment} value={equipment}>
              {equipment}
            </option>
          ))}
        </select>
      </div>

      <label className="exercise-picker-select-label">
        <span>{label}</span>
        <select
          value={selectedExerciseExists ? selectedExerciseId : ""}
          onChange={(event) => onSelectExercise(event.target.value)}
          className="exercise-picker-input"
        >
          <option value="">Select Exercise</option>
          {filteredExercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
              {exercise.isArchived ? " (archived)" : ""}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
