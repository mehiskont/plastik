// Define basic placeholder types for nested objects
interface Track {
  position: string;
  type_: string;
  title: string;
  duration: string;
}

interface Video {
  uri: string;
  title: string;
  description: string;
  duration: number;
  embed: boolean;
}

interface ImageInfo {
  type: string;
  uri: string;
  resource_url: string;
  uri150: string;
  width: number;
  height: number;
}

export interface Record {
  id: number | string; // Allow ID to be number or string
  title: string;
  price: number;
  quantity: number;
  quantity_available?: number; // Add quantity available (maps from num_for_sale?)
  status: string; // Added: Status field from API
  catalogNumber?: string; // Added: Optional catalog number
  condition?: string;
  coverImage?: string; // Changed to camelCase
  artist?: string;
  format?: string | string[]; // Updated: Format can be string or array
  label?: string;
  weight?: number; // Added: Optional weight for cart/shipping
  discogsReleaseId?: number | string; // Add Discogs ID explicitly if not already there
  discogsListingId?: number | string;
  thumb?: string; // Added: Thumbnail URL from Discogs response
  country?: string; // Add from API response
  released?: string; // Add from API response
  styles?: string[]; // Add from API response
  tracks?: Track[]; // Add from API response (maps from tracklist?)
  videos?: Video[]; // Add from API response
  images?: ImageInfo[]; // Added: Images array from Discogs response
  released_formatted?: string; // Added: Formatted release date from API
  // Add any other fields returned by the external API's /api/records endpoint that the frontend needs
} 