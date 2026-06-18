import React from 'react'
import { Grid, Box, Alert, Typography } from '@mui/material'
import InventoryIcon from '@mui/icons-material/Inventory2'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '../api/products'
import { getWarehouses } from '../api/warehouses'
import { getMovements } from '../api/movements'
import { getAnomalies } from '../api/anomalies'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'

const DashboardPage: React.FC = () => {
  const { role } = useAuth()
  const canViewAdvanced = role === 'ADMIN' || role === 'MANAGER'

  const { data: products, isLoading: pLoading } = useQuery({
    queryKey: ['products', { size: 1 }],
    queryFn: () => getProducts({ size: 1 }),
  })

  const { data: warehouses, isLoading: wLoading } = useQuery({
    queryKey: ['warehouses', { size: 1 }],
    queryFn: () => getWarehouses({ size: 1 }),
  })

  // Today's movements — approximate with first page sorted by timestamp
  const { data: movements, isLoading: mLoading } = useQuery({
    queryKey: ['movements', { size: 1 }],
    queryFn: () => getMovements({ size: 1 }),
  })

  const { data: anomalies, isLoading: aLoading } = useQuery({
    queryKey: ['anomalies', { reviewed: false, size: 1 }],
    queryFn: () => getAnomalies({ reviewed: false, size: 1 }),
    enabled: canViewAdvanced,
  })

  const pendingAnomalies = anomalies?.totalElements ?? 0

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="System overview and key performance indicators"
      />

      {canViewAdvanced && pendingAnomalies > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Typography
              variant="caption"
              component="a"
              href="/anomalies"
              sx={{ color: 'warning.main', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Review now
            </Typography>
          }
        >
          {pendingAnomalies} unreviewed anomaly event{pendingAnomalies !== 1 ? 's' : ''} detected
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Products"
            value={products?.totalElements ?? '—'}
            subtitle="In catalog"
            icon={<InventoryIcon />}
            color="#00e676"
            loading={pLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Warehouses"
            value={warehouses?.totalElements ?? '—'}
            subtitle="Active locations"
            icon={<WarehouseIcon />}
            color="#58a6ff"
            loading={wLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Movements"
            value={movements?.totalElements ?? '—'}
            subtitle="All time"
            icon={<SwapHorizIcon />}
            color="#f78166"
            loading={mLoading}
          />
        </Grid>
        {canViewAdvanced && (
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Pending Anomalies"
              value={pendingAnomalies}
              subtitle="Awaiting review"
              icon={<WarningAmberIcon />}
              color="#ffa726"
              loading={aLoading}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default DashboardPage
