export interface OrderItem {
  title: string
  quantity: number
  price: number
  condition?: string
}

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
}

export interface OrderDetails {
  orderId: string
  items: OrderItem[]
  total: number
  shippingAddress: ShippingAddress
  taxDetails?: boolean
  organization?: string
  taxId?: string
  localPickup?: boolean
}

