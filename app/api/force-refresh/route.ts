import { NextRequest, NextResponse } from "next/server";
import { flushCache } from "@/lib/redis";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    log("Force refreshing all caches");
    
    // Clear all caches
    await flushCache("*");
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      message: "All caches cleared. Refresh your search to see latest records.",
      timestamp: Date.now()
    });
  } catch (error) {
    log("Error clearing caches", error, "error");
    return NextResponse.json(
      { error: "Failed to clear caches" },
      { status: 500 }
    );
  }
}