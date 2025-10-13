# MetaMask Signature Debug Guide

## Problem Fixed
The MetaMask signature popup was not appearing during authentication because the app was using wagmi v1 but with some v2 patterns.

## Changes Made

### 1. Updated `useAuth.js` Hook
- **Fixed connector check**: Now properly validates that the wallet connector is ready before requesting signature
- **Improved error handling**: Added better logging to track signature request flow
- **Added explicit validation**: Checks if signature is returned before proceeding

### 2. Key Improvements
```javascript
// BEFORE: Would silently fail if connector wasn't ready
if (!connector) {
  console.warn('⚠️ Connector not ready yet, waiting...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('🔌 Connector status after wait:', !!connector);
}

// AFTER: Throws error if connector isn't ready
if (!connector) {
  console.warn('⚠️ Connector not ready, waiting for initialization...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (!connector) {
    throw new Error('Wallet connector not available. Please try reconnecting your wallet.');
  }
  
  console.log('✅ Connector ready after wait');
}
```

## Testing Steps

1. **Clear Browser Cache & Reload**
   - Press `Ctrl + Shift + Delete`
   - Clear cookies and cache
   - Reload the page (`F5`)

2. **Ensure MetaMask is Unlocked**
   - Open MetaMask extension
   - Make sure you're logged in
   - Switch to the correct network (Sepolia testnet)

3. **Test the Connection Flow**
   - Click "Connect Wallet"
   - Select "MetaMask" (or "Injected")
   - Approve the connection in MetaMask
   - **Wait for signature popup** - should appear automatically
   - Sign the message when MetaMask opens

4. **Check Console Logs**
   You should see this sequence:
   ```
   🔐 Wallet connected, initiating authentication...
   📍 Address: 0xcc...
   📡 Fetching nonce for wallet...
   📥 Nonce response: {...}
   ✍️ Requesting signature from wallet...
   📝 Message to sign: Please sign this one-time nonce...
   🔌 Connector available: true
   🎯 Calling signMessageAsync...
   ✅ Signature received successfully
   📋 Signature preview: 0x1234...
   ✅ Signature obtained, verifying with backend...
   ```

## Common Issues & Solutions

### Issue 1: MetaMask Still Not Opening
**Solution**: 
- Disconnect wallet completely
- Refresh the page
- Try connecting again
- Make sure no other dApp is using MetaMask

### Issue 2: "Connector not available" Error
**Solution**:
- Close and reopen MetaMask extension
- Refresh the page
- Clear browser cache
- Make sure MetaMask is unlocked

### Issue 3: Signature Request Rejected
**Solution**:
- This is expected if user clicks "Reject"
- Simply try connecting again
- The app will handle this gracefully

### Issue 4: Multiple Signature Popups
**Solution**:
- This shouldn't happen anymore
- If it does, disconnect and reconnect wallet
- Check console for duplicate authentication attempts

## Expected Behavior After Fix

1. ✅ Click "Connect Wallet" → Wallet selection modal opens
2. ✅ Select MetaMask → MetaMask extension opens for connection approval
3. ✅ Approve connection → "Authenticating..." button appears
4. ✅ **MetaMask automatically opens again** → Sign message popup appears
5. ✅ Sign message → "Welcome back!" toast notification
6. ✅ User is logged in and redirected

## Technical Details

### Wagmi v1 Signature Request
In wagmi v1, `signMessageAsync` requires:
- Active wallet connection (`isConnected === true`)
- Available connector (`connector !== null`)
- Valid message string

The connector object in wagmi v1 is essential for the signature request to work. Without it, MetaMask won't receive the signature request.

### Console Logs to Monitor
- `🔌 Connector available: true` - Confirms connector is ready
- `🎯 Calling signMessageAsync...` - Right before MetaMask should open
- `✅ Signature received successfully` - Confirms signature was obtained

If you see "Calling signMessageAsync..." but MetaMask doesn't open, there's still a connector issue.

## Need More Help?

If MetaMask still doesn't open after these fixes:
1. Check that you're using the latest MetaMask version
2. Try a different browser
3. Disable other wallet extensions temporarily
4. Check MetaMask advanced settings for any blocked sites
