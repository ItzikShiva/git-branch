import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Refresh,
  Edit,
  Archive,
} from '@mui/icons-material';
import { fetchRepositoryBranches, updateBranch, archiveBranch, RepositoryBranches, Branch } from '../services/api';

const BranchDetails: React.FC = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const [data, setData] = useState<RepositoryBranches | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; branch: Branch | null }>({ open: false, branch: null });
  const [editData, setEditData] = useState({
    tags: '',
    notes: '',
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

  const loadBranches = useCallback(async (refresh = false) => {
    if (!repoId) return;
    try {
      setLoading(true);
      const response = await fetchRepositoryBranches(parseInt(repoId), refresh);
      setData(response);
      setError(null);
    } catch (err) {
      const errorMessage = 'Failed to load branch data';
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage });
      console.error('Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleEditBranch = (branch: Branch) => {
    setEditData({
      tags: Array.isArray(branch.tags) ? branch.tags.join(', ') : '',
      notes: branch.notes || '',
    });
    setEditDialog({ open: true, branch });
  };

  const handleSaveBranch = async () => {
    if (!editDialog.branch) return;
    try {
      const updatedBranch = await updateBranch(editDialog.branch.id, {
        notes: editData.notes,
        tags: editData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      setData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          branches: prevData.branches.map(b => b.id === updatedBranch.id ? updatedBranch : b),
        };
      });
      setSnackbar({ open: true, message: 'Branch updated successfully!' });
      setEditDialog({ open: false, branch: null });
    } catch (err) {
      const errorMessage = 'Failed to update branch';
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage });
      console.error('Error updating branch:', err);
    }
  };

  const handleArchiveBranch = async (branch: Branch) => {
    if (window.confirm(`Are you sure you want to archive the branch "${branch.branch_name}"?`)) {
        try {
        await archiveBranch(branch.id);
        setData(prevData => {
            if (!prevData) return null;
            return {
            ...prevData,
            branches: prevData.branches.map(b => b.id === branch.id ? { ...b, archived: true } : b),
            };
        });
        setSnackbar({ open: true, message: 'Branch archived successfully!' });
        } catch (err) {
            const errorMessage = 'Failed to archive branch';
            setError(errorMessage);
            setSnackbar({ open: true, message: errorMessage });
            console.error('Error archiving branch:', err);
        }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="warning">
        Repository not found
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{data.repo} - Branches</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => loadBranches(true)}
        >
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Branch</TableCell>
              <TableCell>Last Commit</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>PR</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.branches.filter(b => !b.archived).map((branch) => (
              <TableRow
                key={branch.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body1" fontWeight="bold">
                    {branch.branch_name || 'N/A'}
                  </Typography>
                  {branch.notes && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {branch.notes}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {branch.last_commit_message ? (
                    <Box>
                      <Tooltip title={branch.last_commit_message}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: '250px' }}>
                          {branch.last_commit_message.split('\n')[0]}
                        </Typography>
                      </Tooltip>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(branch.last_commit_date).toLocaleString()}
                      </Typography>
                    </Box>
                  ) : (
                     <Typography variant="body2" color="textSecondary">Not available</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{branch.author || 'N/A'}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={branch.status}
                    size="small"
                    color={branch.status === 'active' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {branch.pr_url ? (
                    <Link href={branch.pr_url} target="_blank" rel="noopener">
                      <Chip
                        label={branch.pr_state}
                        size="small"
                        clickable
                        color={
                          branch.pr_state === 'open' ? 'success' :
                          branch.pr_state === 'merged' ? 'info' :
                          branch.pr_state === 'draft' ? 'warning' : 'default'
                        }
                      />
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {branch.tags && Array.isArray(branch.tags) && branch.tags.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {branch.tags.map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditBranch(branch)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                     <Tooltip title="Archive">
                      <IconButton
                        size="small"
                        onClick={() => handleArchiveBranch(branch)}
                        disabled={branch.archived}
                      >
                        <Archive fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, branch: null })} fullWidth maxWidth="sm">
        <DialogTitle>Edit Branch: {editDialog.branch?.branch_name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="tags"
            label="Tags (comma-separated)"
            type="text"
            fullWidth
            variant="outlined"
            value={editData.tags}
            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="notes"
            label="Notes"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, branch: null })}>Cancel</Button>
          <Button onClick={handleSaveBranch}>Save</Button>
        </DialogActions>
      </Dialog>

       <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default BranchDetails; 