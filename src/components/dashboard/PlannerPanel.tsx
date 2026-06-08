type Props = {
  onOpenCreatePlan: () => void;
};

export default function PlannerPanel({ onOpenCreatePlan }: Props) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Plan / Schedule</h2>
      <p style={{ color: "#6b7280" }}>
        Create and assign workouts to a day.
      </p>

      <button
        onClick={onOpenCreatePlan}
        style={{
          marginTop: 12,
          padding: "12px 16px",
          borderRadius: 10,
          border: "none",
          background: "#2563eb",
          color: "#ffffff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        + Create / Plan Workout
      </button>
    </div>
  );
}