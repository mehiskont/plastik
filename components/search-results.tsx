import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"

// Define placeholder type for Record
type Record = {
  id: number | string; // Assuming id can be number or string
  title: string;
  artist?: string; // Assuming artist is optional
  coverImage?: string; // Use camelCase to match API response
  label?: string; // Optional label
  catalogNumber?: string; // Optional catalog number
  price?: number; // Optional price
  condition?: string; // Optional condition
  // Add other fields expected from the API
};

interface SearchResultsProps {
  results: Record[];
  isLoading: boolean
  query: string
  category: string
  onClose: () => void
  isCompact?: boolean
}

export function SearchResults({ results, isLoading, query, category, onClose, isCompact = false }: SearchResultsProps) {
  if (!query) return null

  // Take only the first 5 results for the dropdown
  const displayResults = results.slice(0, 5)

  return (
    <div className={`absolute z-[100] mt-2 ${isCompact ? "bg-card dark:bg-secondary" : "bg-background/90"} backdrop-blur supports-[backdrop-filter]:${isCompact ? "bg-card/95 dark:bg-secondary" : "bg-background/90"} border border-primary/10 dark:border-white/10 rounded-lg shadow-lg overflow-hidden ${isCompact ? "w-80 sm:w-96" : "left-0 right-0"}`} 
      style={{ 
        position: 'absolute', 
        top: '100%', 
        left: isCompact ? '0' : '0',
        width: isCompact ? 'auto' : '100%'
      }}>
      {isLoading ? (
        <div className="p-4 text-center">
          <Loader2 className={isCompact ? "h-5 w-5 animate-spin mx-auto" : "h-6 w-6 animate-spin mx-auto"} />
        </div>
      ) : displayResults.length > 0 ? (
        <>
          <div className={isCompact ? "max-h-[300px] overflow-y-auto" : "max-h-[400px] overflow-y-auto"}>
            {displayResults.map((record) => {
              const labelDisplay = record.label
                ? record.label + (record.catalogNumber ? ` [${record.catalogNumber}]` : "")
                : "Unknown Label"
              return (
                <Link
                  key={record.id}
                  href={`/records/${record.id}`}
                  className={`flex items-center hover:bg-muted/30 dark:hover:bg-white/5 transition-colors ${isCompact ? "gap-3 p-3" : "gap-4 p-4"}`}
                  onClick={onClose}
                >
                  <div className={`relative flex-shrink-0 ${isCompact ? "w-10 h-10" : "w-12 h-12"}`}>
                    <Image
                      src={record.coverImage || "/placeholder.svg"}
                      alt={record.title}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isCompact ? "text-sm" : "text-base"}`}>{record.title}</h3>
                    <p className={`text-muted-foreground/70 truncate ${isCompact ? "text-xs" : "text-sm"}`}>{record.artist || "Unknown Artist"}</p>
                    {!isCompact && (
                      <p className="text-xs text-muted-foreground/60 truncate">{labelDisplay}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${isCompact ? "text-sm" : ""}`}>${(record.price || 0).toFixed(2)}</div>
                    <div className={`text-muted-foreground/70 ${isCompact ? "text-xs" : "text-sm"}`}>{record.condition || "Unknown"}</div>
                  </div>
                </Link>
              )
            })}
          </div>
          {results.length > 5 && (
            <div className={isCompact ? "p-3 border-t border-primary/10 dark:border-white/10" : "p-4 border-t border-primary/10 dark:border-white/10"}>
              <Link
                href={`/search?q=${encodeURIComponent(query)}&category=${category}`}
                className={`block w-full text-center text-muted-foreground/70 hover:text-foreground ${isCompact ? "text-xs" : "text-sm"}`}
                onClick={onClose}
              >
                View all {results.length} results
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className={isCompact ? "p-3 text-center text-muted-foreground/70 text-xs" : "p-4 text-center text-muted-foreground/70"}>No results found</div>
      )}
    </div>
  )
}

