"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

// Client component to avoid server-side data fetching issues
export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const orderId = params.id;

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/order-details/?id=${orderId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || "Failed to load order details");
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("An unexpected error occurred");
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Status badge variant helper function
  const getStatusVariant = (status: string) => {
    if (!status) return "default";
    
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "paid":
        return "info";
      case "pending":
        return "warning";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Order Details</h2>
          <Button variant="outline" asChild>
            <Link href="/dashboard/orders">Back to Orders</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              <span className="ml-3">Loading order details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle PDF download
  const handleDownloadPdf = async () => {
    try {
      setGeneratingPdf(true);
      const response = await fetch(`/api/orders/download-pdf?id=${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
      
      const blob = await response.blob();
      // Check content type and show error for debugging
      if (blob.type !== 'application/pdf') {
        console.error(`Unexpected content type: ${blob.type}`);
        throw new Error(`Server returned incorrect content type: ${blob.type}`);
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert(`Failed to generate PDF: ${err.message}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Order Details</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadPdf}
            disabled={loading || generatingPdf}
          >
            <Download className="mr-2 h-4 w-4" />
            {generatingPdf ? "Generating..." : "Download PDF"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
      
      {error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>
              We encountered a problem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/dashboard/orders">Back to Orders</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : !order ? (
        <Card>
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
            <CardDescription>
              The requested order could not be found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The order with ID {orderId} does not exist or you don't have permission to view it.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/dashboard/orders">Back to Orders</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Order Summary Card with Order Total */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                Order placed on {formatDate(order.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Order Information</h3>
                  <dl className="grid grid-cols-[100px_1fr] text-sm">
                    <dt className="text-gray-500 dark:text-gray-400">Order ID:</dt>
                    <dd className="font-mono">{order.id}</dd>
                    
                    <dt className="text-gray-500 dark:text-gray-400">Status:</dt>
                    <dd>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </dd>
                    
                    <dt className="text-gray-500 dark:text-gray-400">Date:</dt>
                    <dd>{formatDate(order.createdAt)}</dd>
                  </dl>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">
                      {order.billingAddress?.localPickup === "true" ? "Delivery Method" : "Shipping Address"}
                    </h3>
                    {order.billingAddress?.localPickup === "true" ? (
                      <div className="text-sm">
                         {order.shippingAddress?.name && (
                          <p>{order.shippingAddress.name}</p>
                        )}
                        <p className="font-medium text-green-600">Local pick-up from store</p>
                        <p className="mt-1">Please bring your ID when picking up your order.</p>
                        <p className="mt-2 font-medium">Pick-up Location:</p>
                        <p>Plastik Records, 5 Main Street, Tallinn, Estonia</p>
                        <p className="mt-2 font-medium">Store Hours:</p>
                        <p>Monday-Friday 10am-7pm, Saturday 11am-5pm</p>
                      </div>
                    ) : order.shippingAddress ? (
                      <address className="not-italic text-sm">
                        {order.shippingAddress.name && (
                          <p>{order.shippingAddress.name}</p>
                        )}
                        {order.shippingAddress.email && (
                          <p>{order.shippingAddress.email}</p>
                        )}
                        {order.shippingAddress.address && (
                          <p>{order.shippingAddress.address}</p>
                        )}
                      </address>
                    ) : (
                      <p className="text-sm text-gray-500">No shipping address available</p>
                    )}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
          
          {/* Tax Details Card (shown only if tax details are available) */}
          {order.billingAddress?.taxDetails === "true" && (
            <Card>
              <CardHeader>
                <CardTitle>Tax Details</CardTitle>
                <CardDescription>
                  Information for tax and accounting purposes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-[140px_1fr] gap-1">
                    <span className="text-gray-500 font-medium">Organization:</span>
                    <span>{order.billingAddress.organization}</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-1">
                    <span className="text-gray-500 font-medium">Tax ID:</span>
                    <span>{order.billingAddress.taxId}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Order Items Card with Order Total */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Items included in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.condition || 'N/A'}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex flex-col border-t p-6 space-y-4">
              <div className="flex justify-between w-full">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Subtotal ({order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} items)
                </div>
                <div className="font-medium">
                  ${order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0).toFixed(2)}
                </div>
              </div>
              
              <div className="flex justify-between w-full">
                <div className="text-sm text-gray-500 dark:text-gray-400">Shipping</div>
                {order.billingAddress?.localPickup === "true" ? (
                  <div className="text-green-600 font-medium">Free (Local pick-up)</div>
                ) : (
                  <div>
                    ${(order.total - order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)).toFixed(2)}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between w-full pt-4 border-t">
                <div className="font-medium text-lg">Total</div>
                <div className="font-medium text-lg">${order.total.toFixed(2)}</div>
              </div>
            </CardFooter>
          </Card>
          
        </div>
      )}
    </div>
  );
}