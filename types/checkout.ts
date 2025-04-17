export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
  shippingAddress: string;
  shippingApartment: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingState: string;
  shippingCountry: string;
  shippingAddressSameAsBilling: boolean;
  localPickup: boolean;
  acceptTerms: boolean;
  subscribe: boolean;
  taxDetails: boolean;
  organization: string;
  taxId: string;
} 