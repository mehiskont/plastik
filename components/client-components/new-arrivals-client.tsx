"use client"

import { ClientRecordCard } from "../client-record-card"

// Define placeholder type (can be imported if centralized)
type Record = {
  id: number | string;
  title: string;
  artist?: string;
  cover_image?: string;
  label?: string;
  catalogNumber?: string;
  price?: number;
  condition?: string;
  quantity_available?: number; // Keep fields used by ClientRecordCard
  // Add other fields used by ClientRecordCard if any
};

interface NewArrivalsClientProps {
  // records: DiscogsRecord[] // Use the placeholder Record type
  records: Record[]
}

export default function NewArrivalsClient({ records }: NewArrivalsClientProps) {
  if (!records || records.length === 0) {
    return <p className="text-center text-lg">No new arrivals at the moment. Check back soon!</p>
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">New Arrivals</h2>
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
        {/* Slice the records directly here if needed, or ensure the parent passes the correct slice */}
        {records.map((record) => (
          <div
            key={record.id}
            className="w-64 flex-shrink-0"
          >
            {/* Ensure ClientRecordCard props match the Record type */}
            <ClientRecordCard record={record} />
          </div>
        ))}
      </div>
    </div>
  )
}