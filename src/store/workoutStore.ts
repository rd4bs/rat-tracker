import { create } from "zustand";

export type WorkoutSet = {
  id: string;
  reps: number;
  weight: number;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
};

export type Workout = {
  id: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
};

type WorkoutState = {
  current: Workout | null;

  startWorkout: (name: string) => void;
  addExercise: (exerciseId: string) => void;
  addSet: (exerciseInstanceId: string) => void;
  updateSet: (
    exerciseInstanceId: string,
    setId: string,
    field: "reps" | "weight",
    value: number
  ) => void;
  saveWorkout: () => void;
  clearWorkout: () => void;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  current: null,

  startWorkout: (name) =>
    set({
      current: {
        id: generateId(),
        name,
        date: new Date().toISOString(),
        exercises: [],
      },
    }),

  addExercise: (exerciseId) =>
    set((state) => {
      if (!state.current) return state;

      return {
        current: {
          ...state.current,
          exercises: [
            ...state.current.exercises,
            {
              id: generateId(),
              exerciseId,
              sets: [],
            },
          ],
        },
      };
    }),

  addSet: (exerciseInstanceId) =>
    set((state) => {
      if (!state.current) return state;

      return {
        current: {
          ...state.current,
          exercises: state.current.exercises.map((ex) =>
            ex.id === exerciseInstanceId
              ? {
                  ...ex,
                  sets: [
                    ...ex.sets,
                    {
                      id: generateId(),
                      reps: 0,
                      weight: 0,
                    },
                  ],
                }
              : ex
          ),
        },
      };
    }),

  updateSet: (exerciseInstanceId, setId, field, value) =>
    set((state) => {
      if (!state.current) return state;

      return {
        current: {
          ...state.current,
          exercises: state.current.exercises.map((ex) =>
            ex.id === exerciseInstanceId
              ? {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.id === setId ? { ...s, [field]: value } : s
                  ),
                }
              : ex
          ),
        },
      };
    }),

  saveWorkout: () => {
    const workout = get().current;
    if (!workout) return;

    const existing = JSON.parse(localStorage.getItem("workouts") || "[]");

    localStorage.setItem(
      "workouts",
      JSON.stringify([...existing, workout])
    );

    set({ current: null });
  },

  clearWorkout: () => set({ current: null }),
}));