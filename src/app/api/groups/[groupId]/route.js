import { NextResponse } from "next/server";

import { getGroupSnapshot } from "@/lib/group-service";
import { routeErrorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { groupId } = await params;
    const group = await getGroupSnapshot(groupId);

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    return routeErrorResponse(error, "Unable to load the group.");
  }
}
