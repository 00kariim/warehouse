import React, { useState } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, LinearProgress, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser } from '../api/users'
import PageHeader from '../components/PageHeader'
import type { User } from '../types'

const ROLE_COLOR: Record<string, 'success' | 'info' | 'default'> = {
  ADMIN: 'success', MANAGER: 'info', OPERATOR: 'default',
}

const UsersPage: React.FC = () => {
  const qc = useQueryClient()
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 })
  const [createOpen, setCreateOpen] = useState(false)
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users', pagination],
    queryFn: () => getUsers({ page: pagination.page, size: pagination.pageSize }),
  })

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setCreateOpen(false)
      setSnack({ msg: 'User created successfully', severity: 'success' })
    },
    onError: () => setSnack({ msg: 'Failed to create user', severity: 'error' }),
  })

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Username', flex: 1, renderCell: p => <Typography variant="body2" fontWeight={500}>{p.value}</Typography> },
    {
      field: 'role', headerName: 'Role', width: 130,
      renderCell: p => <Chip label={p.value} size="small" color={ROLE_COLOR[p.value as string] ?? 'default'} />
    },
    { field: 'createdAt', headerName: 'Created', width: 180, renderCell: p => new Date(p.value as string).toLocaleString() },
    { field: 'id', headerName: 'ID', width: 310, renderCell: p => <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{p.value}</Typography> },
  ]

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage system users and roles"
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Users' }]}
        action={
          <Button id="create-user-btn" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New User
          </Button>
        }
      />

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

      {createOpen && (
        <CreateUserDialog
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

const CreateUserDialog: React.FC<{
  onClose: () => void
  onSubmit: (data: { username: string; password: string; role: User['role'] }) => void
  loading: boolean
}> = ({ onClose, onSubmit, loading }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<User['role']>('OPERATOR')

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>New User</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField id="user-username" label="Username" value={username} onChange={e => setUsername(e.target.value)} fullWidth required inputProps={{ maxLength: 255 }} />
        <TextField id="user-password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth required helperText="Minimum 8 characters" inputProps={{ minLength: 8 }} />
        <TextField id="user-role" select label="Role" value={role} onChange={e => setRole(e.target.value as User['role'])} fullWidth>
          <MenuItem value="OPERATOR">OPERATOR</MenuItem>
          <MenuItem value="MANAGER">MANAGER</MenuItem>
          <MenuItem value="ADMIN">ADMIN</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          id="user-submit-btn" variant="contained"
          disabled={loading || !username || password.length < 8}
          onClick={() => onSubmit({ username, password, role })}
        >
          {loading ? 'Creating…' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UsersPage
