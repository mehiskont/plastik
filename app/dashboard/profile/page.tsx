import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { log } from "@/lib/logger"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default async function ProfilePage() {
  // Check all possible authentication methods
  const session = await getServerSession(authOptions)
  let userProfile = null;
  let apiError = false;
  let userId = session?.user?.id;
  let userEmail = session?.user?.email;
  let userName = session?.user?.name;

  // If no NextAuth session, check custom tokens
  if (!userId) {
    const cookieStore = cookies()
    const customToken = cookieStore.get('auth-token')?.value
    const localStorageToken = cookieStore.get('ls-auth-token')?.value
    
    log("Profile page: No NextAuth session, checking custom tokens", { 
      hasCustomToken: !!customToken, 
      hasLocalStorageToken: !!localStorageToken 
    }, "info");
    
    // Verify either token if available
    if (customToken || localStorageToken) {
      try {
        const token = customToken || localStorageToken
        const secret = new TextEncoder().encode(
          process.env.NEXTAUTH_SECRET || 'temporarysecret'
        )
        
        const { payload } = await jwtVerify(token!, secret)
        
        // Extract user info from token
        userId = payload.sub || payload.userId || 'unknown-id';
        userEmail = payload.email as string || null;
        userName = payload.name as string || 'User';
        
        log("Profile page: Authenticated via custom token", { userId, userEmail }, "info");
      } catch (error) {
        log("Profile page: Invalid custom token", { error: String(error) }, "error")
      }
    }
  }

  // Still no valid authentication
  if (!userId) {
    log("Profile page: No valid authentication found.", "warn");
    return (
       <div className="space-y-6 pb-8 pt-6">
         <h2 className="text-3xl font-bold tracking-tight">Your Profile</h2>
         <p>Please log in to view your profile.</p>
       </div>
    );
  }

  if (EXTERNAL_API_URL) {
     try {
       // Prepare headers with authentication if available
       const headers: HeadersInit = {
         'Content-Type': 'application/json',
       };
       
       // Add token to API request if we have a custom token
       const cookieStore = cookies();
       const customToken = cookieStore.get('auth-token')?.value;
       if (customToken) {
         headers['Authorization'] = `Bearer ${customToken}`;
       }
       
       log("Profile page: Fetching user profile from API", { userId, hasToken: !!customToken }, "info");
       
       const response = await fetch(`${EXTERNAL_API_URL}/api/users/me/profile`, {
         method: 'GET',
         headers,
         cache: 'no-store'
       });

       if (!response.ok) {
         const errorBody = await response.text();
         log(`Failed to fetch profile from external API: ${response.status} - ${errorBody}`, "error");
         throw new Error(`API error: ${response.statusText}`);
       }

       const fetchedProfile = await response.json();
       log("User profile data loaded from API:", fetchedProfile);

       userProfile = {
         name: fetchedProfile.name || session.user.name || '',
         email: fetchedProfile.email || session.user.email || '',
         phone: fetchedProfile.phone || '',
         address: fetchedProfile.address || '',
         city: fetchedProfile.city || '',
         state: fetchedProfile.state || '',
         country: fetchedProfile.country || '',
         postalCode: fetchedProfile.postalCode || '',
       };

     } catch (error) {
       log(`Error fetching user profile from external API: ${error instanceof Error ? error.message : String(error)}`, "error");
       apiError = true;
     }
  } else {
     log("External API URL is not configured", "error");
     apiError = true;
  }

  const initialFormData = userProfile || {
     name: userName || '',
     email: userEmail || '',
     phone: '',
     address: '',
     city: '',
     state: '',
     country: '',
     postalCode: '',
  };

  return (
    <div className="space-y-6 pb-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Your Profile</h2>
      
      {apiError ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-6">
          <p className="text-yellow-800 dark:text-yellow-400">
            We're having trouble loading your profile information right now.
          </p>
          <p className="text-yellow-700 dark:text-yellow-500 text-sm mt-2">
            Please try refreshing the page in a few moments.
          </p>
        </div>
      ) : (
        <ProfileForm initialData={initialFormData} />
      )}
    </div>
  )
}

