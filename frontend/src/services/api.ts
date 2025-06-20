import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Branch {
  id: number;
  branch_name: string;
  repo_id: number;
  last_commit_sha: string;
  last_commit_date: string;
  last_commit_message: string;
  author: string;
  has_pr: boolean;
  pr_state: string | null;
  pr_url: string | null;
  status: string;
  tags: string[];
  notes: string | null;
  archived: boolean;
  watched: boolean;
  created_at: string;
  updated_at: string;
}

export interface RepositoryBranches {
  repo: string;
  branches: Branch[];
}

export interface Repository {
  id: number;
  name: string;
  owner: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Fetch all branches from all repositories
export const fetchAllBranches = async (): Promise<RepositoryBranches[]> => {
  const response = await api.get('/branches');
  return response.data;
};

// Fetch branches for a specific repository
export const fetchRepositoryBranches = async (repoId: number, refresh = false): Promise<RepositoryBranches> => {
  const response = await api.get(`/branches/${repoId}`, {
    params: { refresh }
  });
  return response.data;
};

// Fetch all repositories
export const fetchRepositories = async (): Promise<Repository[]> => {
  const response = await api.get('/repos');
  return response.data;
};

// Add a new repository
export const addRepository = async (repoData: {
  name: string;
  owner: string;
  full_name: string;
  github_token?: string;
}): Promise<Repository> => {
  const payload: any = { ...repoData };
  if (!payload.github_token) {
    delete payload.github_token;
  }
  const response = await api.post('/repos', payload);
  return response.data;
};

// Update branch metadata
export const updateBranch = async (branchId: number, updates: {
  status?: string;
  tags?: string[];
  notes?: string;
  archived?: boolean;
  watched?: boolean;
}): Promise<Branch> => {
  const response = await api.put(`/branches/${branchId}`, updates);
  return response.data;
};

// Archive a branch
export const archiveBranch = async (branchId: number): Promise<Branch> => {
  const response = await api.post(`/branches/${branchId}/archive`);
  return response.data;
};

// Delete a repository
export const deleteRepository = async (repoId: number): Promise<void> => {
  await api.delete(`/repos/${repoId}`);
};

export const fetchWatchedBranches = async (): Promise<Branch[]> => {
  const response = await api.get('/branches/watched');
  return response.data;
}; 