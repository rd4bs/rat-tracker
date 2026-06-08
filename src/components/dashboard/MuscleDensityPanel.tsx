import type { Workout } from "@/types/workout";
import type { Exercise } from "@/types/exercise";

type Props = {
  workouts: Workout[];
  exercises: Exercise[];
  onOpenNotes: () => void;
};

export default function MuscleDensityPanel({ workouts, exercises, onOpenNotes, }: Props) {
  const muscleCount: Record<string, number> = {};

  workouts.forEach((w) => {
    w.exercises.forEach((we) => {
      const ex = exercises.find((e) => e.id === we.exerciseId);
      if (!ex) return;

      [
        ...ex.muscles.primary,
        ...(ex.muscles.secondary ?? []),
        ...(ex.muscles.stabilizer ?? []),
      ].forEach((m) => {
        muscleCount[m] = (muscleCount[m] ?? 0) + 1;
      });
    });
  });

  const entries = Object.entries(muscleCount).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Muscle Density</h2>

      <button
        onClick={onOpenNotes}
        style={{
          marginBottom: 12,
          padding: "10px 14px",
          borderRadius: 10,
          border: "none",
          background: "#111827",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        View Notes
      </button>


      {entries.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No muscles tracked yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {entries.map(([muscle, count]) => (
            <div
              key={muscle}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#f9fafb",
              }}
            >
              <span>{muscle}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}