import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Box, CircularProgress } from '@mui/material'

type Role = 'ADMIN' | 'MANAGER' | 'OPERATOR'

interface Props {
  allowedRoles?: Role[]
}

const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { isAuthenticated, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
