import assert from "node:assert/strict";
import {
  createPlannedWorkoutFromTemplate,
  createPlannedWorkoutFromWorkout,
  createWorkoutTemplateFromWorkout,
} from "../src/utils/workoutPlanning.ts";

const sourceWorkout = {
  id: "workout-source",
  date: "2026-06-21",
  name: "Upper Body",
  notes: "Source workout note",
  status: "completed",
  completedAt: "2026-06-21T12:00:00.000Z",
  exercises: [
    {
      id: "workout-exercise-source",
      exerciseId: "barbell_bench_press",
      notes: "Exercise note",
      sets: [
        {
          id: "set-source",
          targetReps: 8,
          targetWeight: 135,
          actualReps: 10,
          actualWeight: 145,
          reps: 9,
          weight: 140,
          completed: true,
          notes: "Set note",
        },
        {
          id: "set-source-no-target",
          actualReps: 12,
          actualWeight: 95,
          notes: "Fallback target note",
        },
      ],
    },
  ],
};

const template = createWorkoutTemplateFromWorkout(sourceWorkout);

assert.equal(template.name, sourceWorkout.name);
assert.equal(template.exercises.length, 1);
assert.notEqual(template.id, sourceWorkout.id);
assert.notEqual(template.exercises[0].id, sourceWorkout.exercises[0].id);
assert.notEqual(template.exercises[0].sets[0].id, sourceWorkout.exercises[0].sets[0].id);
assert.equal(template.exercises[0].sets[0].targetReps, 8);
assert.equal(template.exercises[0].sets[0].targetWeight, 135);
assert.equal(template.exercises[0].sets[0].actualReps, undefined);
assert.equal(template.exercises[0].sets[0].actualWeight, undefined);
assert.equal(template.exercises[0].sets[0].completed, undefined);
assert.equal(template.exercises[0].sets[0].notes, undefined);
assert.equal(template.exercises[0].sets[1].targetReps, 12);
assert.equal(template.exercises[0].sets[1].targetWeight, 95);

const plannedFromTemplate = createPlannedWorkoutFromTemplate(
  template,
  "2026-06-22",
  "Template Day"
);

assert.equal(plannedFromTemplate.status, "planned");
assert.equal(plannedFromTemplate.date, "2026-06-22");
assert.equal(plannedFromTemplate.name, "Template Day");
assert.equal(plannedFromTemplate.completedAt, undefined);
assert.notEqual(plannedFromTemplate.exercises[0].sets[0].id, template.exercises[0].sets[0].id);
assert.equal(plannedFromTemplate.exercises[0].sets[0].actualReps, undefined);

const duplicateWithoutActuals = createPlannedWorkoutFromWorkout(
  sourceWorkout,
  "2026-06-23",
  false,
  "Duplicate Day"
);

assert.equal(duplicateWithoutActuals.status, "planned");
assert.equal(duplicateWithoutActuals.date, "2026-06-23");
assert.equal(duplicateWithoutActuals.name, "Duplicate Day");
assert.equal(duplicateWithoutActuals.completedAt, undefined);
assert.equal(duplicateWithoutActuals.exercises[0].sets[0].targetReps, 8);
assert.equal(duplicateWithoutActuals.exercises[0].sets[0].targetWeight, 135);
assert.equal(duplicateWithoutActuals.exercises[0].sets[0].actualReps, undefined);
assert.equal(duplicateWithoutActuals.exercises[0].sets[0].actualWeight, undefined);
assert.equal(duplicateWithoutActuals.exercises[0].sets[0].notes, undefined);

const duplicateWithActuals = createPlannedWorkoutFromWorkout(
  sourceWorkout,
  "2026-06-24",
  true
);

assert.equal(duplicateWithActuals.status, "planned");
assert.equal(duplicateWithActuals.exercises[0].sets[0].actualReps, 10);
assert.equal(duplicateWithActuals.exercises[0].sets[0].actualWeight, 145);
assert.equal(duplicateWithActuals.exercises[0].sets[0].notes, "Set note");
assert.equal(duplicateWithActuals.exercises[0].sets[0].completed, true);

console.log("Data workflow checks passed.");
