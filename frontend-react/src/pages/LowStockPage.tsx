import React, { useState } from 'react'
import { Box, LinearProgress, Typography, Chip } from '@mui/material'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { getLowStock } from '../api/movements'
import PageHeader from '../components/PageHeader'
import type { Product } from '../types'

const LowStockPage: React.FC = () => {
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 })

  const { data, isLoading } = useQuery({
    queryKey: ['low-stock', pagination],
    queryFn: () => getLowStock({ page: pagination.page, size: pagination.pageSize }),
    refetchInterval: 60_000, // auto-refresh every minute
  })

  const columns: GridColDef[] = [
    { field: 'sku', headerName: 'SKU', width: 130, renderCell: p => <code style={{ fontSize: '0.8rem' }}>{p.value}</code> },
    { field: 'name', headerName: 'Name', flex: 1 },
    {
      field: 'currentStock', headerName: 'Current / Min', flex: 1,
      renderCell: p => {
        const row = p.row as Product
        const pct = row.minStock > 0 ? Math.min((row.currentStock / row.minStock) * 100, 100) : 0
        return (
          <Box sx={{ width: '100%', pr: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" fontWeight={600} color="error.main">{row.currentStock}</Typography>
              <Typography variant="caption" color="text.secondary">/ {row.minStock}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={pct} color="error" sx={{ borderRadius: 2, height: 4 }} />
          </Box>
        )
      }
    },
    {
      field: '_status', headerName: 'Status', width: 120, sortable: false,
      renderCell: (p) => {
        const row = p.row as Product
        return row.currentStock === 0
          ? <Chip label="Out of Stock" size="small" color="error" />
          : <Chip label="Low Stock" size="small" color="warning" />
      }
    },
  ]

  return (
    <Box>
      <PageHeader
        title="Low Stock Alerts"
        subtitle={data ? `${data.totalElements} product${data.totalElements !== 1 ? 's' : ''} below minimum stock` : 'Products requiring replenishment'}
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Low Stock' }]}
      />

      {data?.totalElements === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <TrendingDownIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6">All products are well-stocked</Typography>
        </Box>
      )}

      <Box sx={{ height: 520, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        {isLoading && <LinearProgress color="primary" />}
        <DataGrid
          rows={data?.data ?? []}
          columns={columns}
          rowCount={data?.totalElements ?? 0}
          paginationMode="server"
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[10, 20, 50]}
          loading={isLoading}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  )
}

export default LowStockPage
