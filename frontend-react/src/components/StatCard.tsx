import React from 'react'
import { Box, Typography, Skeleton } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactElement<React.ComponentProps<SvgIconComponent>>
  color?: string
  loading?: boolean
}

const StatCard: React.FC<Props> = ({ title, value, subtitle, icon, color = '#00e676', loading }) => (
  <Box sx={{
    p: 2.5,
    borderRadius: 3,
    bgcolor: 'background.paper',
    border: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 2,
    transition: 'border-color 0.2s',
    '&:hover': { borderColor: `${color}40` },
  }}>
    <Box sx={{
      width: 48, height: 48, borderRadius: 2.5,
      bgcolor: `${color}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color,
      flexShrink: 0,
    }}>
      {React.cloneElement(icon, { fontSize: 'medium' } as object)}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {title}
      </Typography>
      {loading
        ? <Skeleton width={80} height={36} />
        : <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary', lineHeight: 1.2 }}>{value}</Typography>
      }
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
      )}
    </Box>
  </Box>
)

export default StatCard
