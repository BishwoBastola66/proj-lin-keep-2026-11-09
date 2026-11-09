#!/usr/bin/env python3
"""
Script to make all public GitHub repositories owned by the user private.
Zero external dependencies (uses standard library urllib).
"""

import getpass
import json
import os
import sys
import urllib.error
import urllib.request

GITHUB_API_URL = "https://api.github.com"


def github_request(endpoint, token, method="GET", payload=None):
    """Perform a request to the GitHub REST API."""
    url = f"{GITHUB_API_URL}{endpoint}" if endpoint.startswith("/") else endpoint
    data = json.dumps(payload).encode("utf-8") if payload is not None else None

    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", "make-repos-private-script")

    if payload is not None:
        req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 204:
                return {}
            content = response.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(error_body)
            msg = err_json.get("message", error_body)
        except Exception:
            msg = error_body
        raise RuntimeError(f"HTTP {e.code}: {msg}")


def get_authenticated_user(token):
    """Retrieve details about the authenticated user."""
    return github_request("/user", token)


def get_all_user_repos(token, username):
    """Fetch all repositories owned by the user using pagination."""
    repos = []
    page = 1
    per_page = 100

    print("Fetching repository list from GitHub...")
    while True:
        endpoint = f"/user/repos?visibility=public&affiliation=owner&per_page={per_page}&page={page}"
        batch = github_request(endpoint, token)
        if not batch:
            break

        for repo in batch:
            # Ensure the user is the actual owner (not an organization member/collaborator)
            if repo.get("owner", {}).get("login", "").lower() == username.lower():
                if not repo.get("private", False):
                    repos.append(repo)

        if len(batch) < per_page:
            break
        page += 1

    return repos


def make_repo_private(token, owner, repo_name):
    """Set repository visibility to private."""
    endpoint = f"/repos/{owner}/{repo_name}"
    payload = {"private": True, "visibility": "private"}
    return github_request(endpoint, token, method="PATCH", payload=payload)


def main():
    # 1. Get Access Token
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        token = getpass.getpass("Enter your GitHub Personal Access Token (hidden input): ").strip()

    if not token:
        print("Error: No token provided. Exiting.", file=sys.stderr)
        sys.exit(1)

    # 2. Authenticate
    try:
        user = get_authenticated_user(token)
        username = user.get("login")
        print(f"\nSuccessfully authenticated as GitHub user: @{username}")
    except Exception as e:
        print(f"Authentication failed: {e}", file=sys.stderr)
        sys.exit(1)

    # 3. Fetch Public Repos
    try:
        public_repos = get_all_user_repos(token, username)
    except Exception as e:
        print(f"Failed to fetch repositories: {e}", file=sys.stderr)
        sys.exit(1)

    if not public_repos:
        print("\nNo public repositories found for your account! All repositories are already private.")
        return

    print(f"\nFound {len(public_repos)} public repository(ies) owned by @{username}:")
    for idx, repo in enumerate(public_repos, 1):
        is_fork = " (Fork)" if repo.get("fork") else ""
        print(f"  {idx}. {repo['name']}{is_fork} -> {repo['html_url']}")

    # 4. Confirmation Prompt
    print("\nWARNING: This will convert all the above repositories from PUBLIC to PRIVATE.")
    confirmation = input("Are you sure you want to proceed? (yes/no): ").strip().lower()
    if confirmation not in ("yes", "y"):
        print("Aborted by user. No changes were made.")
        return

    # 5. Update Repositories
    print("\nUpdating repository visibility...")
    success_count = 0
    fail_count = 0

    for repo in public_repos:
        repo_name = repo["name"]
        try:
            make_repo_private(token, username, repo_name)
            print(f"  [SUCCESS] @{username}/{repo_name} is now PRIVATE")
            success_count += 1
        except Exception as e:
            print(f"  [FAILED]  @{username}/{repo_name}: {e}", file=sys.stderr)
            fail_count += 1

    # 6. Summary
    print("\n" + "=" * 40)
    print(f"Summary: {success_count} made private, {fail_count} failed.")
    print("=" * 40)


if __name__ == "__main__":
    main()
