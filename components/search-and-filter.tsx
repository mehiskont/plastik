"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SearchAndFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [sort, setSort] = useState(searchParams.get("sort") || "default")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }
    router.push(`/?${params.toString()}`)
  }

  const handleSort = (value: string) => {
    setSort(value)
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set("sort", value)
    } else {
      params.delete("sort")
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <form onSubmit={handleSearch} className="flex-1">
        <Input
          type="search"
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>
      <Select value={sort} onValueChange={handleSort}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="price_asc">Price: Low to High</SelectItem>
          <SelectItem value="price_desc">Price: High to Low</SelectItem>
          <SelectItem value="title_asc">Title: A to Z</SelectItem>
          <SelectItem value="title_desc">Title: Z to A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

