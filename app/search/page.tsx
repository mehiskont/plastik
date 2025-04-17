import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchBar } from "@/components/search-bar"
import { RecordGrid } from "@/components/record-grid"
import { RecordGridSkeleton } from "@/components/record-grid-skeleton"
import { RefreshButton } from "@/components/refresh-button"

export const metadata: Metadata = {
  title: "Search Records",
  description: "Search our collection of rare and collectible vinyl records",
}

interface SearchPageProps {
  searchParams?: {
    q?: string
    category?: string
    refresh?: string
  }
}

export default function SearchPage({ searchParams = {} }: SearchPageProps) {
  const query = searchParams.q ?? ""
  const category = searchParams.category ?? "everything"

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <SearchBar initialQuery={query} initialCategory={category} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {query ? (
              <>
                Search results for "{query}"{category !== "everything" && ` in ${category}`}
              </>
            ) : (
              "All Records"
            )}
          </h1>
          <RefreshButton />
        </div>
        
        {query && (
          <p className="text-muted-foreground mb-4">
            Showing records matching your search query. Results are sorted by relevance.
          </p>
        )}
        
        <Suspense fallback={<RecordGridSkeleton />}>
          <RecordGrid searchParams={searchParams} showFilter={true} />
        </Suspense>
      </div>
    </div>
  )
}

