type Props = {
  selectedDate: string;
};

export default function DashboardHeader({ selectedDate }: Props) {
  return (
    <header style={{ marginBottom: 20 }}>
      <h1 style={{ margin: 0, fontSize: 32 }}>Gym Tracker</h1>
      <p style={{ marginTop: 8, color: "#6b7280" }}>
        Dashboard for {selectedDate}
      </p>
    </header>
  );
}