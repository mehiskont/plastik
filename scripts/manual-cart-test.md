# Manual Cart Persistence Test

## Background
This test verifies that the cart persistence functionality is working correctly after the recent implementation changes to store cart items in the database for logged-in users.

## Test Flow

### 1. Test User Login and Cart Loading
1. Open the application in a browser
2. Log in with a test user account
3. Verify the browser console shows "Loading cart from database" logs
4. Check the Network tab for a GET request to `/api/cart-merge?userId=...&fetch=true`
5. If the user has existing cart items, verify they are loaded into the cart

### 2. Test Adding Items to Cart
1. Navigate to the records page
2. Click "Add to Cart" for a record
3. Verify the browser console shows the item was added to the cart
4. Check the Network tab for a POST request to `/api/cart-merge` with the cart data
5. Verify the response is successful (200 OK)

### 3. Test Updating Cart Items
1. Open the cart
2. Change the quantity of an item in the cart
3. Verify the browser console shows the update operation
4. Check the Network tab for a POST request to `/api/cart-merge` with the updated cart data
5. Verify the response is successful (200 OK)

### 4. Test Removing Items from Cart
1. Open the cart
2. Remove an item from the cart
3. Verify the browser console shows the removal operation
4. Check the Network tab for a POST request to `/api/cart-merge` with the updated cart data
5. Verify the response is successful (200 OK)

### 5. Test Persistence Across Sessions
1. Add several items to the cart
2. Log out from the application
3. Log back in with the same user
4. Verify the cart items persist after logging back in
5. Check the browser console for cart loading messages

## Expected Results
- Cart items should be immediately saved to the database for logged-in users
- Cart operations (add, update, remove) should trigger database synchronization
- Cart items should persist across login/logout cycles
- Error handling should work correctly when database operations fail

## Console Output Verification
Look for these messages in the browser console:
- "Loading cart from database" when logging in
- "Failed to save cart to database: [error]" only if there's an actual database error
- Network requests to `/api/cart-merge` for all cart operations

## Database Verification (if you have access)
You can verify the cart data is stored correctly in the database using these queries:

```sql
-- Find a user's cart
SELECT * FROM carts WHERE userId = '[user-id]';

-- View cart items for the cart
SELECT * FROM cart_items WHERE cartId = '[cart-id]';
```

## Troubleshooting
If cart items aren't persisting:
1. Check browser console for errors
2. Verify the user is properly authenticated
3. Check network requests for failed API calls
4. Ensure the database is accessible and functioning