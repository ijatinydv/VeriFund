import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import ConnectWalletButton from '../web3/ConnectWalletButton';
import { useAuth } from '../../hooks/useAuth';

/**
 * VeriFund Navigation Bar
 * Features: Logo, navigation links, wallet connect button, role-based navigation, and responsive mobile menu
 */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  // Base nav items (public)
  const baseNavItems = [
    { label: 'Home', path: '/' },
    { label: 'Browse Projects', path: '/browse' },
  ];

  // Role-based dashboard items
  const getDashboardItems = () => {
    if (!isAuthenticated || !user) return [];
    
    if (user.role === 'Creator') {
      return [{ label: 'Creator Dashboard', path: '/creator/dashboard' }];
    } else if (user.role === 'Investor') {
      return [{ label: 'My Investments', path: '/investor/dashboard' }];
    }
    return [];
  };

  const navItems = [...baseNavItems, ...getDashboardItems()];

  // Mobile drawer
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, fontWeight: 700 }}>
        VeriFund
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                textAlign: 'center',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 191, 165, 0.1)',
                },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        {isAuthenticated && (
          <ListItem disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/profile"
              selected={location.pathname === '/profile'}
              sx={{
                textAlign: 'center',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 191, 165, 0.1)',
                },
              }}
            >
              <ListItemText primary="Profile" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(18, 22, 53, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Mobile Menu Icon */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}
            <Typography
              variant="h5"
              component={RouterLink}
              to="/"
              sx={{
                mr: 4,
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #0D47A1 0%, #00BFA5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              VeriFund
            </Typography>

            {/* Desktop Navigation Links */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  sx={{
                    color: location.pathname === item.path ? 'secondary.main' : 'text.primary',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    '&:hover': {
                      color: 'secondary.main',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Spacer for mobile */}
            <Box sx={{ flexGrow: 1, display: { md: 'none' } }} />

            {/* User Menu (Desktop) */}
            {isAuthenticated && !isMobile && (
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{
                  mr: 1,
                  color: 'text.primary',
                  '&:hover': {
                    color: 'secondary.main',
                  },
                }}
              >
                <AccountCircleIcon />
              </IconButton>
            )}
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              PaperProps={{
                sx: {
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  mt: 1,
                },
              }}
            >
              <MenuItem
                component={RouterLink}
                to="/profile"
                onClick={handleUserMenuClose}
              >
                Profile
              </MenuItem>
            </Menu>

            {/* Connect Wallet Button */}
            <ConnectWalletButton />
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
            backgroundColor: 'background.paper',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Navbar;
