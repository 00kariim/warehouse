import React, { useState } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Snackbar, LinearProgress, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWarehouses, createWarehouse, updateWarehouse } from '../api/warehouses'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import type { Warehouse } from '../types'

const WarehousesPage: React.FC = () => {
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN'
  const qc = useQueryClient()

  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 })
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Warehouse | null>(null)
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', pagination],
    queryFn: () => getWarehouses({ page: pagination.page, size: pagination.pageSize }),
  })

  const createMut = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setCreateOpen(false); setSnack({ msg: 'Warehouse created', severity: 'success' }) },
    onError: () => setSnack({ msg: 'Failed to create warehouse', severity: 'error' }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; location?: string }) => updateWarehouse(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setEditItem(null); setSnack({ msg: 'Warehouse updated', severity: 'success' }) },
    onError: () => setSnack({ msg: 'Failed to update warehouse', severity: 'error' }),
  })

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'location', headerName: 'Location', flex: 1, renderCell: p => p.value || <Typography variant="caption" color="text.secondary">—</Typography> },
    { field: 'createdAt', headerName: 'Created', width: 160, renderCell: p => new Date(p.value as string).toLocaleDateString() },
    ...(isAdmin ? [{
      field: '_actions', headerName: '', width: 100, sortable: false,
      renderCell: (p: { row: Warehouse }) => (
        <Button size="small" variant="outlined" onClick={() => setEditItem(p.row)}>Edit</Button>
      ),
    }] : []),
  ]

  return (
    <Box>
      <PageHeader
        title="Warehouses"
        subtitle="Manage warehouse locations"
        action={isAdmin
          ? <Button id="create-warehouse-btn" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>New Warehouse</Button>
          : undefined}
      />

      <Box sx={{ height: 500, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
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

      <WarehouseDialog open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={d => createMut.mutate(d)} loading={createMut.isPending} title="New Warehouse" />

      {editItem && (
        <WarehouseDialog open onClose={() => setEditItem(null)} onSubmit={d => updateMut.mutate({ id: editItem.id, ...d })} loading={updateMut.isPending} title="Edit Warehouse" initial={editItem} />
      )}

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}>
        <Alert severity={snack?.severity} sx={{ borderRadius: 2 }}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  )
}

interface WarehouseDialogProps {
  open: boolean; onClose: () => void; loading: boolean; title: string; initial?: Warehouse
  onSubmit: (data: { name: string; location?: string }) => void
}
const WarehouseDialog: React.FC<WarehouseDialogProps> = ({ open, onClose, onSubmit, loading, title, initial }) => {
  const [name, setName] = useState(initial?.name ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField id="warehouse-name" label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth required />
        <TextField id="warehouse-location" label="Location" value={location} onChange={e => setLocation(e.target.value)} fullWidth placeholder="e.g. Casablanca, Zone 3" />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button id="warehouse-submit-btn" variant="contained" disabled={loading || !name} onClick={() => onSubmit({ name, location: location || undefined })}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WarehousesPage
