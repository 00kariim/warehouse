import React, { useState } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, LinearProgress, Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMovements, createMovement } from '../api/movements'
import { getProducts } from '../api/products'
import { getWarehouses } from '../api/warehouses'
import PageHeader from '../components/PageHeader'
import type { StockMovement, MovementType } from '../types'

const TYPE_COLOR: Record<MovementType, 'success' | 'error' | 'info'> = {
  IN: 'success', OUT: 'error', ADJUSTMENT: 'info',
}

const MovementsPage: React.FC = () => {
  const qc = useQueryClient()

  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 })
  const [filterType, setFilterType] = useState('')
  const [anomalyOnly, setAnomalyOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['movements', pagination, filterType, anomalyOnly],
    queryFn: () => getMovements({
      page: pagination.page, size: pagination.pageSize,
      type: filterType ? (filterType as MovementType) : undefined,
      anomaly_only: anomalyOnly || undefined,
    }),
  })

  const createMut = useMutation({
    mutationFn: createMovement,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['movements'] }); setCreateOpen(false); setSnack({ msg: 'Movement registered', severity: 'success' }) },
    onError: () => setSnack({ msg: 'Failed to register movement', severity: 'error' }),
  })

  const columns: GridColDef[] = [
    { field: 'timestamp', headerName: 'Time', width: 170, renderCell: p => new Date(p.value as string).toLocaleString() },
    { field: 'type', headerName: 'Type', width: 110,
      renderCell: p => <Chip label={p.value} size="small" color={TYPE_COLOR[p.value as MovementType]} variant="outlined" />
    },
    { field: 'quantity', headerName: 'Qty', width: 90, type: 'number' },
    { field: 'product', headerName: 'Product', flex: 1, renderCell: p => (p.value as StockMovement['product'])?.name },
    { field: 'warehouse', headerName: 'Warehouse', width: 150, renderCell: p => (p.value as StockMovement['warehouse'])?.name },
    { field: 'anomalyFlag', headerName: 'Anomaly', width: 100,
      renderCell: p => p.value ? <Chip label="⚠ Flagged" size="small" color="warning" /> : null
    },
    { field: 'notes', headerName: 'Notes', flex: 1, sortable: false },
  ]

  return (
    <Box>
      <PageHeader
        title="Stock Movements"
        subtitle="Track all inventory in/out events"
        action={<Button id="create-movement-btn" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Register Movement</Button>}
      />

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select label="Type" value={filterType} onChange={e => setFilterType(e.target.value)}
          size="small" sx={{ width: 160 }} id="filter-type"
        >
          <MenuItem value="">All types</MenuItem>
          <MenuItem value="IN">IN</MenuItem>
          <MenuItem value="OUT">OUT</MenuItem>
          <MenuItem value="ADJUSTMENT">ADJUSTMENT</MenuItem>
        </TextField>
        <Button
          id="filter-anomaly"
          variant={anomalyOnly ? 'contained' : 'outlined'}
          color="warning"
          size="small"
          onClick={() => setAnomalyOnly(v => !v)}
        >
          Anomalies only
        </Button>
      </Stack>

      <Box sx={{ height: 580, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
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
          getRowClassName={p => (p.row as StockMovement).anomalyFlag ? 'anomaly-row' : ''}
          sx={{ '& .anomaly-row': { bgcolor: 'rgba(255,167,38,0.04)' } }}
        />
      </Box>

      {createOpen && (
        <MovementCreateDialog
          onClose={() => setCreateOpen(false)}
          onSubmit={d => createMut.mutate(d)}
          loading={createMut.isPending}
        />
      )}

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}>
        <Alert severity={snack?.severity} sx={{ borderRadius: 2 }}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  )
}

interface CreateMovementBody { product_id: string; warehouse_id: string; quantity: number; type: MovementType; notes?: string }

const MovementCreateDialog: React.FC<{
  onClose: () => void
  onSubmit: (data: CreateMovementBody) => void
  loading: boolean
}> = ({ onClose, onSubmit, loading }) => {
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [type, setType] = useState<MovementType>('IN')
  const [notes, setNotes] = useState('')

  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => getProducts({ size: 100 }) })
  const { data: warehouses } = useQuery({ queryKey: ['warehouses-all'], queryFn: () => getWarehouses({ size: 100 }) })

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>Register Stock Movement</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField select id="move-product" label="Product" value={productId} onChange={e => setProductId(e.target.value)} fullWidth required>
          {products?.data.map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.sku})</MenuItem>)}
        </TextField>
        <TextField select id="move-warehouse" label="Warehouse" value={warehouseId} onChange={e => setWarehouseId(e.target.value)} fullWidth required>
          {warehouses?.data.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
        </TextField>
        <TextField select id="move-type" label="Type" value={type} onChange={e => setType(e.target.value as MovementType)} fullWidth>
          <MenuItem value="IN">IN — Stock received</MenuItem>
          <MenuItem value="OUT">OUT — Stock dispatched</MenuItem>
          <MenuItem value="ADJUSTMENT">ADJUSTMENT — Manual correction</MenuItem>
        </TextField>
        <TextField id="move-quantity" label="Quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} fullWidth required inputProps={{ min: type === 'ADJUSTMENT' ? undefined : 1 }} />
        <TextField id="move-notes" label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} fullWidth multiline rows={2} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          id="move-submit-btn" variant="contained"
          disabled={loading || !productId || !warehouseId || !quantity}
          onClick={() => onSubmit({ product_id: productId, warehouse_id: warehouseId, quantity: parseInt(quantity), type, notes: notes || undefined })}
        >
          {loading ? 'Saving…' : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MovementsPage
