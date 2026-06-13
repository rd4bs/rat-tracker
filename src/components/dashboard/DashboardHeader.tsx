import PwaStatusBar from "@/components/pwa/PwaStatusBar";

type Props = {
  selectedDate: string;
};

export default function DashboardHeader({ selectedDate }: Props) {
  return (
    <header className="dashboard-header">
      <div>
        <h1 style={{ margin: 0, fontSize: 32 }}>Gym Tracker</h1>
        <p style={{ marginTop: 8, color: "#6b7280" }}>
          Dashboard for {selectedDate}
        </p>
      </div>

      <PwaStatusBar />
    </header>
  );
}
