import { ApiUnavailable } from "@/components/api-unavailable"
import NewArrivalsClient from "./client-components/new-arrivals-client"
import { log } from "@/lib/logger"

// Define placeholder type (can be imported if centralized)
type Record = {
  id: number | string;
  title: string;
  artist?: string;
  cover_image?: string;
  label?: string;
  catalogNumber?: string;
  price?: number;
  condition?: string;
  quantity_available?: number;
  // Add other fields needed by NewArrivalsClient/ClientRecordCard
};


export async function NewArrivals() {
  let records: Record[] = []; // Use the placeholder type
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    log("NEXT_PUBLIC_API_URL is not set. Cannot fetch new arrivals.", {}, "error");
    return <ApiUnavailable />;
  }

  try {
    log("Fetching new arrivals data from backend API", {}, "info");
    
    // Construct API URL
    // Fetch top 8 newest records (adjust perPage as needed)
    const fetchUrl = `${apiUrl}/api/records?sort=date-desc&page=1&perPage=8`;
    
    log("[Server Component Log] Attempting to fetch new arrivals from:", { url: fetchUrl }, "info"); 
    
    const response = await fetch(fetchUrl, {
      // Add cache control or revalidation strategy if needed
      next: { revalidate: 600 } // Example: revalidate every 10 minutes
    });

    // **** ADDED LOGGING ****
    const responseStatus = response.status;
    const responseText = await response.text(); // Get raw text first
    log("[Server Component Log] Response Status:", { status: responseStatus });
    console.log("[Server Component Log] Raw Response Text (first 500 chars):", responseText.substring(0, 500)); // Log snippet of raw text

    // Check status *before* parsing
    if (!response.ok) { 
      log(`[Server Error] Failed to fetch new arrivals from API. Status: ${responseStatus}`, { url: fetchUrl, responseText: responseText.substring(0, 500) }, "error");
      throw new Error(`API request failed with status ${responseStatus}`);
    }

    let data;
    try {
      data = JSON.parse(responseText); // Parse the text
    } catch (parseError) {
      log("[Server Error] Error parsing JSON response from API", { parseError, responseText: responseText.substring(0, 500) }, "error");
      throw new Error("Failed to parse API response");
    }
    // **** END ADDED LOGGING ****

    // Map coverImage to cover_image before passing to client component
    const rawRecords = data.data || [];
    const mappedRecords = rawRecords.map((record: any) => ({
      ...record,
      cover_image: record.coverImage, // Map the field
    }));

    // Filter for "FOR_SALE" status
    const forSaleRecords = mappedRecords.filter(
      (record: any) => record.status === "FOR_SALE"
    );

    if (!forSaleRecords || forSaleRecords.length === 0) {
      log("[Server Log] No 'FOR_SALE' records found after filtering.", {}, "info");
      return <p className="text-center text-lg">No new arrivals currently for sale. Check back soon!</p>
    }
    
    log(`[Server Log] Fetched ${forSaleRecords.length} 'FOR_SALE' new arrivals from API`, {}, "info");

    return <NewArrivalsClient records={forSaleRecords} /> // Pass filtered records

  } catch (error) {
    log("[Server Error] Error in NewArrivals fetch/process:", error, "error");
    return <ApiUnavailable />;
  }
}