import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Tooltip,
  Divider, Chip, useMediaQuery, useTheme as useMuiTheme,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import InventoryIcon from '@mui/icons-material/Inventory2'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PeopleIcon from '@mui/icons-material/People'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import { useAuth } from '../contexts/AuthContext'

const DRAWER_WIDTH = 240

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles?: ('ADMIN' | 'MANAGER' | 'OPERATOR')[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Products', path: '/products', icon: <InventoryIcon /> },
  { label: 'Warehouses', path: '/warehouses', icon: <WarehouseIcon /> },
  { label: 'Movements', path: '/movements', icon: <SwapHorizIcon /> },
  { label: 'Low Stock', path: '/low-stock', icon: <TrendingDownIcon />, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Anomalies', path: '/anomalies', icon: <WarningAmberIcon />, roles: ['ADMIN', 'MANAGER'] },
  { label: 'AI Chat', path: '/ai-chat', icon: <SmartToyIcon />, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Users', path: '/users', icon: <PeopleIcon />, roles: ['ADMIN'] },
]

const ROLE_COLOR: Record<string, 'success' | 'info' | 'default'> = {
  ADMIN: 'success',
  MANAGER: 'info',
  OPERATOR: 'default',
}

const Layout: React.FC = () => {
  const { role, username, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const muiTheme = useMuiTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter(item => !item.roles || (role && item.roles.includes(role)))

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '-0.5px' }}>
          WarehouseIMS
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Inventory Management
        </Typography>
      </Box>
      <Divider />

      {/* Nav */}
      <List sx={{ px: 1, pt: 1, flex: 1 }}>
        {visibleItems.map(item => {
          const active = location.pathname === item.path
          return (
            <ListItemButton
              key={item.path}
              onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false) }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active ? 'rgba(0,230,118,0.08)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(0,230,118,0.06)', color: 'primary.main' },
                transition: 'all 0.15s',
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 600 : 400, fontSize: '0.9rem' }} />
            </ListItemButton>
          )
        })}
      </List>

      <Divider />
      {/* User area */}
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.dark', color: 'primary.contrastText', fontSize: '0.85rem', fontWeight: 700 }}>
          {username?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap fontWeight={600}>{username}</Typography>
          <Chip label={role} size="small" color={ROLE_COLOR[role ?? ''] ?? 'default'} sx={{ height: 18, fontSize: '0.65rem' }} />
        </Box>
        <Tooltip title="Logout">
          <IconButton size="small" onClick={logout} sx={{ color: 'text.secondary' }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'background.paper', boxSizing: 'border-box' } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'background.paper', boxSizing: 'border-box', borderRight: '1px solid rgba(255,255,255,0.06)' } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {isMobile && (
          <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Toolbar>
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 800 }}>WarehouseIMS</Typography>
            </Toolbar>
          </AppBar>
        )}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
