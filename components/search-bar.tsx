"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"
import { SearchResults } from "@/components/search-results"
import { SearchCategories } from "@/components/search-categories"
import type { DiscogsRecord } from "@/types/discogs"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  initialQuery?: string
  initialCategory?: string
  isCompact?: boolean // Add compact mode for navbar
  expandable?: boolean // Add expandable mode for navbar searchbar
  preventRedirect?: boolean // Prevent redirect to search page, just filter in place
}

export function SearchBar({ initialQuery = "", initialCategory = "everything", isCompact = false, expandable = false, preventRedirect = false }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<DiscogsRecord[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchResults = useCallback(async () => {
    // Don't fetch if query is empty or too short
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      // Determine if this is a short query (3 chars or less)
      // Short queries may need special handling to ensure good results
      const isShortQuery = debouncedQuery.trim().length <= 3;
      
      // Add cache prevention and use larger page size for short queries
      // This improves result quality for short catalog numbers and IDs
      const params = new URLSearchParams({
        q: debouncedQuery,
        category,
        per_page: isShortQuery ? "50" : "20", // More results for short queries
        refresh: "true", // Always fetch fresh results
      })
      
      // Add cache buster for short queries to prevent stale results
      // Short queries are more sensitive to caching issues
      const cacheBuster = isShortQuery ? `&cacheBuster=${Date.now()}` : "";

      console.log("Fetching search results:", `/api/search?${params.toString()}${cacheBuster}`)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''; // Get base URL
      const response = await fetch(`${apiUrl}/api/records?${params.toString()}${cacheBuster}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch results")
      }

      const data = await response.json()
      console.log("Search results:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      // For short queries, especially catalog-number-like searches,
      // prioritize exact and prefix matches in the results
      if (isShortQuery && /^[a-z0-9]{2,3}$/i.test(debouncedQuery.trim())) {
        const shortQueryMatches = sortResultsByRelevance(data.data, debouncedQuery);
        
        if (shortQueryMatches.length > 0) {
          console.log(`Prioritizing ${shortQueryMatches.length} relevant records for short query`);
          setResults(shortQueryMatches);
          return;
        }
      }

      setResults(data.data || [])
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [debouncedQuery, category])

  // Helper function to sort results by relevance for short queries
  const sortResultsByRelevance = (records: DiscogsRecord[], query: string): DiscogsRecord[] => {
    if (!records || records.length === 0) return [];
    
    const normalizedQuery = query.trim().toLowerCase();
    
    // Create a copy to avoid mutating the original
    const sortedRecords = [...records];
    
    // Sort by relevance
    return sortedRecords.sort((a, b) => {
      // Extract key fields for comparison
      const aTitle = String(a.title || '').toLowerCase();
      const bTitle = String(b.title || '').toLowerCase();
      const aCatalog = String(a.catalogNumber || '').toLowerCase();
      const bCatalog = String(b.catalogNumber || '').toLowerCase();
      const aId = String(a.id || '').toLowerCase();
      const bId = String(b.id || '').toLowerCase();
      
      // Exact matches have highest priority
      const aExactMatch = aTitle === normalizedQuery || aCatalog === normalizedQuery || aId === normalizedQuery;
      const bExactMatch = bTitle === normalizedQuery || bCatalog === normalizedQuery || bId === normalizedQuery;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then prioritize prefix matches (starts with)
      const aStartsWithMatch = aTitle.startsWith(normalizedQuery) || 
                             aCatalog.startsWith(normalizedQuery) ||
                             aId.startsWith(normalizedQuery);
      const bStartsWithMatch = bTitle.startsWith(normalizedQuery) || 
                             bCatalog.startsWith(normalizedQuery) ||
                             bId.startsWith(normalizedQuery);
      
      if (aStartsWithMatch && !bStartsWithMatch) return -1;
      if (!aStartsWithMatch && bStartsWithMatch) return 1;
      
      // Finally prioritize contains matches
      const aContainsMatch = aTitle.includes(normalizedQuery) || 
                           aCatalog.includes(normalizedQuery) ||
                           aId.includes(normalizedQuery);
      const bContainsMatch = bTitle.includes(normalizedQuery) || 
                           bCatalog.includes(normalizedQuery) ||
                           bId.includes(normalizedQuery);
                           
      if (aContainsMatch && !bContainsMatch) return -1;
      if (!aContainsMatch && bContainsMatch) return 1;
      
      // If all else is equal, maintain original order
      return 0;
    });
  };

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return

    console.log("Search form submitted with query:", query, "category:", category)
    setShowResults(false)
    
    // Navigate to search page only if not prevented
    if (!preventRedirect) {
      // Add refresh=true parameter to ensure we get fresh results
      const searchURL = `/search?q=${encodeURIComponent(query)}&category=${category}&refresh=true`;
      console.log("Navigating to:", searchURL);
      router.push(searchURL)
    }
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    
    // The useEffect hook listening to [debouncedQuery, category] will trigger fetchResults
  }

  return (
    <div 
      ref={searchRef} 
      className={cn(
        "relative mx-auto", 
        isCompact ? "" : "w-full max-w-3xl space-y-4",
        expandable && isCompact ? "transition-all duration-300 ease-in-out" : "",
        expandable && isCompact && isFocused ? "w-64" : expandable && isCompact ? "w-40" : "w-full"
      )}
      style={{ position: isCompact ? 'relative' : 'relative' }} // Ensure consistent positioning
    >
      <div className={cn(
        "bg-card overflow-hidden border border-primary/20 dark:bg-secondary dark:border-white/10",
        isCompact 
          ? "rounded-md shadow" 
          : "rounded-xl shadow-xl"
      )}>
        <form onSubmit={handleSubmit} className="relative" action="/search">
          {/* Wrap Search icon in a submit button */}
          <button 
            type="submit" 
            aria-label="Submit search" 
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
            style={{ background: 'none', border: 'none' }} // Basic styling to make it look like just an icon
          >
            <Search className={cn(
              "text-primary dark:text-primary", // Removed absolute positioning from icon itself
              isCompact ? "h-4 w-4" : "h-5 w-5"
            )} />
          </button>
          <Input
            type="search"
            name="q"
            placeholder="Search records..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => {
              setIsFocused(true)
              setShowResults(true) // Show results when focused
            }}
            className={cn(
              "bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
              isCompact 
                ? "pl-9 py-2 h-9 text-sm" 
                : "pl-12 py-6 h-14 text-lg"
            )}
          />
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="refresh" value="true" />
        </form>
      </div>
      
      {/* Show categories when input is focused in compact mode or always in full mode */}
      {(!isCompact || (isCompact && showResults)) && (
        <div className={cn(
          isCompact ? "bg-card dark:bg-secondary border border-primary/20 dark:border-white/10" : "bg-transparent", 
          isCompact && showResults ? "p-2 border-t-0" : "",
          "rounded-b-md -mt-2"
        )}>
          <SearchCategories 
            activeCategory={category} 
            query={query} 
            onCategoryChange={handleCategoryChange}
            isCompact={isCompact}
          />
        </div>
      )}
      
      {/* Only show results when there's a query and results are supposed to be shown */}
      {showResults && query.length > 0 && (
        <SearchResults
          results={results}
          isLoading={isLoading}
          query={query}
          category={category}
          onClose={() => setShowResults(false)}
          isCompact={isCompact}
        />
      )}
    </div>
  )
}

