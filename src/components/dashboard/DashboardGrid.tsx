import type { ReactNode } from "react";

type Props = {
  topLeft: ReactNode;
  topRight: ReactNode;
  bottomLeft: ReactNode;
  bottomRight: ReactNode;
};

function PanelShell({ children }: { children: ReactNode }) {
  return <section className="dashboard-panel">{children}</section>;
}

export default function DashboardGrid({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: Props) {
  return (
    <div className="dashboard-grid">
      <PanelShell>{topLeft}</PanelShell>
      <PanelShell>{topRight}</PanelShell>
      <PanelShell>{bottomLeft}</PanelShell>
      <PanelShell>{bottomRight}</PanelShell>
    </div>
  );
}
