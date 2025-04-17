import { NextResponse } from "next/server"
import { log } from "@/lib/logger"

export async function GET(req: Request) {
  log("Webhook test endpoint accessed via GET", {}, "info")
  return NextResponse.json({ status: "ok", message: "Webhook test endpoint is working" })
}

export async function POST(req: Request) {
  log("Webhook test endpoint accessed via POST", {}, "info")
  return NextResponse.json({ status: "ok", message: "Webhook test endpoint is working" })
}