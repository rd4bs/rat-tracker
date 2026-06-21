import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import { db } from "@/db/db";
import {
  createGymTrackerBackup,
  importGymTrackerBackup,
} from "@/db/backup";
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
import ExerciseLibraryModal from "@/components/modals/ExerciseLibraryModal";
import WorkoutTrackerPage from "@/pages/WorkoutTrackerPage";
import NotesReviewModal from "@/components/modals/NotesReviewModal";
import { createId } from "@/utils/id";

function normalizeExerciseName(name: string) {
  return name.trim().toLowerCase();
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isExerciseLibraryOpen, setIsExerciseLibraryOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const [isBackupBusy, setIsBackupBusy] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataMessage, setDataMessage] = useState("");
  const [dataError, setDataError] = useState("");

  const loadData = async () => {
    setIsLoadingData(true);

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
      setDataError("");
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setDataError("Could not load local workout data.");
    } finally {
      setIsLoadingData(false);
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

  const showSavedMessage = (message: string) => {
    setDataMessage(`${message} at ${dayjs().format("h:mm A")}.`);
    setDataError("");
  };

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
      id: createId(),
      date: values.date,
      name: values.name,
      notes: values.notes || undefined,
      status: "planned",
      exercises: values.exercises.map((plannedExercise) => ({
        id: createId(),
        exerciseId: plannedExercise.exerciseId,
        sets: plannedExercise.sets,
      })),
    };

    setDataMessage("");
    setDataError("");

    try {
      await db.workouts.put(newWorkout);
      await loadData();
      showSavedMessage("Workout saved");
    } catch (error) {
      console.error("Failed to create workout plan:", error);
      setDataError("Workout save failed.");
      throw error;
    }

    if (values.date) {
      setSelectedDate(values.date);
    }
  };

  const handleSaveEditedWorkout = async (updatedWorkout: Workout) => {
    setDataMessage("");
    setDataError("");

    try {
      await db.workouts.put(updatedWorkout);
      await loadData();
      showSavedMessage("Workout saved");
    } catch (error) {
      console.error("Failed to save workout:", error);
      setDataError("Workout save failed.");
      throw error;
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    setDataMessage("");
    setDataError("");

    try {
      await db.workouts.delete(workoutId);
      await loadData();
      showSavedMessage("Workout deleted");
    } catch (error) {
      console.error("Failed to delete workout:", error);
      setDataError("Workout delete failed.");
      throw error;
    }

    if (editingWorkout?.id === workoutId) {
      setEditingWorkout(null);
    }
  };

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkoutId(workout.id);
  };

  const handleTrackerSaved = async () => {
    setDataMessage("");
    setDataError("");
    await loadData();
    showSavedMessage("Workout saved");
  };

  const hasDuplicateExerciseName = (name: string, currentId?: string) => {
    const normalizedName = normalizeExerciseName(name);

    return exercises.some(
      (exercise) =>
        !exercise.isArchived &&
        exercise.id !== currentId &&
        normalizeExerciseName(exercise.name) === normalizedName
    );
  };

  const handleSaveCustomExercise = async (exercise: Exercise) => {
    setDataMessage("");
    setDataError("");

    if (hasDuplicateExerciseName(exercise.name, exercise.id)) {
      setDataError("An active exercise with this name already exists.");
      throw new Error("Duplicate exercise name");
    }

    try {
      await db.exercises.put(exercise);
      await loadData();
      showSavedMessage("Exercise saved");
    } catch (error) {
      console.error("Failed to save custom exercise:", error);
      setDataError("Exercise save failed.");
      throw error;
    }
  };

  const handleArchiveCustomExercise = async (exerciseId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    if (!exercise?.isCustom) return;

    setDataMessage("");
    setDataError("");

    try {
      await db.exercises.put({
        ...exercise,
        isArchived: true,
        archivedAt: new Date().toISOString(),
      });
      await loadData();
      showSavedMessage("Exercise archived");
    } catch (error) {
      console.error("Failed to archive custom exercise:", error);
      setDataError("Exercise archive failed.");
      throw error;
    }
  };

  const handleRestoreCustomExercise = async (exerciseId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    if (!exercise?.isCustom) return;

    setDataMessage("");
    setDataError("");

    if (hasDuplicateExerciseName(exercise.name, exercise.id)) {
      setDataError("An active exercise with this name already exists.");
      throw new Error("Duplicate exercise name");
    }

    try {
      const restoredExercise: Exercise = {
        ...exercise,
        isArchived: false,
        archivedAt: undefined,
      };

      await db.exercises.put(restoredExercise);
      await loadData();
      showSavedMessage("Exercise restored");
    } catch (error) {
      console.error("Failed to restore custom exercise:", error);
      setDataError("Exercise restore failed.");
      throw error;
    }
  };

  const handleExportBackup = async () => {
    setIsBackupBusy(true);
    setBackupMessage("");
    setBackupError("");

    try {
      const backup = await createGymTrackerBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");

      downloadLink.href = url;
      downloadLink.download = `gym-tracker-backup-${dayjs().format(
        "YYYY-MM-DD-HHmm"
      )}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(url);

      setBackupMessage(
        `Exported ${backup.workouts.length} workouts and ${backup.exercises.length} exercises.`
      );
    } catch (error) {
      console.error("Failed to export backup:", error);
      setBackupError("Backup export failed.");
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleImportBackup = async (file: File) => {
    setIsBackupBusy(true);
    setBackupMessage("");
    setBackupError("");

    try {
      const result = await importGymTrackerBackup(await file.text());
      await loadData();
      setBackupMessage(
        `Imported ${result.workoutCount} workouts and ${result.exerciseCount} exercises.`
      );
    } catch (error) {
      console.error("Failed to import backup:", error);
      setBackupError("Backup import failed. Select a valid Gym Tracker backup.");
    } finally {
      setIsBackupBusy(false);
    }
  };

  if (activeWorkout) {
    return (
      <WorkoutTrackerPage
        workout={activeWorkout}
        exercises={exercises}
        onBack={() => setActiveWorkoutId(null)}
        onSaved={handleTrackerSaved}
      />
    );
  }

  return (
    <div className="app-page">
      <div className="app-container">
        <DashboardHeader selectedDate={selectedDate} />

        {isLoadingData ? (
          <p className="app-alert app-alert--info" role="status">
            Loading local data...
          </p>
        ) : null}

        {dataMessage ? (
          <p className="app-alert app-alert--success" role="status">
            {dataMessage}
          </p>
        ) : null}

        {dataError ? (
          <p className="app-alert app-alert--error" role="alert">
            {dataError}
          </p>
        ) : null}

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
            <PlannerPanel
              onOpenCreatePlan={() => setIsCreatePlanOpen(true)}
              onOpenExerciseLibrary={() => setIsExerciseLibraryOpen(true)}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              backupMessage={backupMessage}
              backupError={backupError}
              isBackupBusy={isBackupBusy}
            />
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

        <ExerciseLibraryModal
          isOpen={isExerciseLibraryOpen}
          exercises={exercises}
          onClose={() => setIsExerciseLibraryOpen(false)}
          onSaveExercise={handleSaveCustomExercise}
          onArchiveExercise={handleArchiveCustomExercise}
          onRestoreExercise={handleRestoreCustomExercise}
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
