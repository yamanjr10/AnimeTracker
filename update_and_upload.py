#!/usr/bin/env python3
"""
update_and_upload.py
--------------------
Searches your PC for "My Anime List.json", counts all HTML files in
C:\\Users\\Acer\\webdevlopement\\ (including nested subfolders), merges the data,
and uploads the result to a GitHub repo as a combined JSON.

Environment variables required:
  GITHUB_TOKEN  : your Personal Access Token with repo/public_repo scope
  GITHUB_REPO   : owner/repo  (e.g. username/anime-dashboard)
  GITHUB_PATH   : path where JSON should be uploaded (e.g. data/anime.json)

Run this script manually or schedule it in Windows Task Scheduler to auto-update.
"""

import os
import sys
import json
import base64
from pathlib import Path
import requests
from datetime import datetime

# ---------- Configuration ----------
USERNAME_DIR = Path(r"C:\\Users\\Acer")
PROJECT_DIR = USERNAME_DIR / "webdevlopement"
TARGET_JSON_NAME = "My Anime List.json"
SEARCH_DIRS = [USERNAME_DIR / "Documents", USERNAME_DIR / "Downloads", USERNAME_DIR / "Desktop", USERNAME_DIR]

# ---------- Helper Functions ----------

def find_anime_json() -> Path | None:
    """Search common directories for the anime JSON file."""
    for base in SEARCH_DIRS:
        for root, _, files in os.walk(base):
            for f in files:
                if f.lower() == TARGET_JSON_NAME.lower():
                    return Path(root) / f
    return None


def count_html_files(base_dir: Path) -> int:
    """Count all .html files recursively in base_dir."""
    total = 0
    for root, _, files in os.walk(base_dir):
        for f in files:
            if f.lower().endswith(".html"):
                total += 1
    return total


def github_upload(token: str, repo: str, path: str, content: bytes, msg: str):
    """Create or update a file in GitHub repo via REST API."""
    api = f"https://api.github.com/repos/{repo}/contents/{path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    # Check if file exists (to get sha)
    sha = None
    r = requests.get(api, headers=headers)
    if r.status_code == 200:
        sha = r.json().get("sha")

    payload = {
        "message": msg,
        "content": base64.b64encode(content).decode("utf-8"),
    }
    if sha:
        payload["sha"] = sha

    r = requests.put(api, headers=headers, json=payload)
    if not r.ok:
        print("❌ Upload failed:", r.status_code, r.text)
        sys.exit(1)
    return r.json()


# ---------- Main ----------

def main():
    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPO")
    path = os.getenv("GITHUB_PATH")
    if not all([token, repo, path]):
        print("❌ Please set environment variables: GITHUB_TOKEN, GITHUB_REPO, GITHUB_PATH")
        sys.exit(1)

    anime_file = find_anime_json()
    if not anime_file:
        print(f"❌ Could not find '{TARGET_JSON_NAME}' in {SEARCH_DIRS}")
        sys.exit(1)

    print(f"✅ Found anime list: {anime_file}")
    try:
        anime_data = json.loads(anime_file.read_text(encoding="utf-8"))
    except Exception as e:
        print("❌ Failed to read/parse anime JSON:", e)
        sys.exit(1)

    # Ensure anime_data is a list
    if isinstance(anime_data, dict):
        anime_list = [anime_data]
    elif isinstance(anime_data, list):
        anime_list = anime_data
    else:
        print("❌ Unexpected JSON format. Expected a list or dict of anime items.")
        sys.exit(1)

    # Count HTML files
    total_html = count_html_files(PROJECT_DIR)
    print(f"✅ Found {total_html} HTML files in {PROJECT_DIR}")

    # Merge data
    combined = {
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "anime": anime_list,
        "stats": {
            "totalProjects": total_html,
        },
    }

    output_json = json.dumps(combined, indent=2)
    print("📤 Uploading combined data to GitHub...")
    res = github_upload(token, repo, path, output_json.encode("utf-8"), msg="Auto-update Anime + Projects data")
    html_url = res.get("content", {}).get("html_url")
    print("✅ Upload complete. File URL:", html_url)


if __name__ == "__main__":
    main()
