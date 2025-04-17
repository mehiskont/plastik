import { Suspense } from "react"
import { SearchBar } from "@/components/search-bar"
import { NewArrivals } from "@/components/new-arrivals"
import { RecordGridSkeleton } from "@/components/record-grid-skeleton"
import { AllRecordsSection } from "@/components/client-components/all-records-section"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

// Force dynamic rendering to prevent stale data from being cached
export const dynamic = 'force-dynamic'
export const revalidate = 0 // Do not cache this page

interface HomePageProps {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function HomePage({ searchParams = {} }: HomePageProps) {
  // Remove fetching all inventory data just for count
  // const { records } = await getDiscogsInventory(undefined, undefined, 1, 100)
  // const recordCount = records.reduce((total, record) => total + (record.quantity_available || 0), 0)
  
  // Consider fetching the count from a dedicated API endpoint if needed
  const recordCount = null; // Placeholder - fetch from API if required

  return (
    <div className="min-h-screen">
   
      {/* Hero Section with Search */}
      <section className="relative py-24 bg-background">
        <div className="container max-w-6xl mx-auto px-4 mt-12">
          {/* Optional: Display count if fetched from API */}
          {/* {recordCount !== null && (
            <h2 className="text-xl md:text-2xl font-medium text-center mb-8">{recordCount} records currently in our library</h2>
          )} */}
          <SearchBar preventRedirect={false} />
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-20 bg-card/30 bg-background">
        <div className="container mx-auto px-4">
          <Suspense fallback={<RecordGridSkeleton />}>
            <NewArrivals />
          </Suspense>
        </div>
      </section>

      {/* All Records Section */}
      <AllRecordsSection />
    </div>
  )
}

