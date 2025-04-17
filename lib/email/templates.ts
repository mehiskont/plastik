import { OrderDetails } from "@/types/order"

export function getOrderConfirmationEmail(order: OrderDetails): string {
  // Helper function to format address safely
  const formatAddress = (address: any) => {
    if (!address) return '';
    
    // Handle various address formats that might come from Stripe
    const name = address.name || '';
    const line1 = address.line1 || address.address?.line1 || address.address || '';
    const line2 = address.line2 || address.address?.line2 || '';
    const city = address.city || address.address?.city || '';
    const state = address.state || address.address?.state || '';
    const postalCode = address.postal_code || address.address?.postal_code || address.postalCode || '';
    const country = address.country || address.address?.country || '';
    
    return `
      ${name}<br>
      ${line1}<br>
      ${line2 ? `${line2}<br>` : ''}
      ${city}${state ? `, ${state}` : ''} ${postalCode}<br>
      ${country}
    `;
  };
  
  // Get tax details and shipping preferences from metadata if available
  const taxDetails = order.taxDetails === true || order.taxDetails === "true";
  const organization = order.organization || '';
  const taxId = order.taxId || '';
  const localPickup = order.localPickup === true || order.localPickup === "true";
  
  // Calculate subtotal
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Assume shipping cost is included in the total
  const shippingCost = parseFloat((order.total - subtotal).toFixed(2)) || 2.99;
  
  // Determine if shipping is to Estonia for special handling
  const isEstonia = order.shippingAddress?.country && 
    (order.shippingAddress.country.toLowerCase() === 'estonia' || 
     order.shippingAddress.country.toLowerCase() === 'eesti' || 
     order.shippingAddress.country.toLowerCase() === 'ee');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: sans-serif; line-height: 1.5; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
          .items { margin: 20px 0; }
          .item { margin: 15px 0; padding: 15px; background-color: #f5f5f5; border-radius: 4px; }
          .item-row { display: flex; gap: 15px; margin-bottom: 15px; }
          .item-image { width: 80px; height: 80px; flex-shrink: 0; border-radius: 4px; overflow: hidden; }
          .item-details { flex: 1; }
          .item-title { font-weight: bold; margin-bottom: 5px; }
          .item-meta { font-size: 14px; color: #666; margin-bottom: 5px; }
          .item-price { text-align: right; font-weight: bold; }
          .summary { background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin-top: 30px; }
          .summary-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .summary-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          .shipping { background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; }
          h1 { color: #333; }
          h2 { font-size: 18px; color: #555; margin-top: 25px; }
          h3 { font-size: 16px; margin-bottom: 15px; }
          a { color: #4a6ee0; text-decoration: none; }
          .logo { font-size: 24px; font-weight: bold; letter-spacing: 1px; margin-bottom: 15px; }
          .shipping-method { font-size: 14px; color: #666; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">PLASTIK RECORDS</div>
            <h1>Thank you for your order!</h1>
            <p>Order #${order.orderId}</p>
            <p>Order Date: ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
          
          <div class="items">
            <h3>Order Items:</h3>
            
            <div class="item">
              ${order.items
                .map(
                  (item) => `
                <div class="item-row">
                  <div class="item-image">
                    <img src="https://plastik.komeh.tech${item.cover_image || "/placeholder.svg"}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                  <div class="item-details">
                    <div class="item-title">${item.title}</div>
                    <div class="item-meta">
                      ${item.condition ? `Media Condition: ${item.condition}<br>` : ""}
                      ${item.sleeveCondition ? `Sleeve Condition: ${item.sleeveCondition}<br>` : "Sleeve Condition: Generic<br>"}
                      ${item.format ? `Format: ${item.format}<br>` : ""}
                      ${item.artist ? `Artist: ${item.artist}<br>` : ""}
                      ${item.label ? `Label: ${item.label}<br>` : ""}
                      Quantity: ${item.quantity}
                    </div>
                  </div>
                  <div class="item-price">
                    $${item.price.toFixed(2)}
                  </div>
                </div>
              `,
                )
                .join("<hr style='border: 0; border-top: 1px dashed #ccc; margin: 10px 0;'>")}
            </div>
          </div>
          
          <div class="summary">
            <h3>Order Summary:</h3>
            <div class="summary-row">
              <span>Items:</span>
              <span>${order.items.length}</span>
            </div>
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              ${localPickup ? `
              <span>Shipping:</span>
              <span style="color: #22c55e; font-weight: 500;">Free (Local pick-up)</span>
              ` : `
              <span>Shipping${order.shippingAddress?.country ? ` (to ${order.shippingAddress.country})` : ''}:</span>
              <span>$${shippingCost.toFixed(2)}</span>
              ${isEstonia ? `<span class="shipping-method">(Itella SmartPost)</span>` : ''}
              `}
            </div>
            <div class="summary-total">
              <span>Total:</span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="shipping">
            ${localPickup ? `
            <h3>Delivery Method:</h3>
            <p><strong>Local pick-up from store</strong></p>
            <p>Please bring your ID when picking up your order.</p>
            <p><strong>Pick-up Location:</strong> Plastik Records, 5 Main Street, Tallinn, Estonia</p>
            <p><strong>Store Hours:</strong> Monday-Friday 10am-7pm, Saturday 11am-5pm</p>
            ` : `
            <h3>Shipping Address:</h3>
            <p>${formatAddress(order.shippingAddress)}</p>
            <p><strong>Estimated Delivery:</strong> 5-7 business days</p>
            `}
          </div>
          
          ${taxDetails ? `
          <div class="shipping" style="margin-top: 20px; background-color: #f0f7ff; border-left: 3px solid #3b82f6;">
            <h3>Tax Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #4b5563; width: 120px;">Organization:</td>
                <td style="padding: 8px 0; font-weight: 500;">${organization}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4b5563; width: 120px;">Tax ID:</td>
                <td style="padding: 8px 0; font-weight: 500;">${taxId}</td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for shopping with Plastik Records!</p>
            <p>If you have any questions about your order, please contact our support team at <a href="mailto:support@plastikrecords.com">support@plastikrecords.com</a>.</p>
            <p>&copy; ${new Date().getFullYear()} Plastik Records. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}