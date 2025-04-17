"use client"

import RecordGridWrapper from "./record-grid-wrapper"

interface RecordGridProxyProps {
  searchParams?: { [key: string]: string | string[] | undefined }
  showFilter?: boolean
  viewMode?: 'grid' | 'list'
}

// Client component that proxies to the wrapper
export default function RecordGridProxy({ searchParams, showFilter, viewMode = 'grid' }: RecordGridProxyProps) {
  // Default to grid, but use viewMode from URL if present
  const urlViewMode = typeof searchParams?.view === "string" ? searchParams.view as 'grid' | 'list' : viewMode;
  
  return <RecordGridWrapper 
    searchParams={searchParams} 
    showFilter={showFilter} 
    viewMode={urlViewMode} 
  />
}