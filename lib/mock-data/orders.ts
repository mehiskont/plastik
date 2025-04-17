// Mock data for when the database is unavailable

// Test user orders
export const mockOrders = [
  {
    id: "mock-order-1",
    userId: "temp-user-id-123",
    status: "completed",
    total: 79.98,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    shippingAddress: {
      firstName: "Test",
      lastName: "User",
      address: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103",
      country: "United States",
      email: "test@example.com"
    },
    items: [
      {
        id: "mock-item-1",
        orderId: "mock-order-1",
        discogsId: "1234567",
        title: "The Beatles - Abbey Road",
        price: 39.99,
        quantity: 1,
        condition: "Very Good Plus (VG+)"
      },
      {
        id: "mock-item-2",
        orderId: "mock-order-1",
        discogsId: "7654321",
        title: "Pink Floyd - Dark Side of the Moon",
        price: 39.99,
        quantity: 1,
        condition: "Near Mint (NM)"
      }
    ]
  },
  {
    id: "mock-order-2",
    userId: "temp-user-id-123",
    status: "processing",
    total: 24.99,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    shippingAddress: {
      firstName: "Test",
      lastName: "User",
      address: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103",
      country: "United States",
      email: "test@example.com"
    },
    items: [
      {
        id: "mock-item-3",
        orderId: "mock-order-2",
        discogsId: "9876543",
        title: "Nirvana - Nevermind",
        price: 24.99,
        quantity: 1,
        condition: "Mint (M)"
      }
    ]
  }
];

// Admin user orders - more comprehensive list for testing
export const adminMockOrders = [
  {
    id: "admin-order-1",
    userId: "admin-user-id-456",
    status: "completed",
    total: 125.50,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    updatedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    shippingAddress: {
      firstName: "Admin",
      lastName: "User",
      address: "456 Admin Avenue",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States",
      email: "admin@example.com"
    },
    items: [
      {
        id: "admin-item-1",
        orderId: "admin-order-1",
        discogsId: "11111",
        title: "Rare Collection Vol 1",
        price: 75.00,
        quantity: 1,
        condition: "Mint (M)"
      },
      {
        id: "admin-item-2",
        orderId: "admin-order-1",
        discogsId: "22222",
        title: "Limited Edition EP",
        price: 50.50,
        quantity: 1,
        condition: "Near Mint (NM)"
      }
    ]
  },
  {
    id: "admin-order-2",
    userId: "admin-user-id-456",
    status: "shipped",
    total: 89.97,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    shippingAddress: {
      firstName: "Admin",
      lastName: "User",
      address: "456 Admin Avenue",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States",
      email: "admin@example.com"
    },
    items: [
      {
        id: "admin-item-3",
        orderId: "admin-order-2",
        discogsId: "33333",
        title: "Vintage 70s Collection",
        price: 29.99,
        quantity: 3,
        condition: "Very Good Plus (VG+)"
      }
    ]
  },
  {
    id: "admin-order-3",
    userId: "admin-user-id-456",
    status: "processing",
    total: 150.00,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    shippingAddress: {
      firstName: "Admin",
      lastName: "User",
      address: "456 Admin Avenue",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States",
      email: "admin@example.com"
    },
    items: [
      {
        id: "admin-item-4",
        orderId: "admin-order-3",
        discogsId: "44444",
        title: "Super Deluxe Box Set",
        price: 150.00,
        quantity: 1,
        condition: "Sealed"
      }
    ]
  }
];

// Function to get mock orders for a specific user ID
export function getMockOrdersForUser(userId) {
  if (userId === "temp-user-id-123") {
    return mockOrders;
  } else if (userId === "admin-user-id-456") {
    return adminMockOrders;
  } else {
    // For any other user ID, return empty array
    return [];
  }
}