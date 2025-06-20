import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Storage,
  AccountTree,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import { fetchAllBranches, RepositoryBranches } from '../services/api';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<RepositoryBranches[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetchAllBranches();
      setData(response);
      setError(null);
    } catch (err) {
      setError('Failed to load branch data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'archived':
        return 'default';
      case 'deleted':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getPRStatusColor = (prState?: string) => {
    switch (prState) {
      case 'open':
        return 'success';
      case 'closed':
        return 'error';
      case 'merged':
        return 'info';
      case 'draft':
        return 'warning';
      default:
        return 'default';
    }
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

  const totalRepos = data.length;
  const totalBranches = data.reduce((sum, repo) => sum + repo.branches.length, 0);
  const activeBranches = data.reduce(
    (sum, repo) => sum + repo.branches.filter(b => b.status === 'active').length,
    0
  );
  const branchesWithPR = data.reduce(
    (sum, repo) => sum + repo.branches.filter(b => b.has_pr).length,
    0
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 4 }}>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Storage color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Repositories
                </Typography>
                <Typography variant="h4">{totalRepos}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <AccountTree color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Branches
                </Typography>
                <Typography variant="h4">{totalBranches}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Active Branches
                </Typography>
                <Typography variant="h4">{activeBranches}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <TrendingUp color="info" sx={{ mr: 1 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  With PR
                </Typography>
                <Typography variant="h4">{branchesWithPR}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Repository List */}
      <Typography variant="h5" gutterBottom>
        Repositories
      </Typography>
      
      {data.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="textSecondary" align="center">
              No repositories found. Add a repository to get started.
            </Typography>
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="contained"
                component={RouterLink}
                to="/repositories"
              >
                Add Repository
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={3}>
          {data.map((repoData, index) => (
            <Card key={index}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">{repoData.repo}</Typography>
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to={`/branches/${index + 1}`}
                  >
                    View Branches ({repoData.branches.length})
                  </Button>
                </Box>
                
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {repoData.branches.slice(0, 6).map((branch, branchIndex) => (
                    <Box
                      key={branchIndex}
                      sx={{
                        flex: '1 1 300px',
                        minWidth: 300,
                        p: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {branch.branch_name}
                        </Typography>
                        {branch.author && (
                          <Typography variant="caption" color="textSecondary">
                            by {branch.author}
                          </Typography>
                        )}
                      </Box>
                      <Box display="flex" gap={0.5}>
                        <Chip
                          label={branch.status}
                          size="small"
                          color={getStatusColor(branch.status) as any}
                        />
                        {branch.has_pr && branch.pr_state && (
                          <Chip
                            label={branch.pr_state}
                            size="small"
                            color={getPRStatusColor(branch.pr_state) as any}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                  {repoData.branches.length > 6 && (
                    <Box width="100%">
                      <Typography variant="body2" color="textSecondary" align="center">
                        +{repoData.branches.length - 6} more branches
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Dashboard; 