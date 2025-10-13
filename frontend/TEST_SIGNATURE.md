# Signature Request Troubleshooting Guide

## Issue
MetaMask popup not appearing when requesting signature after wallet connection.

## Fixes Applied

### 1. Enhanced Error Handling in `useAuth.js`
- Added `useConnectorClient` hook to verify wallet connector is ready
- Added explicit check for connector client availability before signing
- Added wait time if connector isn't ready yet
- Improved error logging with error name, code, and message
- Better handling of user rejection and connector errors

### 2. Increased Delay in `ConnectWalletButton.jsx`
- Increased initial delay from 1000ms to 2000ms before authentication
- This ensures MetaMask extension is fully loaded and ready
- Added better error messages for user cancellation

### 3. Better Signature Request
- Ensured message is passed as a plain string to `signMessageAsync`
- Added detailed logging before and after signature request
- Added connector ready status to console logs

## Testing Steps

1. **Clear browser cache and reload**
   - Press `Ctrl + Shift + Delete` in your browser
   - Clear cached images and files
   - Reload the page

2. **Check MetaMask**
   - Ensure MetaMask is unlocked
   - Check if there are any pending notifications in MetaMask
   - Try clicking the MetaMask extension icon

3. **Test the flow**
   - Disconnect wallet if connected
   - Click "Connect Wallet"
   - Select MetaMask
   - Wait for the connection confirmation
   - **Wait 2 seconds** (the new delay)
   - MetaMask should now pop up asking for signature

4. **Check console logs**
   Look for these log messages in order:
   ```
   🔐 Wallet connected, initiating authentication...
   📍 Address: 0x...
   📡 Fetching nonce for wallet: 0x...
   📥 Nonce response: {...}
   ✍️ Requesting signature from wallet...
   📝 Message to sign: ...
   🔌 Connector ready: true
   ```

## Common Issues & Solutions

### Issue: "Connector not connected" error
**Solution**: The new code adds a 1-second wait and rechecks the connector. If it still fails, it will show a clear error message.

### Issue: MetaMask doesn't pop up
**Possible causes**:
1. MetaMask popup is blocked by browser
   - Check browser popup blocker settings
   - Allow popups from your app's domain
   
2. MetaMask is locked
   - Unlock MetaMask manually
   - Try connecting again

3. Multiple MetaMask windows open
   - Close all MetaMask popup windows
   - Try again

### Issue: Authentication keeps rolling/loading
**Solution**: The new code has better error handling and will:
- Show specific error messages
- Automatically retry once on connector errors
- Disconnect wallet if authentication fails
- Handle user cancellation gracefully

## Manual Test

If the automatic flow still doesn't work, you can test the signature manually:

1. Open browser console
2. Run this command:
```javascript
// Get wagmi hooks
const { signMessageAsync } = window.wagmi.useSignMessage();

// Test signature
await signMessageAsync({ 
  message: 'Test message for VeriFund authentication' 
});
```

This will trigger MetaMask directly and help identify if the issue is with:
- The wagmi configuration
- MetaMask itself
- Browser permissions

## Next Steps if Issue Persists

1. Check that wagmi is correctly configured (wagmiConfig.js)
2. Verify viem version compatibility with wagmi v1
3. Test with a different wallet (e.g., WalletConnect)
4. Check browser console for any CORS or network errors
5. Verify backend is responding correctly to nonce requests

## Additional Debugging

Enable verbose logging:
```javascript
// In useAuth.js, the code now logs:
- Connector ready status
- Detailed error information (name, code, message)
- Every step of the authentication process
```

All these logs will help identify exactly where the flow is breaking.
