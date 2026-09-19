import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listContainersForUser } from "@/lib/containers";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const containers = listContainersForUser(user.id);

  return <Dashboard initialContainers={containers} />;
}
