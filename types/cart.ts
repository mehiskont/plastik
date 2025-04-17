import type { Record } from "./record";

export interface CartItem extends Record {
  id: number | string // Ensure CartItem ID also allows string
  quantity: number
  stockQuantity: number // Maximum available quantity for this item
  weight?: number // Make weight optional if it might not always be present
}

