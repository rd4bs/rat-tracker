import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import { db } from "@/db/db";
import {
  type BackupImportMode,
  type BackupImportPreview,
  createGymTrackerBackup,
  importGymTrackerBackup,
  previewGymTrackerBackup,
} from "@/db/backup";
import type { Exercise } from "@/types/exercise";
import type { DailyHealthMetrics } from "@/types/health";
import { EXERCISES } from "@/data/exercises";
import type { Workout, WorkoutSet, WorkoutTemplate } from "@/types/workout";

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
import WorkoutHistoryModal from "@/components/modals/WorkoutHistoryModal";
import ProgressHistoryModal from "@/components/modals/ProgressHistoryModal";
import WorkoutTemplateModal from "@/components/modals/WorkoutTemplateModal";
import DuplicateWorkoutModal from "@/components/modals/DuplicateWorkoutModal";
import BackupImportPreviewModal from "@/components/modals/BackupImportPreviewModal";
import WorkoutTrackerPage from "@/pages/WorkoutTrackerPage";
import NotesReviewModal from "@/components/modals/NotesReviewModal";
import { createId } from "@/utils/id";
import {
  createPlannedWorkoutFromTemplate,
  createPlannedWorkoutFromWorkout,
  createWorkoutTemplateFromWorkout,
} from "@/utils/workoutPlanning";

