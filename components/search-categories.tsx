"use client"

import type React from "react"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SearchCategoriesProps {
  activeCategory: string
  query: string
  onCategoryChange?: (category: string) => void
  isCompact?: boolean
}

const categories = [
  { id: "everything", label: "Everything" },
  { id: "releases", label: "Releases" },
  { id: "artists", label: "Artists" },
  { id: "labels", label: "Labels" },
]

export function SearchCategories({ activeCategory, query, onCategoryChange, isCompact = false }: SearchCategoriesProps) {
  const handleClick = (categoryId: string, e: React.MouseEvent) => {
    if (onCategoryChange) {
      e.preventDefault()
      onCategoryChange(categoryId)
      // Don't navigate to search page when in dropdown
    }
  }

  return (
    <div className={cn(
      "flex gap-1 md:gap-2 justify-center flex-wrap", 
      isCompact ? "px-1" : "md:gap-4"
    )}>
      {categories.map((category) => {
        const isActive = activeCategory === category.id
        const href = `/search?q=${encodeURIComponent(query)}&category=${category.id}`

        const buttonClasses = cn(
          "rounded-full",
          isCompact ?
            "px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs h-auto" :
            "px-3 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm h-auto",
        )

        // Define shared props for cleaner code (without the key)
        const buttonSharedProps = {
          variant: "ghost" as const,
          size: "sm" as const,
        }

        // Calculate className based on active state and compact mode
        const buttonComputedClassName = cn(
          buttonClasses,
          isActive
            ? "bg-accent text-accent-foreground hover:bg-accent/90" // Active state style
            // Non-active state style
            : cn(
                "text-muted-foreground", // Default text color for non-active
                isCompact
                  ? "hover:bg-transparent hover:text-foreground" // In compact, hover changes text but not bg
                  : "hover:bg-accent/50 hover:text-foreground" // Default ghost hover otherwise
              )
        )

        return onCategoryChange ? (
          <Button
            key={category.id}
            {...buttonSharedProps}
            onClick={(e) => handleClick(category.id, e)}
            className={buttonComputedClassName}
          >
            {category.label}
          </Button>
        ) : (
          <Button
            key={category.id}
            {...buttonSharedProps}
            asChild
            className={buttonComputedClassName}
          >
            <Link href={href}>
              {category.label}
            </Link>
          </Button>
        )
      })}
    </div>
  )
}

