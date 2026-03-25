import { NextResponse } from "next/server";

import { saveGroupResponse } from "@/lib/group-service";
import { routeErrorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const result = await saveGroupResponse(groupId, body);

    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error, "Unable to save availability.");
  }
}
