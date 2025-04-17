"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Order {
  id: string
  createdAt: Date
  status: string
  total: number
}

interface OrderListProps {
  orders: Order[]
}

export function OrderList({ orders }: OrderListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const [prevOrdersLength, setPrevOrdersLength] = useState(orders.length)
  
  // Reset to page 1 if total number of orders has changed significantly
  useEffect(() => {
    // If we just loaded the first orders
    if (prevOrdersLength === 0 && orders.length > 0) {
      setCurrentPage(1)
    }
    
    // If orders length changes by more than 5 items, reset to page 1
    // This catches cases like filtering or major data changes
    const ordersDiff = Math.abs(orders.length - prevOrdersLength)
    if (ordersDiff > 5) {
      setCurrentPage(1)
    }
    
    setPrevOrdersLength(orders.length)
  }, [orders.length, prevOrdersLength])
  
  // Status badge variants
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "paid":
        return "info";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  }
  
  // Format order ID to be shorter and more readable
  const formatOrderId = (id: string) => {
    return id.substring(0, 8);
  }
  
  // Calculate pagination values
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, orders.length)
  const currentOrders = orders.slice(startIndex, endIndex)
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of the table
    document.querySelector('.rounded-md.border')?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    
    if (totalPages <= 7) {
      // Show all pages if there are 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Complex logic for many pages
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1)
        pageNumbers.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        // In the middle
        pageNumbers.push(1)
        pageNumbers.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      }
    }
    
    return pageNumbers
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/dashboard/orders/${order.id}`} className="font-medium hover:underline">
                    {formatOrderId(order.id)}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{endIndex} of {orders.length} orders
          </div>
          
          <Pagination className="w-full sm:w-auto justify-center sm:justify-end">
            <PaginationContent className="bg-card rounded-md border shadow-sm">
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(currentPage - 1)
                    }}
                    className="hover:bg-accent hover:text-accent-foreground"
                  />
                </PaginationItem>
              )}
              
              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink 
                      href="#" 
                      isActive={page === currentPage}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(page as number)
                      }}
                      className={page === currentPage ? "bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground font-semibold" : "hover:bg-accent hover:text-accent-foreground"}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(currentPage + 1)
                    }}
                    className="hover:bg-accent hover:text-accent-foreground"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

