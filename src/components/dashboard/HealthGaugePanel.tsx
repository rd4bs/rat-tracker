const items = [
  { label: "Sleep", value: "--" },
  { label: "Stress", value: "--" },
  { label: "Travel", value: "--" },
  { label: "Cardio", value: "--" },
  { label: "Calories", value: "--" },
];

export default function HealthGaugesPanel() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Health Gauges</h2>
      <p style={{ color: "#6b7280" }}>
        Recovery and readiness metrics will live here.
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              background: "#f9fafb",
            }}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
