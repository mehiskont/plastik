// Debug script for shipping calculation issues
console.log("================ DEBUG SHIPPING RATES ================");

// Override console.log to add DEBUG prefix for better visibility
const originalConsoleLog = console.log;
console.log = function(...args) {
  originalConsoleLog("[DEBUG]", ...args);
};

// Sample item with weight
const sampleItems = [
  { weight: 180, quantity: 1 }, // Single record
  { weight: 180, quantity: 3 }, // Multiple records
];

// Sample function to calculate total weight
function calculateTotalWeight(items) {
  const totalWeight = items.reduce((total, item) => {
    const itemWeight = item.weight || 180;
    const itemTotalWeight = itemWeight * item.quantity;
    console.log(`Item weight: ${itemWeight}g × ${item.quantity} = ${itemTotalWeight}g`);
    return total + itemTotalWeight;
  }, 0);
  
  console.log(`Total order weight: ${totalWeight}g`);
  return totalWeight;
}

// Sample function to calculate shipping cost
function calculateShippingCost(totalWeight, destinationCountry, shippingMethod = "ITELLA_SMARTPOST") {
  console.log(`Calculating shipping for weight: ${totalWeight}g to country: ${destinationCountry}`);
  
  // Default to a minimum weight if none is provided
  if (!totalWeight || totalWeight <= 0) {
    totalWeight = 180; // Default weight of one record
    console.log(`Using default weight of ${totalWeight}g`);
  }
  
  // Handle Estonia separately - always use the flat rate regardless of weight
  const countryLower = destinationCountry.toLowerCase();
  if (countryLower === "estonia" || countryLower === "eesti") {
    const shippingCost = 2.99; // Fixed rate for Estonia
    console.log(`Estonia shipping cost (${shippingMethod}): €${shippingCost} (fixed rate)`);
    return shippingCost;
  }
  
  // European shipping rate tiers
  const europeRates = [
    { maxWeight: 2000, cost: 15.0 },
    { maxWeight: 3000, cost: 18.0 },
    { maxWeight: 5000, cost: 24.0 },
    { maxWeight: Number.POSITIVE_INFINITY, cost: 29.0 },
  ];
  
  // Rest of world shipping rate tiers
  const rowRates = [
    { maxWeight: 3000, cost: 25.0 },
    { maxWeight: 5000, cost: 30.0 },
    { maxWeight: Number.POSITIVE_INFINITY, cost: 55.0 },
  ];
  
  // For debug testing, assuming European country
  const rates = europeRates;
  
  // Find the appropriate shipping rate based on weight
  for (const rate of rates) {
    if (totalWeight <= rate.maxWeight) {
      console.log(`Selected shipping rate: €${rate.cost} (weight: ${totalWeight}g, max weight: ${rate.maxWeight}g)`);
      return rate.cost;
    }
  }
  
  // If we've reached here, use the highest rate
  const highestRate = rates[rates.length - 1].cost;
  console.log(`Using highest shipping rate: €${highestRate}`);
  return highestRate;
}

// Test different countries and weights
console.log("\nTest 1: Estonia with 1 record:");
const weight1 = calculateTotalWeight([{ weight: 180, quantity: 1 }]);
const cost1 = calculateShippingCost(weight1, "Estonia");
console.log(`Final shipping cost: €${cost1}\n`);

console.log("\nTest 2: Estonia with 5 records:");
const weight2 = calculateTotalWeight([{ weight: 180, quantity: 5 }]);
const cost2 = calculateShippingCost(weight2, "Estonia");
console.log(`Final shipping cost: €${cost2}\n`);

console.log("\nTest 3: Germany with 1 record:");
const weight3 = calculateTotalWeight([{ weight: 180, quantity: 1 }]);
const cost3 = calculateShippingCost(weight3, "Germany");
console.log(`Final shipping cost: €${cost3}\n`);

console.log("\nTest 4: Germany with 15 records (heavy order):");
const weight4 = calculateTotalWeight([{ weight: 180, quantity: 15 }]);
const cost4 = calculateShippingCost(weight4, "Germany");
console.log(`Final shipping cost: €${cost4}\n`);

console.log("================ END DEBUG ================");