import { NextRequest } from "next/server";
import { getOrdersForPreset } from "../_preset";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return getOrdersForPreset(request, "this-month");
}
