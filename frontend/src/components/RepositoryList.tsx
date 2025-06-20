import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  DialogContentText,
  Snackbar,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { fetchRepositories, addRepository, deleteRepository, Repository } from '../services/api';

const RepositoryList: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    full_name: '',
    github_token: '',
  });

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const data = await fetchRepositories();
      setRepositories(data);
      setError(null);
    } catch (err) {
      setError('Failed to load repositories');
      console.error('Error loading repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRepository = async () => {
    try {
      const newRepo = await addRepository(formData);
      setRepositories([...repositories, newRepo]);
      setOpenDialog(false);
      setFormData({ name: '', owner: '', full_name: '', github_token: '' });
    } catch (err) {
      setError('Failed to add repository');
      console.error('Error adding repository:', err);
    }
  };

  const handleDeleteRepository = async (repoId: number) => {
    try {
      await deleteRepository(repoId);
      setRepositories(repositories.filter(repo => repo.id !== repoId));
    } catch (err) {
      setError('Failed to delete repository');
      console.error('Error deleting repository:', err);
    }
  };

  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      const [, owner, name] = match;
      return { owner, name: name.replace('.git', ''), full_name: `${owner}/${name.replace('.git', '')}` };
    }
    return null;
  };

  const handleUrlChange = (url: string) => {
    const parsed = parseGitHubUrl(url);
    if (parsed) {
      setFormData({
        ...formData,
        owner: parsed.owner,
        name: parsed.name,
        full_name: parsed.full_name,
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Repositories</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add Repository
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {repositories.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="textSecondary" align="center">
              No repositories found. Add your first repository to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={3}>
          {repositories.map((repo) => (
            <Card key={repo.id} sx={{ flex: '1 1 350px', minWidth: 350 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {repo.full_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Owner: {repo.owner}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Added: {new Date(repo.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteRepository(repo.id)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add Repository Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Repository</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="GitHub Repository URL"
            placeholder="https://github.com/owner/repo.git"
            margin="normal"
            onChange={(e) => handleUrlChange(e.target.value)}
            helperText="Enter the full GitHub repository URL"
          />
          <TextField
            fullWidth
            label="Repository Name"
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Owner"
            margin="normal"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          />
          <TextField
            fullWidth
            label="Full Name"
            margin="normal"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          <TextField
            fullWidth
            label="GitHub Token (Optional)"
            margin="normal"
            type="password"
            value={formData.github_token}
            onChange={(e) => setFormData({ ...formData, github_token: e.target.value })}
            helperText="Required for private repositories"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddRepository} variant="contained">
            Add Repository
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RepositoryList; 