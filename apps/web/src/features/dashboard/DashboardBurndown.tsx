import { listServices } from "@/features/list/services/list.service";
import BurndownCard from "./BurndownCard";

async function DashboardBurndown() {
  const lists = await listServices.getLists();
  return <BurndownCard lists={lists.map(({ id, name }) => ({ id, name }))} />;
}

export default DashboardBurndown;
