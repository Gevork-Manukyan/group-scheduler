import { AppwriteException } from "node-appwrite";
import { NextResponse } from "next/server";

export function routeErrorResponse(error, fallbackMessage = "Something went wrong.") {
  if (error instanceof AppwriteException) {
    return NextResponse.json(
      { error: error.message || fallbackMessage },
      { status: error.code || 500 },
    );
  }

  const status = typeof error?.status === "number" ? error.status : 500;

  return NextResponse.json(
    { error: error?.message || fallbackMessage },
    { status },
  );
}
