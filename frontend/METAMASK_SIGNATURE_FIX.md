# MetaMask Signature Request Fix

## Problem
After connecting the wallet, the authentication process was stuck with the message "Requesting signature from wallet..." but MetaMask popup was not appearing.

## Root Cause
The code was trying to use `useConnectorClient` from wagmi, which is only available in wagmi v2, but the project uses wagmi v1.4.13.

## Solution Applied

### 1. Fixed Import in `useAuth.js`
**Before:**
```javascript
import { useSignMessage, useAccount, useConnectorClient } from 'wagmi';
```

**After:**
```javascript
import { useSignMessage, useAccount } from 'wagmi';
```

### 2. Updated Connector Check (wagmi v1 compatible)
**Before:**
```javascript
const { data: connectorClient } = useConnectorClient(); // ❌ Not available in v1
if (!connectorClient) { ... }
```

**After:**
```javascript
const { isConnected, connector } = useAccount(); // ✅ Works with v1
if (!connector) { ... }
```

### 3. Enhanced Features

#### Better Error Handling
- Added detailed error logging (error name, code, message)
- Better detection of user rejection (code 4001, ACTION_REJECTED)
- Improved connector error detection

#### Longer Initial Delay
- Increased delay from 1000ms to 2000ms in `ConnectWalletButton.jsx`
- Gives MetaMask extension more time to fully initialize
- Reduces "Connector not connected" errors

#### Better User Feedback
- Clear error messages for different failure scenarios
- Toast notifications for cancellation and errors
- Proper disconnect on authentication failure

## How It Works Now

1. **User clicks "Connect Wallet"**
   - Wallet selection modal appears
   - User selects MetaMask

2. **Wallet connects**
   - 2-second delay to ensure MetaMask is ready
   - Checks if connector is available

3. **Authentication starts**
   - Fetches nonce from backend
   - Checks wallet is still connected
   - Checks connector is ready (waits if needed)

4. **Signature request**
   - `signMessageAsync` is called with the message
   - **MetaMask popup should now appear** ✅
   - User signs the message

5. **Backend verification**
   - Signature sent to backend
   - JWT token received and stored
   - User is authenticated

## Testing

After the fix, you should see these logs in order:

```
🔐 Wallet connected, initiating authentication...
📍 Address: 0xC27381b3fE2C5aa45F531E73f729aBC5F2C6a95D
📡 Fetching nonce for wallet: 0xc27381b3fe2c5aa45f531e73f729abc5f2c6a95d with role: none
📥 Nonce response: {nonce: '...', isNewUser: false, message: '...'}
✍️ Requesting signature from wallet...
📝 Message to sign: Please sign this one-time nonce...
🔌 Connector available: true
[MetaMask popup appears] ← This should happen now!
✅ Signature received: 0x...
✅ Signature obtained, verifying with backend...
📥 Login response: {...}
✅ Authentication successful! User: {...}
```

## Troubleshooting

### If MetaMask still doesn't pop up:

1. **Check MetaMask is unlocked**
   - Click the MetaMask extension icon
   - Enter your password if locked

2. **Check browser popup blocker**
   - Allow popups from your app's domain
   - Check browser extension settings

3. **Clear cache and reload**
   - Press `Ctrl + Shift + Delete`
   - Clear cached files
   - Hard reload with `Ctrl + F5`

4. **Check for pending MetaMask notifications**
   - Click the MetaMask icon
   - Look for any pending signature requests
   - Clear/reject old requests

5. **Try disconnecting and reconnecting**
   - Click "Disconnect & Logout" if connected
   - Close all MetaMask popups
   - Try connecting again

### If you see specific errors:

**"Wallet connection lost"**
- MetaMask was disconnected during the process
- Reconnect wallet and try again

**"Authentication cancelled by user"**
- You clicked "Reject" in MetaMask
- Click "Connect Wallet" again and approve the signature

**"Connector not ready"**
- The delay wasn't enough (rare)
- The code will wait an additional 1 second
- If it still fails, try manually reconnecting

## Technical Details

### Why the 2-second delay?
MetaMask (and other wallet extensions) need time to:
1. Inject the provider into the page
2. Initialize the connector
3. Establish connection with the extension
4. Be ready to show popups

The 2-second delay ensures all of this happens before we request a signature.

### Why check the connector?
In wagmi v1, the `connector` object from `useAccount()` tells us if the wallet is truly ready to sign messages. Without it being ready, `signMessageAsync` will fail silently or throw connector errors.

### Error codes reference:
- `4001`: User rejected the request (EIP-1193)
- `ACTION_REJECTED`: MetaMask specific rejection code
- `ConnectorNotConnectedError`: Wagmi error when connector isn't ready

## Next Steps

1. **Test the flow**:
   - Clear browser cache
   - Disconnect wallet if connected
   - Connect wallet and watch for MetaMask popup

2. **Check console logs**:
   - Look for the "🔌 Connector available: true" message
   - This confirms the connector is ready

3. **If issues persist**:
   - Open browser console and share the error logs
   - Check if it's a specific error pattern
   - May need to investigate MetaMask version or browser compatibility

## Success Indicators

✅ MetaMask popup appears within 2-3 seconds of connecting
✅ Clear error messages if something goes wrong  
✅ No infinite loading/rolling authentication
✅ Proper disconnection on errors
✅ User-friendly error messages
