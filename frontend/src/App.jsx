import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Page imports
import Home from './pages/Home';
import Browse from './pages/Browse';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CreateProjectPage from './pages/CreateProjectPage';
import CreatorDashboard from './pages/CreatorDashboard';
import InvestorDashboard from './pages/InvestorDashboard';

function App() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E1E1E',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#00BFA5',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(0, 191, 165, 0.3)',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF1744',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(255, 23, 68, 0.3)',
            },
          },
          loading: {
            iconTheme: {
              primary: '#0D47A1',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Navbar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 8, md: 10 },
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          
          {/* Public Project Detail */}
          <Route path="/project/:projectId" element={<ProjectDetailPage />} />
          
          {/* Protected Creator Routes */}
          <Route
            path="/create-project"
            element={
              <ProtectedRoute allowedRoles={['Creator']}>
                <CreateProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Creator']}>
                <CreatorDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Protected Investor Route */}
          <Route
            path="/investor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Investor']}>
                <InvestorDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>

      <Footer />
    </Box>
  );
}

export default App;
