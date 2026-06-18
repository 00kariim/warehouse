import React, { useState } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, TextField, Chip, Alert, Snackbar, LinearProgress, Typography, Stack,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAnomalies, reviewAnomaly } from '../api/anomalies'
import PageHeader from '../components/PageHeader'
import type { AnomalyEvent, ReviewOutcome } from '../types'

const AnomaliesPage: React.FC = () => {
  const qc = useQueryClient()
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 })
  const [reviewedFilter, setReviewedFilter] = useState<boolean | undefined>(false)
  const [reviewTarget, setReviewTarget] = useState<AnomalyEvent | null>(null)
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['anomalies', pagination, reviewedFilter],
    queryFn: () => getAnomalies({ reviewed: reviewedFilter, page: pagination.page, size: pagination.pageSize }),
  })

  const reviewMut = useMutation({
    mutationFn: ({ id, outcome }: { id: string; outcome: ReviewOutcome }) => reviewAnomaly(id, outcome),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anomalies'] })
      setReviewTarget(null)
      setSnack({ msg: 'Anomaly reviewed', severity: 'success' })
    },
    onError: () => setSnack({ msg: 'Failed to submit review', severity: 'error' }),
  })

  const columns: GridColDef[] = [
    { field: 'createdAt', headerName: 'Detected', width: 170, renderCell: p => new Date(p.value as string).toLocaleString() },
    {
      field: 'movement', headerName: 'Movement', flex: 1, sortable: false,
      renderCell: p => {
        const m = (p.value as AnomalyEvent['movement'])
        return m ? `${m.type} · ${m.quantity} · ${m.product?.name ?? ''}` : '—'
      }
    },
    { field: 'confidenceScore', headerName: 'Confidence', width: 120,
      renderCell: p => <Chip label={`${(Number(p.value) * 100).toFixed(0)}%`} size="small" color="warning" variant="outlined" />
    },
    { field: 'modelVersion', headerName: 'Model', width: 100 },
    {
      field: 'reviewOutcome', headerName: 'Outcome', width: 140,
      renderCell: p => p.value
        ? <Chip label={p.value === 'TRUE_POSITIVE' ? '✓ True' : '✗ False'} size="small" color={p.value === 'TRUE_POSITIVE' ? 'error' : 'success'} />
        : <Chip label="Pending" size="small" variant="outlined" />
    },
    {
      field: '_review', headerName: '', width: 100, sortable: false,
      renderCell: p => !((p.row as AnomalyEvent).reviewOutcome)
        ? <Button size="small" variant="outlined" color="warning" onClick={() => setReviewTarget(p.row as AnomalyEvent)}>Review</Button>
        : null
    },
  ]

  return (
    <Box>
      <PageHeader
        title="Anomaly Events"
        subtitle="Review detected suspicious stock movements"
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Anomalies' }]}
      />

      {/* Filter toggle */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {([undefined, false, true] as (boolean | undefined)[]).map(val => {
          const label = val === undefined ? 'All' : val ? 'Reviewed' : 'Pending'
          return (
            <Button
              key={String(val)}
              size="small"
              variant={reviewedFilter === val ? 'contained' : 'outlined'}
              onClick={() => setReviewedFilter(val)}
            >
              {label}
            </Button>
          )
        })}
      </Stack>

      {data?.totalElements === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <WarningAmberIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6">No anomaly events found</Typography>
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

      {reviewTarget && (
        <ReviewDialog
          event={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={outcome => reviewMut.mutate({ id: reviewTarget.id, outcome })}
          loading={reviewMut.isPending}
        />
      )}

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}>
        <Alert severity={snack?.severity} sx={{ borderRadius: 2 }}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  )
}

const ReviewDialog: React.FC<{
  event: AnomalyEvent
  onClose: () => void
  onSubmit: (o: ReviewOutcome) => void
  loading: boolean
}> = ({ event, onClose, onSubmit, loading }) => {
  const [outcome, setOutcome] = useState<ReviewOutcome>('TRUE_POSITIVE')
  const m = event.movement

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>Review Anomaly Event</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <Box sx={{ p: 2, bgcolor: 'rgba(255,167,38,0.06)', borderRadius: 2, border: '1px solid rgba(255,167,38,0.2)' }}>
          <Typography variant="body2"><strong>Type:</strong> {m?.type}</Typography>
          <Typography variant="body2"><strong>Qty:</strong> {m?.quantity}</Typography>
          <Typography variant="body2"><strong>Product:</strong> {m?.product?.name}</Typography>
          <Typography variant="body2"><strong>Warehouse:</strong> {m?.warehouse?.name}</Typography>
          <Typography variant="body2"><strong>Confidence:</strong> {(Number(event.confidenceScore) * 100).toFixed(1)}%</Typography>
        </Box>
        <TextField select id="review-outcome" label="Outcome" value={outcome} onChange={e => setOutcome(e.target.value as ReviewOutcome)} fullWidth>
          <MenuItem value="TRUE_POSITIVE">TRUE_POSITIVE — Confirmed anomaly</MenuItem>
          <MenuItem value="FALSE_POSITIVE">FALSE_POSITIVE — Normal movement, false alarm</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button id="review-submit-btn" variant="contained" color="warning" disabled={loading} onClick={() => onSubmit(outcome)}>
          {loading ? 'Submitting…' : 'Submit Review'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AnomaliesPage
