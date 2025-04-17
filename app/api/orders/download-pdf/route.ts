import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { log } from '@/lib/logger';
import { formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET(request: NextRequest) {
  if (!EXTERNAL_API_URL) {
     log("External API URL not configured", "error");
     return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get order ID from query params
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');

    if (!orderId) {
      return new NextResponse(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let order;
    try {
      // Fetch order data from external API
      // TODO: Add appropriate Authorization header using session token if required by the external API
      const response = await fetch(`${EXTERNAL_API_URL}/api/orders/${orderId}`, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
            // Example Authorization header (adjust based on your auth strategy):
            // 'Authorization': `Bearer ${session.accessToken}`
         }
      });

      if (response.status === 404) {
        log(`Order not found in external API: ${orderId}`, "warn");
        return new NextResponse(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!response.ok) {
         const errorBody = await response.text();
         log(`Failed to fetch order ${orderId} from external API: ${response.status} - ${errorBody}`, "error");
         throw new Error(`Failed to fetch order: ${response.statusText}`);
      }

      order = await response.json();
      // TODO: Validate the structure of 'order' fetched from the API
      // Ensure it matches the structure expected by generateOrderPdf
      log(`Fetched order ${orderId} from external API successfully.`);

    } catch (fetchError) {
       log(`Error fetching order ${orderId} from external API: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`, "error");
       return new NextResponse(JSON.stringify({ error: 'Failed to retrieve order details' }), {
          status: 500, // Internal Server Error or appropriate status
          headers: { 'Content-Type': 'application/json' }
       });
    }

    // Ensure order data was actually fetched and parsed
    if (!order) {
      // This case should ideally be caught by the fetch error handling, but as a safeguard:
      log(`Order data object is unexpectedly null/undefined after fetch for order ID: ${orderId}`, "error");
      return new NextResponse(JSON.stringify({ error: 'Failed to process order data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }


    // Check if order belongs to the current user (using userId from fetched order)
    // Important: Ensure the external API includes userId in the response
    if (order.userId !== session.user.id) {
      log(`Unauthorized PDF download attempt: ${orderId}, user: ${session.user.id}`, "warn");
      return new NextResponse(JSON.stringify({ error: 'You don\'t have permission to access this order' }), {
        status: 403, // Forbidden
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate PDF
    const pdf = generateOrderPdf(order); // Use the order fetched from API

    // Return PDF document
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="order-${orderId}.pdf"`
      }
    });
  } catch (error) {
    log(`Error generating PDF for order: ${error instanceof Error ? error.message : String(error)}`, 'error');
    // Avoid leaking specific error details in production
    return new NextResponse(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateOrderPdf(order: any) {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Function to format currency
  const formatCurrency = (amount: number | string | null | undefined): string => {
     const num = Number(amount); // Convert potential string amounts
     return !isNaN(num) ? `$${num.toFixed(2)}` : '$0.00';
  };
  
  // Detect pickup or delivery
  const isLocalPickup = order.billingAddress?.localPickup === true || order.billingAddress?.localPickup === "true";
  
  // Calculate subtotal and shipping
  const subtotal = order.items?.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0) || 0;
  const shipping = (Number(order.total || 0)) - subtotal;

  // Add header
  doc.setFontSize(20);
  doc.text('Plastik Records', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Order Receipt', 105, 30, { align: 'center' });
  doc.line(20, 35, 190, 35);
  
  // Add order information
  doc.setFontSize(12);
  doc.text('Order Information', 20, 45);
  doc.setFontSize(10);
  doc.text(`Order ID: ${String(order.id ?? 'N/A')}`, 20, 55);
  doc.text(`Date: ${order.createdAt ? formatDate(order.createdAt) : 'N/A'}`, 20, 62);
  doc.text(`Status: ${String(order.status ?? 'N/A')}`, 20, 69);
  
  // Add shipping information
  doc.setFontSize(12);
  doc.text(isLocalPickup ? 'Delivery Method' : 'Shipping Address', 120, 45);
  doc.setFontSize(10);
  
  if (isLocalPickup) {
    doc.text('Local pickup from store', 120, 55);
    doc.text('Please bring your ID when picking up your order.', 120, 62);
    doc.text('Location: Plastik Records, 5 Main Street, Tallinn, Estonia', 120, 69);
    doc.text('Store Hours: Monday-Friday 10am-7pm, Saturday 11am-5pm', 120, 76);
  } else if (order.shippingAddress) {
    const sa = order.shippingAddress;
    const shippingLines: string[] = [];
    if (sa.name) shippingLines.push(String(sa.name));
    if (sa.email) shippingLines.push(String(sa.email));
    // Combine address lines safely
    const addressLine1 = sa.address?.line1 ?? sa.line1 ?? sa.address ?? ''; // Check multiple common variations
    const addressLine2 = sa.address?.line2 ?? sa.line2 ?? '';
    if (addressLine1) shippingLines.push(String(addressLine1));
    if (addressLine2) shippingLines.push(String(addressLine2)); // Add line 2 if present
    const cityStateZip = [sa.address?.city ?? sa.city, sa.address?.state ?? sa.state, sa.address?.postal_code ?? sa.postal_code]
      .filter(Boolean) // Remove null/undefined/empty strings
      .join(', ');
    if (cityStateZip) shippingLines.push(String(cityStateZip));
    const country = sa.address?.country ?? sa.country;
    if (country) shippingLines.push(String(country));

    if (shippingLines.length > 0) {
      let yPos = 55;
      shippingLines.forEach(line => {
        doc.text(line, 120, yPos);
        yPos += 7;
      });
    } else {
      doc.text('No shipping address available', 120, 55);
    }
  } else {
    doc.text('No shipping address available', 120, 55);
  }
  
  // Add order items table
  doc.setFontSize(12);
  doc.text('Order Items', 20, 90);
  
  // Prepare table data
  const tableHeaders = [['Item', 'Condition', 'Price', 'Qty', 'Subtotal']];
  const tableData = order.items?.map((item: any) => [
    String(item.title || 'N/A'),
    String(item.condition || 'N/A'),
    formatCurrency(item.price),
    String(item.quantity || 0),
    formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))
  ]) || []; // Default to empty array if items is null/undefined
  
  // Add table
  if (tableData.length > 0) {
     autoTable(doc, {
       head: tableHeaders,
       body: tableData,
       startY: 95,
       theme: 'grid',
       headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
       styles: { fontSize: 9 },
       columnStyles: {
         0: { cellWidth: 70 },
         2: { halign: 'right' },
         3: { halign: 'right' },
         4: { halign: 'right' }
       }
     });
  } else {
     doc.text("No items found in order.", 20, 95);
  }
  
  // Get the final Y position after the table
  // Need to handle case where table wasn't drawn or finalY is not a number
  let finalY = 105; // Default start position if no table
  if (tableData.length > 0 && (doc as any).lastAutoTable) {
     const tableEndY = (doc as any).lastAutoTable.finalY;
     if (typeof tableEndY === 'number') {
        finalY = tableEndY + 10;
     } else {
         // Fallback if finalY is not a number, log a warning
         log("jspdf-autotable finalY was not a number, using default positioning.", "warn");
         // Keep finalY = 105 or adjust slightly if needed
         finalY = (typeof (doc as any).lastAutoTable?.startY === 'number' ? (doc as any).lastAutoTable.startY : 95) + 20; // Fallback positioning relative to table startY
     }
  }
  
  // Add order totals
  doc.setFontSize(10);
  doc.text('Subtotal:', 140, finalY);
  doc.text(formatCurrency(subtotal), 190, finalY, { align: 'right' });
  
  doc.text('Shipping:', 140, finalY + 7);
  if (isLocalPickup) {
    doc.setTextColor(34, 197, 94); // Green color for free shipping
    doc.text('Free (Local pick-up)', 190, finalY + 7, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
  } else {
    doc.text(formatCurrency(shipping), 190, finalY + 7, { align: 'right' });
  }
  
  doc.line(140, finalY + 10, 190, finalY + 10);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Total:', 140, finalY + 17);
  doc.text(formatCurrency(order.total), 190, finalY + 17, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  // Add tax details if applicable (safe access)
  if (order.billingAddress?.taxDetails === true || order.billingAddress?.taxDetails === "true") {
    doc.setFontSize(12);
    doc.text('Tax Details', 20, finalY + 30);
    doc.setFontSize(10);
    // Access organization/taxId safely and construct strings separately
    const org = order.billingAddress?.organization;
    const taxId = order.billingAddress?.taxId;
    const orgText = `Organization: ${String(org ?? 'N/A')}`;
    const taxIdText = `Tax ID: ${String(taxId ?? 'N/A')}`;
    doc.text(orgText, 20, finalY + 37);
    doc.text(taxIdText, 20, finalY + 44);
  }
  
  // Add footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your order!', 105, pageHeight - 30, { align: 'center' });
  doc.text('If you have any questions, please contact us at support@plastikrecords.com', 105, pageHeight - 25, { align: 'center' });
  doc.text(`© ${new Date().getFullYear()} Plastik Records. All rights reserved.`, 105, pageHeight - 20, { align: 'center' });
  
  // Return the generated PDF
  return doc.output('arraybuffer');
}