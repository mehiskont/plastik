"use client"

import type { Record } from "@/types/record"
// Remove ClientRecordCard import if only list view is handled here
// import { ClientRecordCard } from "../client-record-card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import Link from "next/link"
import Image from "next/image"
import React, { useEffect, useState } from "react" // Import React
import { toast } from "../ui/use-toast" // Import toast

interface RecordListItemProps {
  record: Record;
}

// Sub-component for rendering each row with its own state
function RecordListItem({ record }: RecordListItemProps) {
  const { cart, addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // Cart state checks (using discogsReleaseId)
  const cartItem = cart.items?.find((item) => 
    item.discogsReleaseId !== undefined && 
    String(item.discogsReleaseId) === String(record.discogsReleaseId)
  );
  const currentQuantityInCart = cartItem?.quantity || 0;
  const availableQuantity = record.quantity || 0;
  const isOutOfStock = availableQuantity === 0 || record.status !== "FOR_SALE";
  const isAlreadyInCart = cartItem !== undefined && currentQuantityInCart > 0;

  const handleAddToCart = () => {
    if (isAdding || isOutOfStock || isAlreadyInCart) {
      return;
    }
    setIsAdding(true);
    try {
      addToCart(record);
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast({ title: "Error", description: "Could not add item to cart", variant: "destructive" });
      setIsAdding(false);
    }
  };

  const formatDisplay = Array.isArray(record.format) ? record.format.join(", ") : record.format;
  const labelDisplay = record.label + (record.catalogNumber ? ` [${record.catalogNumber}]` : "");

  return (
    <TableRow key={record.id}>
      <TableCell className="p-2">
        <Link href={`/records/${record.id}`}>
          <div className="relative h-16 w-16 overflow-hidden rounded-sm bg-muted flex items-center justify-center text-xs text-muted-foreground">
            {record.coverImage ? (
              <Image 
                src={record.coverImage}
                alt={record.title || 'Record cover'}
                fill
                style={{ objectFit: 'cover' }}
                sizes="64px"
              />
            ) : (
              <span>No Image</span>
            )}
          </div>
        </Link>
      </TableCell>
      <TableCell className="font-medium">
        <Link href={`/records/${record.id}`} className="hover:underline">
          {record.title}
        </Link>
      </TableCell>
      <TableCell>{record.artist}</TableCell>
      <TableCell>{formatDisplay || "Unknown"}</TableCell>
      <TableCell className="max-w-[200px] truncate">{labelDisplay}</TableCell>
      <TableCell className="text-right font-medium">${(record.price || 0).toFixed(2)}</TableCell>
      <TableCell className="text-center">
        {/* Display available quantity */} 
        {availableQuantity > 0 ? availableQuantity : "0"}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAlreadyInCart || isAdding}
          className="w-[85px]" // Give button fixed width for consistency
        >
          <ShoppingCart className="h-3 w-3 mr-1" />
          {isOutOfStock
            ? "Out of Stock"
            : isAdding 
            ? "Adding..." 
            : isAlreadyInCart 
            ? "In Cart"
            : "Add"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface RecordListViewProps {
  records: Record[];
}

export default function RecordListView({ records }: RecordListViewProps) {
  if (!records || records.length === 0) {
    return <p className="text-center text-lg">No records found.</p>;
  }

  const [sortField, setSortField] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortedRecords, setSortedRecords] = useState<Record[]>(records);

  // Effect for initial sorting remains the same
  useEffect(() => {
    const initialSorted = [...records].sort((a, b) => {
      const titleA = a.title || '';
      const titleB = b.title || '';
      return titleA.localeCompare(titleB);
    });
    setSortedRecords(initialSorted);
  }, [records]);

  // Remove top-level handleAddToCart
  // const handleAddToCart = (record: Record) => { ... }

  // handleSort and renderSortIndicator remain the same
  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    const sorted = [...sortedRecords].sort((a, b) => {
      let valueA, valueB;
      if (field === 'price') {
        valueA = a.price || 0;
        valueB = b.price || 0;
      } else if (field === 'quantity') {
        valueA = a.quantity || 0;
        valueB = b.quantity || 0;
      } else {
        valueA = a[field as keyof Record] || '';
        valueB = b[field as keyof Record] || '';
      }
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return newDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return newDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      return 0;
    });
    setSortedRecords(sorted);
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        {/* TableHeader remains the same */}
        <TableHeader>
           <TableRow>
            <TableHead className="w-20"></TableHead>
            <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('title')}>Title{renderSortIndicator('title')}</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('artist')}>Artist{renderSortIndicator('artist')}</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('format')}>Format{renderSortIndicator('format')}</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('label')}>Label{renderSortIndicator('label')}</TableHead>
            <TableHead className="text-right cursor-pointer hover:bg-muted" onClick={() => handleSort('price')}>Price{renderSortIndicator('price')}</TableHead>
            <TableHead className="text-center cursor-pointer hover:bg-muted" onClick={() => handleSort('quantity')}>Qty{renderSortIndicator('quantity')}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Map over records and render the RecordListItem sub-component */}
          {sortedRecords.map((record) => (
            <RecordListItem 
              key={record.id} // Use unique record ID for key
              record={record} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}