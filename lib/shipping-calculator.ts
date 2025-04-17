import countryList from "react-select-country-list"
/**
 * Shipping calculator utility functions
 * Used to calculate shipping costs based on weight and destination
 */

// Define shipping rate tiers based on weight (in grams) and destination
const SHIPPING_RATES = {
  ESTONIA: {
    ITELLA_SMARTPOST: 2.99,
    LOCAL_PICKUP: 0,
  },
  EUROPE: [
    { maxWeight: 2000, cost: 15.0 },
    { maxWeight: 3000, cost: 18.0 },
    { maxWeight: 5000, cost: 24.0 },
    { maxWeight: Number.POSITIVE_INFINITY, cost: 29.0 },
  ],
  REST_OF_WORLD: [
    { maxWeight: 3000, cost: 25.0 },
    { maxWeight: 5000, cost: 30.0 },
    { maxWeight: Number.POSITIVE_INFINITY, cost: 55.0 },
  ],
}

// Debug shipping rates
console.log("Shipping rates configuration:", JSON.stringify(SHIPPING_RATES, null, 2));

// List of European country codes (you may need to expand this list)
const EUROPEAN_COUNTRIES = countryList()
  .getData()
  .filter((country) =>
    [
      "Austria",
      "Belgium",
      "Bulgaria",
      "Croatia",
      "Cyprus",
      "Czech Republic",
      "Denmark",
      "Finland",
      "France",
      "Germany",
      "Greece",
      "Hungary",
      "Ireland",
      "Italy",
      "Latvia",
      "Lithuania",
      "Luxembourg",
      "Malta",
      "Netherlands",
      "Norway",
      "Poland",
      "Portugal",
      "Romania",
      "Slovakia",
      "Slovenia",
      "Spain",
      "Sweden",
      "Switzerland",
      "United Kingdom",
    ].includes(country.label),
  )
  .map((country) => country.label)

// Log European countries for debugging
console.log("European countries list:", JSON.stringify(EUROPEAN_COUNTRIES, null, 2));

/**
 * Calculate shipping cost based on total weight and destination country
 *
 * @param totalWeight - Total weight in grams
 * @param destinationCountry - Country code or name
 * @param shippingMethod - Shipping method (for Estonia)
 * @returns Calculated shipping cost
 */
export function calculateShippingCost(
  totalWeight: number,
  destinationCountry: string,
  shippingMethod: "ITELLA_SMARTPOST" | "LOCAL_PICKUP" = "ITELLA_SMARTPOST",
): number {
  console.log(`Calculating shipping for weight: ${totalWeight}g to country: ${destinationCountry}`);
  
  // Default to a minimum weight if none is provided
  if (!totalWeight || totalWeight <= 0) {
    totalWeight = 180; // Default weight of one record
    console.log(`Using default weight of ${totalWeight}g`);
  }
  
  // Handle Estonia separately - always use the flat rate regardless of weight
  const countryLower = destinationCountry.toLowerCase();
  if (countryLower === "estonia" || countryLower === "eesti") {
    const shippingCost = SHIPPING_RATES.ESTONIA[shippingMethod];
    console.log(`Estonia shipping cost (${shippingMethod}): €${shippingCost} (fixed rate)`);
    return shippingCost;
  }
  
  // Standardize country name for easier matching
  const countryNormalized = destinationCountry.trim();

  // Enhanced country detection
  // First try direct match
  let isEurope = EUROPEAN_COUNTRIES.some(country => 
    country.toLowerCase() === countryNormalized.toLowerCase()
  );
  
  // If not found by name, look for country code (assume 2-letter codes are country codes)
  if (!isEurope && countryNormalized.length === 2) {
    // Map of common EU country codes
    const euCountryCodes = {
      'at': true, 'be': true, 'bg': true, 'hr': true, 'cy': true, 'cz': true, 
      'dk': true, 'fi': true, 'fr': true, 'de': true, 'gr': true, 'hu': true, 
      'ie': true, 'it': true, 'lv': true, 'lt': true, 'lu': true, 'mt': true, 
      'nl': true, 'no': true, 'pl': true, 'pt': true, 'ro': true, 'sk': true, 
      'si': true, 'es': true, 'se': true, 'ch': true, 'gb': true, 'uk': true
    };
    
    isEurope = !!euCountryCodes[countryNormalized.toLowerCase()];
    console.log(`Checking country code ${countryNormalized} against EU codes: ${isEurope}`);
  }
  
  console.log(`Country ${destinationCountry} is in Europe: ${isEurope}`);
  
  const rates = isEurope ? SHIPPING_RATES.EUROPE : SHIPPING_RATES.REST_OF_WORLD;
  console.log(`Using shipping rates for ${isEurope ? 'Europe' : 'Rest of World'}`, rates);

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

/**
 * Calculate total weight for a collection of items
 *
 * @param items - Array of items with weight and quantity properties
 * @returns Total weight in grams
 */
export function calculateTotalWeight(items: Array<{ weight?: number; quantity: number }>): number {
  const totalWeight = items.reduce((total, item) => {
    // Default to 180g per record if weight is not specified
    const itemWeight = item.weight || 180;
    const itemTotalWeight = itemWeight * item.quantity;
    console.log(`Item weight: ${itemWeight}g × ${item.quantity} = ${itemTotalWeight}g`);
    return total + itemTotalWeight;
  }, 0);
  
  console.log(`Total order weight: ${totalWeight}g`);
  return totalWeight;
}

// Example usage:
// const items = [
//   { weight: 200, quantity: 2 },
//   { weight: 180, quantity: 1 }
// ];
// const totalWeight = calculateTotalWeight(items);
// const shippingCost = calculateShippingCost(totalWeight, 'France'); // For a shipment to France
// console.log(`Shipping cost: €${shippingCost.toFixed(2)}`);

