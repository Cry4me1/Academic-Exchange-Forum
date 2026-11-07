import { requireAdmin } from "@/lib/admin/permissions";
import {
  getAdminDuelsList,
  getDuelAdminStats,
  getDuelAnomalies,
  getDuelConfig,
} from "@/lib/admin/duels";
import { DuelsManagementClient } from "./DuelsManagementClient";

export default async function AdminDuelsPage() {
  const admin = await requireAdmin("analyst");
  const config = await getDuelConfig();

  const [stats, initialDuels, initialAnomalies] = await Promise.all([
    getDuelAdminStats(config),
    getAdminDuelsList({ page: 1, pageSize: 15 }),
    getDuelAnomalies(config),
  ]);

  return (
    <DuelsManagementClient
      adminRole={admin.role}
      initialConfig={config}
      initialStats={stats}
      initialDuels={initialDuels}
      initialAnomalies={initialAnomalies}
    />
  );
}
