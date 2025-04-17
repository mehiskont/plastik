import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { log } from '@/lib/logger'
import { useCart } from '@/contexts/cart-context'

interface MergeState {
    isLoading: boolean;
    isComplete: boolean;
    error: string | null;
}

/**
 * Hook for handling cart merging after login by sending localStorage cart to API.
 * @returns {MergeState} Cart merging state
 */
export function useCartMerge(): MergeState {
  const { data: session, status } = useSession()
  // Import fetchCart from context instead of addToCart/clearCart
  const { fetchCart } = useCart()
  const [mergeState, setMergeState] = useState<MergeState>({
    isLoading: false,
    isComplete: false,
    error: null
  })

  useEffect(() => {
    // Trigger merge only once upon successful authentication when not already completed/loading
    const isNewLogin = status === 'authenticated' && !mergeState.isComplete && !mergeState.isLoading;

    if (isNewLogin) {
      const mergeCart = async () => {
        log('useCartMerge: Detected new login, attempting merge.', { userId: session?.user?.id }, 'info');
        setMergeState((prev: MergeState) => ({ ...prev, isLoading: true }));

        try {
          // Get items ONLY from localStorage backup (saved on logout)
          const backupCartData = localStorage.getItem('plastik-cart-logout-backup');
          let guestCartItems = [];

          if (backupCartData) {
            try {
              const parsedBackup = JSON.parse(backupCartData);
              // Ensure items exist and is an array
              if (parsedBackup && Array.isArray(parsedBackup.items) && parsedBackup.items.length > 0) {
                guestCartItems = parsedBackup.items;
                log('useCartMerge: Found items in localStorage backup.', { itemCount: guestCartItems.length, userId: session?.user?.id }, 'info');
              } else {
                  log('useCartMerge: localStorage backup found but empty or invalid format.', { userId: session?.user?.id }, 'info');
              }
            } catch (e: any) {
              log('useCartMerge: Error parsing localStorage backup data.', { error: e.message, userId: session?.user?.id }, 'error');
              // Don't proceed with merge if parsing failed
              setMergeState({ isLoading: false, isComplete: true, error: "Failed to read guest cart data." });
              // Fetch the server cart state anyway to ensure user sees something
              await fetchCart();
              return;
            }
          }

          // If no items found in backup, there's nothing to merge from the guest session
          if (guestCartItems.length === 0) {
            log('useCartMerge: No guest items found in backup localStorage to merge.', { userId: session?.user?.id }, 'info');
            setMergeState({ isLoading: false, isComplete: true, error: null });
            // Fetch the current server cart state
            await fetchCart();
            return;
          }

          // Items found in backup, proceed to merge via API proxy
          log('useCartMerge: Merging guest cart items via API proxy.', { itemCount: guestCartItems.length, userId: session?.user?.id }, 'info');

          const response = await fetch('/api/cart-proxy?target=cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // API proxy will add auth context (cookie/token)
            body: JSON.stringify({ guestCartItems }), // Send items under expected key
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API merge failed (${response.status}): ${errorText}`);
          }

          // Merge request sent successfully (API handles actual merge)
          log('useCartMerge: Merge request successful.', { userId: session?.user?.id }, 'info');

          // Clear localStorage backup AFTER successful merge request
          localStorage.removeItem('plastik-cart-logout-backup');
          localStorage.removeItem('cart'); // Also clear the regular cart key

          setMergeState({ isLoading: false, isComplete: true, error: null });

          // IMPORTANT: Fetch the updated cart state from the server AFTER merge attempt
          log('useCartMerge: Fetching updated cart state post-merge.', { userId: session?.user?.id }, 'info');
          await fetchCart();

        } catch (error: any) {
          log('useCartMerge: Error during merge process.', { error: error.message, userId: session?.user?.id }, 'error');
          setMergeState({ isLoading: false, isComplete: true, error: `Merge failed: ${error.message}` });
          // Still try to fetch the cart state even if merge failed
          await fetchCart();
        }
      };

      mergeCart();
    } else if (status === 'unauthenticated') {
      // Reset merge state if user logs out
      setMergeState({ isLoading: false, isComplete: false, error: null }); 
    } 

  // Dependencies: status triggers check, session for userId, mergeState to prevent re-runs, fetchCart function stability
  }, [status, session, mergeState.isComplete, mergeState.isLoading, fetchCart]);

  return mergeState;
}