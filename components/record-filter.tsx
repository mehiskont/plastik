"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
// Removed SearchCategories import as we're using Select components instead
import { Pagination } from "@/components/pagination"

interface RecordFilterProps {
  totalRecords?: number
  currentPage: number
  totalPages?: number
}

export function RecordFilter({ 
  totalRecords = 0, 
  currentPage = 1, 
  totalPages = 1 
}: RecordFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get current filter values from URL
  const q = searchParams.get("q") || ""
  const category = searchParams.get("category") || "everything"
  const genre = searchParams.get("genre") || ""
  const sort = searchParams.get("sort") || "date-desc"
  const page = Number(searchParams.get("page") || "1")

  // Create a new searchParams object to modify
  const createQueryString = (params: Record<string, string | number | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    
    // Update or delete each parameter
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value.toString())
      }
    })
    
    return newSearchParams.toString()
  }

  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({ 
          category: newCategory, 
          page: 1 // Reset to page 1 when category changes
        })}`
      )
    })
  }
  
  // Handle genre change
  const handleGenreChange = (newGenre: string) => {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({ 
          genre: newGenre === "all" ? null : newGenre, 
          page: 1 // Reset to page 1 when genre changes
        })}`
      )
    })
  }

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({ 
          sort: newSort,
          page: 1 // Reset to page 1 when sort changes
        })}`
      )
    })
  }

  // Pagination is now handled by the Pagination component

  return (
    <div className="space-y-4"> 
      <div className="flex flex-col md:flex-row justify-start gap-4">
        <div className="w-full md:w-48">
          <div className="text-sm font-medium mb-2">Category</div>
          <Select value={category} onValueChange={handleCategoryChange} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="everything">Everything</SelectItem>
                <SelectItem value="releases">Releases</SelectItem>
                <SelectItem value="artists">Artists</SelectItem>
                <SelectItem value="labels">Labels</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-48">
          <div className="text-sm font-medium mb-2">Genre</div>
          <Select value={genre} onValueChange={handleGenreChange} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="pop">Pop</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="hip hop">Hip Hop</SelectItem>
                <SelectItem value="classical">Classical</SelectItem>
                <SelectItem value="funk">Funk / Soul</SelectItem>
                <SelectItem value="reggae">Reggae</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-48">
          <div className="text-sm font-medium mb-2">Sort By</div>
          <Select value={sort} onValueChange={handleSortChange} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="title-asc">Title: A to Z</SelectItem>
                <SelectItem value="title-desc">Title: Z to A</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-6">
          <div className="text-sm text-muted-foreground">
            Showing {totalRecords > 0 ? (currentPage - 1) * 20 + 1 : 0}-
            {Math.min(currentPage * 20, totalRecords)} of {totalRecords} records
          </div>
          
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
          />
        </div>
      )}
    </div>
  )
}