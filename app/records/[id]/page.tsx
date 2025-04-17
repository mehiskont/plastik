import { notFound } from "next/navigation"
import { RecordDetails } from "@/components/record-details"
import { ClientRecordCard } from "@/components/client-record-card"
import { log } from "@/lib/logger"
import { ApiUnavailable } from "@/components/api-unavailable"
import type { Record } from "@/types/record" // Import the canonical Record type

// Remove local type definitions
// type Record = { ... };
// type Track = { ... };
// type Video = { ... };

export default async function RecordPage({ params }: { params: { id: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const recordId = params.id; // This is now the internal DB Id

  if (!apiUrl) {
    log("NEXT_PUBLIC_API_URL is not set. Cannot fetch record details.", {}, "error");
    return <div className="container mx-auto py-10 text-center">API configuration error.</div>;
  }

  try {
    // Use the internal DB recordId in the fetch URL
    const fetchUrl = `${apiUrl}/api/records/${recordId}/details`;

    log(`Fetching record details from internal API: ${fetchUrl}`, {}, "info");

    const response = await fetch(fetchUrl, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      if (response.status === 404) {
        log(`Record not found in API for ID: ${recordId}`, { status: 404, url: fetchUrl }, "info");
        notFound();
      } else {
        // Get error message from response if possible, otherwise use status text
        let errorBody = 'Unknown error';
        try {
           errorBody = await response.text(); // Try to get response body
        } catch (_) { /* Ignore if reading body fails */ }
        log(`Failed to fetch record from API. Status: ${response.status}, Body: ${errorBody}`, { url: fetchUrl }, "error");
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
      }
    }

    // Simplify data parsing - assume the API returns the record object directly
    const record: Record | null = await response.json(); // Use imported Record type
    const relatedRecords: Record[] = []; // Placeholder - Note: This should also use the imported Record type if populated

    if (!record) {
      log(`API returned success but no record data for ID: ${recordId}`, { url: fetchUrl }, "warn");
      notFound();
    }
    
    // Optional: Check quantity if API doesn't handle it (though it should)
    // if (record.quantity_available === 0) {
    //   log(`Record out of stock (checked on frontend): ${recordId}`);
    //   notFound();
    // }

    log(`Successfully fetched record: ${record.title}`, {}, "info");
    log(`Found ${relatedRecords.length} related records from API`, {}, "info");

    // Pass fetched data directly to components (assuming API format is suitable)
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <RecordDetails record={record} />

        {relatedRecords.length > 0 && (
          <div className="mt-8 pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Related Records</h2>
              <span className="text-xs text-muted-foreground">{relatedRecords.length} items</span>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {relatedRecords.map((relatedRecord) => (
                <div 
                  key={relatedRecord.id} 
                  className="w-64 flex-shrink-0"
                >
                  <ClientRecordCard record={relatedRecord} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    log(`Error fetching or processing record page ID ${recordId}:`, error, "error");
    // Use ApiUnavailable or throw error for boundary
    return <ApiUnavailable />; 
    // throw error; // Alternatively, let the nearest error boundary handle it
  }
}

