// This component forwards the props to RecordGridWrapper and is used for server-side rendering
import { Suspense } from "react"
import { RecordGridSkeleton } from "@/components/record-grid-skeleton"
import RecordGridProxy from "./record-grid-proxy" 

interface RecordGridProps {
  searchParams?: { [key: string]: string | string[] | undefined }
  showFilter?: boolean
}

// For backwards compatibility with any components that still use this server component
export async function RecordGrid({ searchParams = {}, showFilter = false }: RecordGridProps) {
  // We're now using the API-based approach, so we don't need to fetch data here
  // Just return a fallback client component that will fetch data from the API
  return (
    <Suspense fallback={<RecordGridSkeleton />}>
      <RecordGridProxy searchParams={searchParams} showFilter={showFilter} />
    </Suspense>
  )
}