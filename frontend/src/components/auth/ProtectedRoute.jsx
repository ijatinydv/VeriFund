import { Navigate } from 'react-router-dom';
import { CircularProgress, Box, Alert, Container, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * Protected Route Component
 * Restricts access to authenticated users with specific roles
 * 
 * @param {ReactNode} children - Child components to render if authorized
 * @param {Array} allowedRoles - Array of roles allowed to access this route
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Debug logging with localStorage check
  const localStorageAuth = localStorage.getItem('verifund-auth');
  const parsedAuth = localStorageAuth ? JSON.parse(localStorageAuth) : null;
  
  console.log('ProtectedRoute Check:', {
    isAuthenticated,
    isLoading,
    userRole: user?.role,
    allowedRoles,
    userName: user?.walletAddress,
  });
  
  console.log('LocalStorage Auth:', parsedAuth?.state);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    console.log('❌ Redirecting: Not authenticated');
    
    // Show a message instead of silent redirect
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Box sx={{ mb: 2 }}>
            <strong>Authentication Required</strong>
          </Box>
          <Box sx={{ mb: 2 }}>
            You need to connect your wallet and authenticate to access this page.
          </Box>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            color="secondary"
            size="small"
          >
            Go to Home & Connect Wallet
          </Button>
        </Alert>
      </Container>
    );
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    console.log('❌ Redirecting: Role mismatch', { userRole: user?.role, allowedRoles });
    
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Box sx={{ mb: 2 }}>
            <strong>Access Denied</strong>
          </Box>
          <Box sx={{ mb: 2 }}>
            Your role ({user?.role || 'None'}) doesn't have permission to access this page.
            Required role: {allowedRoles.join(' or ')}
          </Box>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            color="primary"
            size="small"
          >
            Go to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  console.log('✅ Access granted!');
  return children;
}

export default ProtectedRoute;
