import requests
import json

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

def test_add_repository():
    """Test adding a repository"""
    repo_data = {
        "name": "git-branch",
        "owner": "ItzikShiva",
        "full_name": "ItzikShiva/git-branch",
        "github_token": None  # We'll use public repo for now
    }
    
    response = requests.post(f"{BASE_URL}/repos", json=repo_data)
    print(f"Add Repository Response: {response.status_code}")
    if response.status_code == 201:
        print(f"Repository added: {response.json()}")
        return response.json()["id"]
    else:
        print(f"Error: {response.text}")
        return None

def test_get_branches(repo_id):
    """Test getting branches for a repository"""
    response = requests.get(f"{BASE_URL}/branches/{repo_id}?refresh=true")
    print(f"\nGet Branches Response: {response.status_code}")
    if response.status_code == 200:
        branches = response.json()
        print(f"Repository: {branches['repo']}")
        print(f"Number of branches: {len(branches['branches'])}")
        for branch in branches['branches']:
            print(f"  - {branch['name']}: {branch['status']}")
        return branches
    else:
        print(f"Error: {response.text}")
        return None

def test_get_all_branches():
    """Test getting all branches"""
    response = requests.get(f"{BASE_URL}/branches")
    print(f"\nGet All Branches Response: {response.status_code}")
    if response.status_code == 200:
        all_branches = response.json()
        print(f"Number of repositories: {len(all_branches)}")
        for repo_branches in all_branches:
            print(f"Repository: {repo_branches['repo']}")
            print(f"  Branches: {len(repo_branches['branches'])}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("🧪 Testing GitStatus API...")
    
    # Test 1: Add repository
    repo_id = test_add_repository()
    
    if repo_id:
        # Test 2: Get branches for the repository
        test_get_branches(repo_id)
        
        # Test 3: Get all branches
        test_get_all_branches()
    
    print("\n✅ API testing complete!") 