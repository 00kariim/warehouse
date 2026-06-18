import React, { useState } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Alert, Snackbar, LinearProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import type { Product } from '../types'

const ProductsPage: React.FC = () => {
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN'
  const qc = useQueryClient()

  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 })
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Product | null>(null)
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['products', pagination],
    queryFn: () => getProducts({ page: pagination.page, size: pagination.pageSize }),
  })

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setCreateOpen(false); setSnack({ msg: 'Product created', severity: 'success' }) },
    onError: () => setSnack({ msg: 'Failed to create product', severity: 'error' }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; description?: string; min_stock?: number }) =>
      updateProduct(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setEditItem(null); setSnack({ msg: 'Product updated', severity: 'success' }) },
    onError: () => setSnack({ msg: 'Failed to update product', severity: 'error' }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setSnack({ msg: 'Product deleted', severity: 'success' }) },
    onError: () => setSnack({ msg: 'Cannot delete product with existing movements', severity: 'error' }),
  })

  const columns: GridColDef[] = [
    { field: 'sku', headerName: 'SKU', width: 130, renderCell: p => <code style={{ fontSize: '0.8rem' }}>{p.value}</code> },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'currentStock', headerName: 'Current Stock', width: 140, type: 'number',
      renderCell: p => {
        const row = p.row as Product
        const low = row.currentStock < row.minStock
        return <Chip label={p.value} size="small" color={low ? 'warning' : 'success'} variant="outlined" />
      }
    },
    { field: 'minStock', headerName: 'Min Stock', width: 110, type: 'number' },
    { field: 'description', headerName: 'Description', flex: 1, sortable: false },
    ...(isAdmin ? [{
      field: '_actions', headerName: '', width: 160, sortable: false,
      renderCell: (p: { row: Product }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setEditItem(p.row)}>Edit</Button>
          <Button size="small" variant="outlined" color="error" onClick={() => deleteMut.mutate(p.row.id)}>Del</Button>
        </Box>
      ),
    }] : []),
  ]

  return (
    <Box>
      <PageHeader
        title="Products"
        subtitle="Manage product catalog"
        action={isAdmin
          ? <Button id="create-product-btn" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>New Product</Button>
          : undefined}
      />

      <Box sx={{ height: 600, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
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
          getRowClassName={p => (p.row as Product).currentStock < (p.row as Product).minStock ? 'low-stock-row' : ''}
          sx={{ '& .low-stock-row': { bgcolor: 'rgba(255,167,38,0.04)' } }}
        />
      </Box>

      {/* Create dialog */}
      <ProductDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={data => createMut.mutate(data)}
        loading={createMut.isPending}
        title="New Product"
      />

      {/* Edit dialog */}
      {editItem && (
        <ProductDialog
          open
          onClose={() => setEditItem(null)}
          onSubmit={d => updateMut.mutate({ id: editItem.id, ...d })}
          loading={updateMut.isPending}
          title="Edit Product"
          initial={editItem}
          editMode
        />
      )}

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}>
        <Alert severity={snack?.severity} sx={{ borderRadius: 2 }}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  )
}

interface ProductDialogProps {
  open: boolean; onClose: () => void; loading: boolean; title: string; editMode?: boolean
  onSubmit: (data: { sku: string; name: string; description?: string; min_stock: number; current_stock: number }) => void
  initial?: Product
}

const ProductDialog: React.FC<ProductDialogProps> = ({ open, onClose, onSubmit, loading, title, editMode, initial }) => {
  const [sku, setSku] = useState(initial?.sku ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [minStock, setMinStock] = useState(String(initial?.minStock ?? 0))
  const [currentStock, setCurrentStock] = useState(String(initial?.currentStock ?? 0))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {!editMode && <TextField id="product-sku" label="SKU" value={sku} onChange={e => setSku(e.target.value)} fullWidth required inputProps={{ maxLength: 100 }} />}
        <TextField id="product-name" label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth required />
        <TextField id="product-description" label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={2} />
        <TextField id="product-min-stock" label="Min Stock" type="number" value={minStock} onChange={e => setMinStock(e.target.value)} fullWidth inputProps={{ min: 0 }} />
        {!editMode && <TextField id="product-current-stock" label="Initial Stock" type="number" value={currentStock} onChange={e => setCurrentStock(e.target.value)} fullWidth inputProps={{ min: 0 }} />}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          id="product-submit-btn"
          variant="contained"
          disabled={loading || !name || (!editMode && !sku)}
          onClick={() => onSubmit({ sku, name, description: description || undefined, min_stock: parseInt(minStock), current_stock: parseInt(currentStock) })}
        >
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProductsPage
