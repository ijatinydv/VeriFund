import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
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
