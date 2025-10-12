/**
 * Real-time Auth State Monitor
 * Copy and paste this into your browser console to monitor auth state
 */

// Monitor auth state changes
let lastAuthState = null;

const monitorAuth = () => {
  const authRaw = localStorage.getItem('verifund-auth');
  
  if (!authRaw) {
    console.log('❌ No auth data found in localStorage');
    return;
  }
  
  try {
    const auth = JSON.parse(authRaw);
    const currentState = JSON.stringify(auth);
    
    // Only log if state changed
    if (currentState !== lastAuthState) {
      lastAuthState = currentState;
      
      console.clear();
      console.log('%c═══════════════════════════════════════', 'color: #00BFA5; font-weight: bold');
      console.log('%c    VeriFund Auth State Monitor', 'color: #00BFA5; font-size: 16px; font-weight: bold');
      console.log('%c═══════════════════════════════════════', 'color: #00BFA5; font-weight: bold');
      console.log('');
      
      console.table({
        '✓ Authenticated': auth?.state?.isAuthenticated ? '✅ YES' : '❌ NO',
        '👤 User Role': auth?.state?.user?.role || '❌ Not set',
        '💼 Wallet': auth?.state?.user?.walletAddress || '❌ Not set',
        '🔑 Has Token': auth?.state?.token ? '✅ YES' : '❌ NO',
        '📧 Email': auth?.state?.user?.email || '(not set)',
        '👤 Name': auth?.state?.user?.name || '(not set)',
      });
      
      console.log('');
      console.log('%c🔍 Full User Object:', 'color: #0D47A1; font-weight: bold');
      console.log(auth?.state?.user);
      
      console.log('');
      console.log('%c🔐 Token Preview:', 'color: #0D47A1; font-weight: bold');
      console.log(auth?.state?.token ? auth.state.token.substring(0, 50) + '...' : 'No token');
      
      console.log('');
      console.log('%c💡 Dashboard Access:', 'color: #FF6B6B; font-weight: bold');
      if (auth?.state?.isAuthenticated) {
        const role = auth.state.user?.role;
        if (role === 'Creator') {
          console.log('✅ Can access: /creator/dashboard');
          console.log('❌ Cannot access: /investor/dashboard');
        } else if (role === 'Investor') {
          console.log('✅ Can access: /investor/dashboard');
          console.log('❌ Cannot access: /creator/dashboard');
        } else {
          console.log('❌ No role set - cannot access any dashboard');
        }
      } else {
        console.log('❌ Not authenticated - cannot access any dashboard');
      }
      
      console.log('');
      console.log('%c═══════════════════════════════════════', 'color: #00BFA5; font-weight: bold');
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error parsing auth state:', error);
  }
};

// Run immediately
monitorAuth();

// Monitor every 1 second
const authMonitorInterval = setInterval(monitorAuth, 1000);

console.log('%c🚀 Auth monitor started!', 'color: #00BFA5; font-size: 14px; font-weight: bold');
console.log('To stop: clearInterval(authMonitorInterval)');

// Export to window for easy stopping
window.authMonitorInterval = authMonitorInterval;
window.stopAuthMonitor = () => {
  clearInterval(authMonitorInterval);
  console.log('%c⏹️  Auth monitor stopped', 'color: #FF6B6B; font-size: 14px; font-weight: bold');
};

// Helper function to manually check auth
window.checkAuth = () => {
  lastAuthState = null; // Force re-display
  monitorAuth();
};

console.log('%c💡 Commands:', 'color: #0D47A1; font-weight: bold');
console.log('  checkAuth() - Manually check current auth state');
console.log('  stopAuthMonitor() - Stop the auto-monitor');
