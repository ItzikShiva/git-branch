import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Link,
} from '@mui/material';
import { fetchWatchedBranches, Branch } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

const WatchedList: React.FC = () => {
  const [watchedBranches, setWatchedBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWatchedBranches = async () => {
      try {
        setLoading(true);
        const response = await fetchWatchedBranches();
        setWatchedBranches(response);
        setError(null);
      } catch (err) {
        setError('Failed to load watched branches.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadWatchedBranches();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Watched Branches
      </Typography>
      {watchedBranches.length === 0 ? (
        <Typography>You are not watching any branches yet. You can watch a branch from the repository's branch detail page.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="watched branches table">
            <TableHead>
              <TableRow>
                <TableCell>Branch Name</TableCell>
                <TableCell>Repository</TableCell>
                <TableCell>Last Commit</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {watchedBranches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>
                     <Link component={RouterLink} to={`/repos/${branch.repo_id}/branches`}>
                        {branch.branch_name}
                     </Link>
                  </TableCell>
                  <TableCell>{`Repo ID: ${branch.repo_id}`}</TableCell> {/* Note: We need a way to get the repo name */}
                  <TableCell>{branch.last_commit_message.split('\n')[0]}</TableCell>
                  <TableCell>{branch.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default WatchedList; 