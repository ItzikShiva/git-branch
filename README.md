# GitStatus Branch Management System

A full-stack application to help you connect to your GitHub repositories, track the status of branches, and manage them with notes and tags.

## Tech Stack

-   **Backend:** FastAPI, Python, SQLAlchemy, SQLite
-   **Frontend:** React, TypeScript, Material-UI

## Setup and Installation

### Prerequisites

-   Python 3.8+
-   Node.js v16+ and npm

### 1. Backend Setup

From the project root directory:

```bash
# Create a virtual environment
python -m venv venv

# Activate the environment
# On Windows:
venv\\Scripts\\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn app.main:app --reload
```

The backend will be running at `http://127.0.0.1:8000`.

### 2. Frontend Setup

In a separate terminal, navigate to the `frontend` directory:

```bash
# Change to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Run the frontend development server
npm start
```

### 3. Usage

1.  Open your web browser and navigate to `http://localhost:3000`.
2.  Add a repository using the format `owner/repo_name` (e.g., `facebook/react`).
3.  If the repository is private, you must provide a GitHub Personal Access Token with the `repo` scope.
4.  Once added, you can view all branches, refresh their status from GitHub, and add custom notes or tags to each branch.