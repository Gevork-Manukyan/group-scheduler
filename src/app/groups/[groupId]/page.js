import { notFound } from "next/navigation";

import GroupPage from "@/components/group-page";
import { getGroupSnapshot } from "@/lib/group-service";

export const dynamic = "force-dynamic";

export default async function GroupRoutePage({ params }) {
  const { groupId } = await params;
  const group = await getGroupSnapshot(groupId);

  if (!group) {
    notFound();
  }

  return <GroupPage groupId={groupId} initialGroup={group} />;
}
