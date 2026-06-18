import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import InventoryIcon from '@mui/icons-material/Inventory2'
import { useAuth } from '../contexts/AuthContext'

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(0,230,118,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(88,166,255,0.06) 0%, transparent 60%), #0d1117',
      p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 4 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: 3, bgcolor: 'rgba(0,230,118,0.12)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2,
          }}>
            <InventoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" fontWeight={800} gutterBottom>WarehouseIMS</Typography>
          <Typography variant="body2" color="text.secondary">
            AI-Powered Inventory Management
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="login-username"
            label="Username"
            fullWidth
            margin="normal"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={e => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            id="login-password"
            label="Password"
            type={showPw ? 'text' : 'password'}
            fullWidth
            margin="normal"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPw(v => !v)} edge="end">
                    {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            id="login-submit"
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading || !username || !password}
            sx={{ mt: 3, py: 1.5 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
          </Button>
        </Box>
      </Card>
    </Box>
  )
}

export default LoginPage
