"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
// import { Button } from "@/components/ui/button" // No longer using direct Button here
import { cn } from "@/lib/utils"
import { 
  Pagination as UIPagination,
  PaginationContent,
  PaginationItem, 
  PaginationLink, 
  PaginationPrevious, 
  PaginationNext, 
  PaginationEllipsis 
} from "@/components/ui/pagination"

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Create new search params
  const createQueryString = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    return params.toString()
  }

  // Navigate to a specific page
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return

    startTransition(() => {
      router.push(`${pathname}?${createQueryString(page)}`)
    })
  }

  // Generate page numbers with ellipsis handling (more robust)
  const getPaginationItems = () => {
    const items: (number | 'ellipsis')[] = []
    const pageRangeDisplayed = 5 // Number of pages to show around current
    const marginPagesDisplayed = 1 // Number of pages to show at start/end

    if (totalPages <= pageRangeDisplayed + marginPagesDisplayed * 2) {
      // Show all pages if total is small enough
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      // Add first page(s)
      for (let i = 1; i <= marginPagesDisplayed; i++) {
        items.push(i)
      }

      // Add leading ellipsis if needed
      if (currentPage > marginPagesDisplayed + Math.ceil(pageRangeDisplayed / 2)) {
        items.push('ellipsis')
      }

      // Add pages around current page
      const startPage = Math.max(marginPagesDisplayed + 1, currentPage - Math.floor((pageRangeDisplayed - 1) / 2));
      const endPage = Math.min(totalPages - marginPagesDisplayed, currentPage + Math.ceil((pageRangeDisplayed - 1) / 2));

      for (let i = startPage; i <= endPage; i++) {
         // Avoid duplicates if start/end overlap with margin pages
         if (!items.includes(i)) { 
            items.push(i);
         }
      }

      // Add trailing ellipsis if needed
      if (currentPage < totalPages - marginPagesDisplayed - Math.floor(pageRangeDisplayed / 2)) {
         // Check if ellipsis already exists just before the last margin pages
         if (!items.includes('ellipsis')) {
             items.push('ellipsis');
         }
      }

      // Add last page(s)
      for (let i = totalPages - marginPagesDisplayed + 1; i <= totalPages; i++) {
         // Avoid duplicates
         if (!items.includes(i)) {
            items.push(i);
         }
      }
    }
    return items
  }

  // Only show pagination if there are multiple pages
  if (totalPages <= 1) return null

  return (
    <UIPagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href={`${pathname}?${createQueryString(currentPage - 1)}`}
            onClick={(e) => {
              if (currentPage <= 1 || isPending) {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              handlePageChange(currentPage - 1);
            }}
            className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
          />
        </PaginationItem>

        {getPaginationItems().map((item, index) => (
          <PaginationItem key={index}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink 
                href={`${pathname}?${createQueryString(item)}`}
                isActive={item === currentPage}
                onClick={(e) => {
                  if (item === currentPage || isPending) {
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                  handlePageChange(item);
                }}
                className={cn(item === currentPage && "pointer-events-none")}
              >
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext 
            href={`${pathname}?${createQueryString(currentPage + 1)}`}
            onClick={(e) => {
              if (currentPage >= totalPages || isPending) {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              handlePageChange(currentPage + 1);
            }}
            className={cn(currentPage >= totalPages && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
      </PaginationContent>
    </UIPagination>
  )
}