// Utility script to force-delete a Discogs listing
// Run with: node scripts/force-delete-listing.js <listing_id>
// Example: node scripts/force-delete-listing.js 3478567482

require('dotenv').config();

// Get listing ID from command line argument
const listingId = process.argv[2];

if (!listingId) {
  console.error("Error: No listing ID provided");
  console.log("Usage: node scripts/force-delete-listing.js <listing_id>");
  process.exit(1);
}

async function forceDeleteListing(id) {
  console.log(`Attempting to force-delete Discogs listing ${id}...`);
  
  const baseUrl = "https://api.discogs.com";
  const token = process.env.DISCOGS_API_TOKEN;
  
  if (!token) {
    console.error("Error: Missing DISCOGS_API_TOKEN in environment variables");
    process.exit(1);
  }
  
  try {
    // First check if listing exists
    console.log(`Checking if listing ${id} exists...`);
    
    const checkResponse = await fetch(`${baseUrl}/marketplace/listings/${id}`, {
      headers: {
        'Authorization': `Discogs token=${token}`,
        'User-Agent': 'RecordStore/1.0'
      }
    });
    
    if (checkResponse.status === 404) {
      console.log(`✅ Listing ${id} already deleted (not found in Discogs)`);
      return true;
    }
    
    if (!checkResponse.ok) {
      console.error(`Error checking listing: ${checkResponse.status} ${checkResponse.statusText}`);
      const errorText = await checkResponse.text();
      console.error(`Response: ${errorText}`);
      return false;
    }
    
    const listing = await checkResponse.json();
    console.log(`Found listing: "${listing.release.description}" priced at ${listing.price.value} ${listing.price.currency}`);
    
    // Now delete it
    console.log(`Deleting listing ${id}...`);
    
    const deleteResponse = await fetch(`${baseUrl}/marketplace/listings/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Discogs token=${token}`,
        'User-Agent': 'RecordStore/1.0'
      }
    });
    
    if (deleteResponse.status === 204 || deleteResponse.ok) {
      console.log(`✅ Successfully deleted listing ${id}`);
      return true;
    } else {
      console.error(`Failed to delete listing: ${deleteResponse.status} ${deleteResponse.statusText}`);
      const errorText = await deleteResponse.text();
      console.error(`Response: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
}

// Execute the function
forceDeleteListing(listingId)
  .then(success => {
    if (success) {
      console.log(`\nOperation completed successfully. Listing ${listingId} has been deleted.`);
    } else {
      console.error(`\nOperation failed. Listing ${listingId} could not be deleted.`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });