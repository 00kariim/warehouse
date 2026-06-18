import React from 'react'
import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

interface Breadcrumb { label: string; to?: string }

interface Props {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  action?: React.ReactNode
}

const PageHeader: React.FC<Props> = ({ title, subtitle, breadcrumbs, action }) => (
  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
    <Box>
      {breadcrumbs && (
        <Breadcrumbs sx={{ mb: 0.5, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
          {breadcrumbs.map((bc, i) =>
            bc.to
              ? <Link key={i} component={RouterLink} to={bc.to} underline="hover" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{bc.label}</Link>
              : <Typography key={i} sx={{ color: 'text.disabled', fontSize: '0.8rem' }}>{bc.label}</Typography>
          )}
        </Breadcrumbs>
      )}
      <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary' }}>{title}</Typography>
      {subtitle && <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{subtitle}</Typography>}
    </Box>
    {action && <Box>{action}</Box>}
  </Box>
)

export default PageHeader
