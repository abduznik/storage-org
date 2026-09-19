import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getBreadcrumbPath,
  getContainerById,
  listChildContainers,
  listItemsForContainer,
  listShares,
  userCanAccessContainer,
  userOwnsContainer,
} from "@/lib/containers";
import ContainerDetail from "@/components/ContainerDetail";

export default async function ContainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const container = getContainerById(id);
  if (!container) notFound();

  if (!userCanAccessContainer(user.id, id)) {
    notFound();
  }

  const items = listItemsForContainer(id);
  const children = listChildContainers(id, user.id);
  const breadcrumbs = getBreadcrumbPath(id);
  const isOwner = userOwnsContainer(user.id, id);
  const shares = isOwner ? listShares(id) : [];

  return (
    <ContainerDetail
      container={container}
      items={items}
      children={children}
      breadcrumbs={breadcrumbs}
      isOwner={isOwner}
      shares={shares}
    />
  );
}
