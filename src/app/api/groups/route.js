import { NextResponse } from "next/server";

import { createGroup } from "@/lib/group-service";
import { routeErrorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const group = await createGroup(body);

    return NextResponse.json({
      groupId: group.id,
      group,
    });
  } catch (error) {
    return routeErrorResponse(error, "Unable to create the group.");
  }
}
