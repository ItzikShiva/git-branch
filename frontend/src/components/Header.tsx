import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { GitHub } from '@mui/icons-material';
import { NavLink } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <GitHub sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          GitStatus
        </Typography>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          <Button component={NavLink} to="/dashboard" sx={{ my: 2, color: 'white', display: 'block' }}>
            Dashboard
          </Button>
          <Button component={NavLink} to="/repos" sx={{ my: 2, color: 'white', display: 'block' }}>
            Repositories
          </Button>
          <Button component={NavLink} to="/watched" sx={{ my: 2, color: 'white', display: 'block' }}>
            Watched Branches
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 