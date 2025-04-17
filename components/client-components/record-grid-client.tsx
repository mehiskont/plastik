"use client"

import { useEffect, useState } from "react"
// import type { DiscogsRecord } from "@/types/discogs" // Remove old type
import type { Record } from "@/types/record" // Import the correct type
import { ClientRecordCard } from "../client-record-card"
import RecordListView from "./record-list-view"

interface RecordGridClientProps {
  // records: DiscogsRecord[] // Use the correct type
  records: Record[]
  viewMode?: 'grid' | 'list'
}

export default function RecordGridClient({ records, viewMode = 'grid' }: RecordGridClientProps) {
  // const [sortedRecords, setSortedRecords] = useState<DiscogsRecord[]>(records) // Use the correct type
  const [sortedRecords, setSortedRecords] = useState<Record[]>(records)

  useEffect(() => {
    // Check if we're on a search page by looking for query params in the URL
    const isSearch = typeof window !== 'undefined' && 
                    window.location.pathname.includes('/search') && 
                    window.location.search.includes('q=');
    
    // Get the search query if we're on a search page
    const searchParams = typeof window !== 'undefined' ? 
                         new URLSearchParams(window.location.search) : null;
    const searchQuery = searchParams?.get('q')?.toLowerCase() || '';
    
    if (isSearch && searchQuery) {
      console.log('Sorting records by relevance for search:', searchQuery);
      
      // Sort records by relevance to search query
      const sortedByRelevance = [...records].sort((a, b) => {
        const titleA = a.title?.toLowerCase() || '';
        const titleB = b.title?.toLowerCase() || '';
        const artistA = a.artist?.toLowerCase() || '';
        const artistB = b.artist?.toLowerCase() || '';
        
        // Check for exact matches in title
        const aExactTitleMatch = titleA === searchQuery;
        const bExactTitleMatch = titleB === searchQuery;
        if (aExactTitleMatch && !bExactTitleMatch) return -1;
        if (!aExactTitleMatch && bExactTitleMatch) return 1;
        
        // Check for exact matches in artist
        const aExactArtistMatch = artistA === searchQuery;
        const bExactArtistMatch = artistB === searchQuery;
        if (aExactArtistMatch && !bExactArtistMatch) return -1;
        if (!aExactArtistMatch && bExactArtistMatch) return 1;
        
        // Check for starts-with in title
        const aStartsWithTitle = titleA.startsWith(searchQuery);
        const bStartsWithTitle = titleB.startsWith(searchQuery);
        if (aStartsWithTitle && !bStartsWithTitle) return -1;
        if (!aStartsWithTitle && bStartsWithTitle) return 1;
        
        // Check for starts-with in artist
        const aStartsWithArtist = artistA.startsWith(searchQuery);
        const bStartsWithArtist = artistB.startsWith(searchQuery);
        if (aStartsWithArtist && !bStartsWithArtist) return -1;
        if (!aStartsWithArtist && bStartsWithArtist) return 1;
        
        // Then sort by how many times the search term appears
        const aOccurrences = (titleA.match(new RegExp(searchQuery, 'g')) || []).length + 
                            (artistA.match(new RegExp(searchQuery, 'g')) || []).length;
        const bOccurrences = (titleB.match(new RegExp(searchQuery, 'g')) || []).length + 
                            (artistB.match(new RegExp(searchQuery, 'g')) || []).length;
        if (aOccurrences > bOccurrences) return -1;
        if (aOccurrences < bOccurrences) return 1;
        
        // Fall back to alphabetical by title
        return titleA.localeCompare(titleB);
      });
      
      setSortedRecords(sortedByRelevance);
    } else {
      // On non-search pages, sort alphabetically by title
      const alphabeticallySorted = [...records].sort((a, b) => {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB);
      });
      setSortedRecords(alphabeticallySorted);
    }
  }, [records]);

  if (!records || records.length === 0) {
    // Check if we're on a search page
    const isSearchPage = typeof window !== 'undefined' && 
                        window.location.pathname.includes('/search') && 
                        window.location.search.includes('q=');
    const searchParams = typeof window !== 'undefined' ? 
                       new URLSearchParams(window.location.search) : null;
    const searchQuery = searchParams?.get('q') || '';
    
    if (isSearchPage && searchQuery) {
      return (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold mb-2">No matching records found</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find any records matching "{searchQuery}" in our inventory.
          </p>
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <p className="text-sm">Try:</p>
            <ul className="list-disc text-left pl-8 space-y-1">
              <li>Checking your spelling</li>
              <li>Using more general keywords</li>
              <li>Trying a different category filter</li>
              <li>Browsing all records instead</li>
            </ul>
          </div>
        </div>
      );
    }
    
    return <p className="text-center text-lg">No records found.</p>
  }

  if (viewMode === 'list') {
    return <RecordListView records={sortedRecords} />
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {sortedRecords.map((record) => (
        <ClientRecordCard key={record.id} record={record} />
      ))}
    </div>
  )
}