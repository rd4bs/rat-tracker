import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import { db } from "@/db/db";
import type { Exercise } from "@/types/exercise";
import { EXERCISES } from "@/data/exercises";
import type { Workout, WorkoutSet } from "@/types/workout";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import WeekNavigation from "@/components/dashboard/WeekNavigation";
import PlannerPanel from "@/components/dashboard/PlannerPanel";
import HealthGaugesPanel from "@/components/dashboard/HealthGaugePanel";
import TodayPlanPanel from "@/components/dashboard/TodayPlanPanel";
import MuscleDensityPanel from "@/components/dashboard/MuscleDensityPanel";
import CreatePlanModal from "@/components/modals/CreatePlanModal";
import EditTodayPlanModal from "@/components/modals/EditTodayPlanModal";
import WorkoutTrackerPage from "@/pages/WorkoutTrackerPage";
import NotesReviewModal from "@/components/modals/NotesReviewModal";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const loadData = async () => {
    try {
      const existingExercises = await db.exercises.count();

      if (existingExercises === 0) {
        await db.exercises.bulkPut(EXERCISES);
      }

      const [workoutList, exerciseList] = await Promise.all([
        db.workouts.toArray(),
        db.exercises.toArray(),
      ]);

      setWorkouts(workoutList);
      setExercises(exerciseList);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const workoutsForSelectedDate = useMemo(() => {
    return workouts.filter((w) => w.date === selectedDate);
  }, [workouts, selectedDate]);

  const activeWorkout = useMemo(() => {
    if (!activeWorkoutId) return null;
    return workouts.find((w) => w.id === activeWorkoutId) ?? null;
  }, [workouts, activeWorkoutId]);

  const handleCreatePlan = async (values: {
    date: string;
    name: string;
    notes: string;
    exercises: {
      exerciseId: string;
      sets: WorkoutSet[];
    }[];
  }) => {
    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      date: values.date,
      name: values.name,
      notes: values.notes || undefined,
      status: "planned",
      exercises: values.exercises.map((plannedExercise) => ({
        id: crypto.randomUUID(),
        exerciseId: plannedExercise.exerciseId,
        sets: plannedExercise.sets,
      })),
    };

    await db.workouts.put(newWorkout);
    await loadData();

    if (values.date) {
      setSelectedDate(values.date);
    }
  };

  const handleSaveEditedWorkout = async (updatedWorkout: Workout) => {
    await db.workouts.put(updatedWorkout);
    await loadData();
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    await db.workouts.delete(workoutId);
    await loadData();

    if (editingWorkout?.id === workoutId) {
      setEditingWorkout(null);
    }
  };

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkoutId(workout.id);
  };

  if (activeWorkout) {
    return (
      <WorkoutTrackerPage
        workout={activeWorkout}
        exercises={exercises}
        onBack={() => setActiveWorkoutId(null)}
        onSaved={loadData}
      />
    );
  }

  return (
    <div className="app-page">
      <div className="app-container">
        <DashboardHeader selectedDate={selectedDate} />

        <div className="dashboard-week">
          <WeekNavigation
            workouts={workouts}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        <DashboardGrid
          topLeft={
            <TodayPlanPanel
              selectedDate={selectedDate}
              workouts={workoutsForSelectedDate}
              onEditWorkout={setEditingWorkout}
              onStartWorkout={handleStartWorkout}
            />
          }
          topRight={<HealthGaugesPanel />}
          bottomLeft={
            <PlannerPanel onOpenCreatePlan={() => setIsCreatePlanOpen(true)} />
          }
          bottomRight={
            <MuscleDensityPanel
              workouts={workouts}
              exercises={exercises}
              onOpenNotes={() => setIsNotesOpen(true)}
            />
          }
        />

        <CreatePlanModal
          isOpen={isCreatePlanOpen}
          initialDate={selectedDate}
          exercises={exercises}
          onClose={() => setIsCreatePlanOpen(false)}
          onSave={handleCreatePlan}
        />

        <EditTodayPlanModal
          isOpen={!!editingWorkout}
          workout={editingWorkout}
          exercises={exercises}
          onClose={() => setEditingWorkout(null)}
          onSave={handleSaveEditedWorkout}
          onDelete={handleDeleteWorkout}
        />

        <NotesReviewModal
          isOpen={isNotesOpen}
          workouts={workouts}
          exercises={exercises}
          onClose={() => setIsNotesOpen(false)}
        />
      </div>
    </div>
  );
}