function normalizeExerciseName(name: string) {
  return name.trim().toLowerCase();
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<DailyHealthMetrics[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(
    []
  );
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isExerciseLibraryOpen, setIsExerciseLibraryOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [duplicatingWorkout, setDuplicatingWorkout] = useState<Workout | null>(
    null
  );
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const [isBackupBusy, setIsBackupBusy] = useState(false);
  const [pendingBackupText, setPendingBackupText] = useState("");
  const [backupPreview, setBackupPreview] =
    useState<BackupImportPreview | null>(null);
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

      const [
        workoutList,
        exerciseList,
        healthMetricList,
        workoutTemplateList,
      ] = await Promise.all([
        db.workouts.toArray(),
        db.exercises.toArray(),
        db.healthMetrics.toArray(),
        db.workoutTemplates.toArray(),
      ]);

      setWorkouts(workoutList);
      setExercises(exerciseList);
      setHealthMetrics(healthMetricList);
      setWorkoutTemplates(workoutTemplateList);
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

  const healthMetricsForSelectedDate = useMemo(() => {
    return (
      healthMetrics.find((metrics) => metrics.date === selectedDate) ?? null
    );
  }, [healthMetrics, selectedDate]);

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

  const handleSaveWorkoutTemplate = async (workout: Workout) => {
    setDataMessage("");
    setDataError("");

    try {
      await db.workoutTemplates.put(createWorkoutTemplateFromWorkout(workout));
      await loadData();
      showSavedMessage("Workout template saved");
    } catch (error) {
      console.error("Failed to save workout template:", error);
      setDataError("Workout template save failed.");
      throw error;
    }
  };

  const handleDeleteWorkoutTemplate = async (templateId: string) => {
    setDataMessage("");
    setDataError("");

    try {
      await db.workoutTemplates.delete(templateId);
      await loadData();
      showSavedMessage("Workout template deleted");
    } catch (error) {
      console.error("Failed to delete workout template:", error);
      setDataError("Workout template delete failed.");
      throw error;
    }
  };

  const handleCreateWorkoutFromTemplate = async (
    templateId: string,
    date: string,
    name: string
  ) => {
    const template = workoutTemplates.find((item) => item.id === templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    setDataMessage("");
    setDataError("");

    try {
      const plannedWorkout = createPlannedWorkoutFromTemplate(
        template,
        date,
        name
      );
      await db.workouts.put(plannedWorkout);
      await loadData();
      setSelectedDate(date);
      showSavedMessage("Workout created from template");
    } catch (error) {
      console.error("Failed to create workout from template:", error);
      setDataError("Template workout creation failed.");
      throw error;
    }
  };

  const handleDuplicateWorkout = async (
    workout: Workout,
    date: string,
    name: string,
    includeActualResults: boolean
  ) => {
    setDataMessage("");
    setDataError("");

    try {
      const plannedWorkout = createPlannedWorkoutFromWorkout(
        workout,
        date,
        includeActualResults,
        name
      );
      await db.workouts.put(plannedWorkout);
      await loadData();
      setSelectedDate(date);
      showSavedMessage("Workout duplicated");
    } catch (error) {
      console.error("Failed to duplicate workout:", error);
      setDataError("Workout duplicate failed.");
      throw error;
    }
  };

  const handleSaveHealthMetrics = async (metrics: DailyHealthMetrics) => {
    setDataMessage("");
    setDataError("");

    try {
      await db.healthMetrics.put(metrics);
      await loadData();
      showSavedMessage("Health gauges saved");
    } catch (error) {
      console.error("Failed to save health gauges:", error);
      setDataError("Health gauges save failed.");
      throw error;
    }
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
        `Exported ${backup.workouts.length} workouts, ${backup.exercises.length} exercises, ${backup.healthMetrics?.length ?? 0} health entries, and ${backup.workoutTemplates?.length ?? 0} templates.`
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
      const backupText = await file.text();
      const preview = await previewGymTrackerBackup(backupText);

      setPendingBackupText(backupText);
      setBackupPreview(preview);
    } catch (error) {
      console.error("Failed to preview backup:", error);
      setBackupError("Backup preview failed. Select a valid Gym Tracker backup.");
      setPendingBackupText("");
      setBackupPreview(null);
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleConfirmImportBackup = async (mode: BackupImportMode) => {
    if (!pendingBackupText) return;

    setIsBackupBusy(true);
    setBackupMessage("");
    setBackupError("");

    try {
      const result = await importGymTrackerBackup(pendingBackupText, mode);
      await loadData();
      setBackupMessage(
        `Imported ${result.workoutCount} workouts, ${result.exerciseCount} exercises, ${result.healthMetricCount} health entries, and ${result.templateCount} templates.`
      );
      setPendingBackupText("");
      setBackupPreview(null);
    } catch (error) {
      console.error("Failed to import backup:", error);
      setBackupError("Backup import failed. Select a valid Gym Tracker backup.");
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleCloseBackupPreview = () => {
    setPendingBackupText("");
    setBackupPreview(null);
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
              onDuplicateWorkout={setDuplicatingWorkout}
              onSaveTemplate={handleSaveWorkoutTemplate}
            />
          }
          topRight={
            <HealthGaugesPanel
              selectedDate={selectedDate}
              metrics={healthMetricsForSelectedDate}
              onSave={handleSaveHealthMetrics}
            />
          }
          bottomLeft={
            <PlannerPanel
              onOpenCreatePlan={() => setIsCreatePlanOpen(true)}
              onOpenExerciseLibrary={() => setIsExerciseLibraryOpen(true)}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenProgress={() => setIsProgressOpen(true)}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
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

        <WorkoutHistoryModal
          isOpen={isHistoryOpen}
          workouts={workouts}
          exercises={exercises}
          onClose={() => setIsHistoryOpen(false)}
        />

        <ProgressHistoryModal
          isOpen={isProgressOpen}
          workouts={workouts}
          exercises={exercises}
          onClose={() => setIsProgressOpen(false)}
        />

        <WorkoutTemplateModal
          isOpen={isTemplatesOpen}
          initialDate={selectedDate}
          templates={workoutTemplates}
          exercises={exercises}
          onClose={() => setIsTemplatesOpen(false)}
          onCreateWorkout={handleCreateWorkoutFromTemplate}
          onDeleteTemplate={handleDeleteWorkoutTemplate}
        />

        <DuplicateWorkoutModal
          isOpen={!!duplicatingWorkout}
          workout={duplicatingWorkout}
          initialDate={selectedDate}
          onClose={() => setDuplicatingWorkout(null)}
          onDuplicate={handleDuplicateWorkout}
        />

        <BackupImportPreviewModal
          isOpen={!!backupPreview}
          preview={backupPreview}
          onClose={handleCloseBackupPreview}
          onConfirm={handleConfirmImportBackup}
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
