#!/usr/bin/env python3
"""
safety_manager.py - Comprehensive safety system for codebase operations
Provides backup, rollback, trash, and recovery capabilities
"""

import os
import json
import shutil
import hashlib
import tarfile
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
import subprocess

class SafetyManager:
    """
    Central safety system for protecting codebase during operations

    Features:
    - Timestamped backups before operations
    - Trash system (soft delete)
    - Change tracking and audit log
    - Rollback capabilities
    - Git integration
    """

    def __init__(self, project_root: str):
        self.project_root = Path(project_root).resolve()
        self.safety_dir = self.project_root / '.codebase-safety'
        self.backup_dir = self.safety_dir / 'backups'
        self.trash_dir = self.safety_dir / 'trash'
        self.log_file = self.safety_dir / 'operation_log.json'
        self.manifest_file = self.safety_dir / 'file_manifest.json'

        # Create safety directories
        self.safety_dir.mkdir(parents=True, exist_ok=True)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.trash_dir.mkdir(parents=True, exist_ok=True)

        # Initialize or load operation log
        self.operation_log = self._load_operation_log()

    def _load_operation_log(self) -> List[Dict]:
        """Load operation history from log file"""
        if self.log_file.exists():
            with open(self.log_file, 'r') as f:
                return json.load(f)
        return []

    def _save_operation_log(self):
        """Save operation history to log file"""
        with open(self.log_file, 'w') as f:
            json.dump(self.operation_log, f, indent=2)

    def _get_git_status(self) -> Optional[Dict]:
        """Check git status of the repository"""
        try:
            # Check if in git repo
            result = subprocess.run(
                ['git', 'rev-parse', '--is-inside-work-tree'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                return None

            # Get current branch
            branch_result = subprocess.run(
                ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )

            # Get current commit
            commit_result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )

            # Check for uncommitted changes
            status_result = subprocess.run(
                ['git', 'status', '--porcelain'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )

            return {
                'enabled': True,
                'branch': branch_result.stdout.strip(),
                'commit': commit_result.stdout.strip(),
                'has_changes': bool(status_result.stdout.strip())
            }

        except FileNotFoundError:
            return None

    def create_backup(self, description: str = "Manual backup") -> str:
        """
        Create a timestamped backup of the entire project

        Args:
            description: Description of why backup was created

        Returns:
            Path to backup archive
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"backup_{timestamp}.tar.gz"
        backup_path = self.backup_dir / backup_name

        print(f"🔒 Creating backup: {backup_name}")

        # Create tar.gz archive
        with tarfile.open(backup_path, "w:gz") as tar:
            # Add all files except safety directory
            for item in self.project_root.iterdir():
                if item.name != '.codebase-safety':
                    tar.add(item, arcname=item.name)

        # Log the backup
        backup_info = {
            'timestamp': timestamp,
            'description': description,
            'path': str(backup_path),
            'size_bytes': backup_path.stat().st_size,
            'git_info': self._get_git_status()
        }

        self.operation_log.append({
            'type': 'backup',
            'timestamp': timestamp,
            'info': backup_info
        })
        self._save_operation_log()

        print(f"✅ Backup created: {backup_path} ({self._format_size(backup_path.stat().st_size)})")
        return str(backup_path)

    def restore_backup(self, backup_path: str) -> bool:
        """
        Restore from a backup archive

        Args:
            backup_path: Path to backup .tar.gz file

        Returns:
            True if successful
        """
        backup_file = Path(backup_path)

        if not backup_file.exists():
            print(f"❌ Backup not found: {backup_path}")
            return False

        # Create safety backup before restoring
        print("🔒 Creating safety backup before restore...")
        self.create_backup("Pre-restore safety backup")

        print(f"📦 Restoring from: {backup_file.name}")

        # Extract archive
        with tarfile.open(backup_file, "r:gz") as tar:
            tar.extractall(self.project_root)

        # Log the restore
        self.operation_log.append({
            'type': 'restore',
            'timestamp': datetime.now().strftime("%Y%m%d_%H%M%S"),
            'backup_path': str(backup_path)
        })
        self._save_operation_log()

        print("✅ Restore complete!")
        return True

    def list_backups(self) -> List[Dict]:
        """List all available backups"""
        backups = []

        for backup_file in sorted(self.backup_dir.glob("backup_*.tar.gz")):
            backups.append({
                'name': backup_file.name,
                'path': str(backup_file),
                'size': self._format_size(backup_file.stat().st_size),
                'created': datetime.fromtimestamp(backup_file.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            })

        return backups

    def move_to_trash(self, file_path: str, reason: str = "Deleted by operation") -> bool:
        """
        Move file to trash instead of permanent deletion

        Args:
            file_path: Path to file to trash
            reason: Reason for deletion

        Returns:
            True if successful
        """
        source = Path(file_path)

        if not source.exists():
            print(f"⚠️  File not found: {file_path}")
            return False

        # Create trash directory structure
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        trash_subdir = self.trash_dir / timestamp
        trash_subdir.mkdir(exist_ok=True)

        # Move file to trash
        destination = trash_subdir / source.name
        shutil.move(str(source), str(destination))

        # Save metadata
        metadata = {
            'original_path': str(source),
            'trash_path': str(destination),
            'timestamp': timestamp,
            'reason': reason,
            'size_bytes': destination.stat().st_size
        }

        metadata_file = trash_subdir / f"{source.name}.meta.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)

        # Log the operation
        self.operation_log.append({
            'type': 'trash',
            'timestamp': timestamp,
            'file': str(source),
            'reason': reason
        })
        self._save_operation_log()

        print(f"🗑️  Moved to trash: {source.name}")
        return True

    def restore_from_trash(self, trash_item: str) -> bool:
        """
        Restore a file from trash

        Args:
            trash_item: Name or timestamp of trashed item

        Returns:
            True if successful
        """
        # Find trash item
        for trash_subdir in self.trash_dir.iterdir():
            if trash_subdir.is_dir() and trash_item in str(trash_subdir):
                # Find metadata
                metadata_files = list(trash_subdir.glob("*.meta.json"))
                if metadata_files:
                    with open(metadata_files[0], 'r') as f:
                        metadata = json.load(f)

                    original_path = Path(metadata['original_path'])
                    trash_path = Path(metadata['trash_path'])

                    # Restore file
                    if trash_path.exists():
                        original_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.move(str(trash_path), str(original_path))

                        print(f"♻️  Restored: {original_path}")

                        # Log the operation
                        self.operation_log.append({
                            'type': 'restore_from_trash',
                            'timestamp': datetime.now().strftime("%Y%m%d_%H%M%S"),
                            'file': str(original_path)
                        })
                        self._save_operation_log()

                        return True

        print(f"❌ Trash item not found: {trash_item}")
        return False

    def list_trash(self) -> List[Dict]:
        """List all items in trash"""
        trash_items = []

        for trash_subdir in sorted(self.trash_dir.iterdir(), reverse=True):
            if trash_subdir.is_dir():
                metadata_files = list(trash_subdir.glob("*.meta.json"))
                for meta_file in metadata_files:
                    with open(meta_file, 'r') as f:
                        metadata = json.load(f)
                    trash_items.append(metadata)

        return trash_items

    def cleanup_old_trash(self, days: int = 30):
        """Remove trash items older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        removed_count = 0

        for trash_subdir in self.trash_dir.iterdir():
            if trash_subdir.is_dir():
                # Parse timestamp from directory name
                try:
                    dir_date = datetime.strptime(trash_subdir.name, "%Y%m%d_%H%M%S")
                    if dir_date < cutoff_date:
                        shutil.rmtree(trash_subdir)
                        removed_count += 1
                except ValueError:
                    continue

        if removed_count > 0:
            print(f"🧹 Cleaned up {removed_count} old trash items")

    def git_pre_operation_commit(self, operation_name: str) -> Optional[str]:
        """
        Create a git commit before operation

        Args:
            operation_name: Name of operation to perform

        Returns:
            Commit hash if successful, None otherwise
        """
        git_status = self._get_git_status()

        if not git_status or not git_status['enabled']:
            print("ℹ️  Git not available, skipping pre-operation commit")
            return None

        if not git_status['has_changes']:
            print("ℹ️  No uncommitted changes, skipping pre-operation commit")
            return git_status['commit']

        print(f"📝 Creating git commit before {operation_name}...")

        # Add all changes
        subprocess.run(['git', 'add', '-A'], cwd=self.project_root)

        # Create commit
        commit_msg = f"Pre-operation snapshot: {operation_name}\n\n🤖 Auto-commit by codebase-architect"
        result = subprocess.run(
            ['git', 'commit', '-m', commit_msg],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            # Get new commit hash
            commit_result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            commit_hash = commit_result.stdout.strip()
            print(f"✅ Git commit created: {commit_hash[:7]}")
            return commit_hash

        return None

    def _format_size(self, size_bytes: int) -> str:
        """Format size in bytes to human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"


def main():
    """CLI interface for safety manager"""
    import argparse

    parser = argparse.ArgumentParser(description='Codebase safety manager')
    parser.add_argument('--root', default='.', help='Project root directory')

    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # Backup commands
    backup_parser = subparsers.add_parser('backup', help='Create a backup')
    backup_parser.add_argument('--description', default='Manual backup', help='Backup description')

    restore_parser = subparsers.add_parser('restore', help='Restore from backup')
    restore_parser.add_argument('backup_path', help='Path to backup file')

    list_backups_parser = subparsers.add_parser('list-backups', help='List all backups')

    # Trash commands
    trash_parser = subparsers.add_parser('trash', help='Move file to trash')
    trash_parser.add_argument('file', help='File to trash')
    trash_parser.add_argument('--reason', default='Manual deletion', help='Reason for deletion')

    untrash_parser = subparsers.add_parser('restore-trash', help='Restore from trash')
    untrash_parser.add_argument('item', help='Trash item to restore')

    list_trash_parser = subparsers.add_parser('list-trash', help='List trash contents')

    cleanup_parser = subparsers.add_parser('cleanup-trash', help='Clean up old trash')
    cleanup_parser.add_argument('--days', type=int, default=30, help='Days to keep')

    # Git commands
    git_parser = subparsers.add_parser('git-commit', help='Create pre-operation git commit')
    git_parser.add_argument('operation', help='Operation name')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Initialize safety manager
    manager = SafetyManager(args.root)

    # Execute command
    if args.command == 'backup':
        manager.create_backup(args.description)

    elif args.command == 'restore':
        manager.restore_backup(args.backup_path)

    elif args.command == 'list-backups':
        backups = manager.list_backups()
        if backups:
            print("\n📦 Available Backups:\n")
            for backup in backups:
                print(f"  {backup['name']}")
                print(f"    Created: {backup['created']}")
                print(f"    Size: {backup['size']}")
                print(f"    Path: {backup['path']}\n")
        else:
            print("No backups found")

    elif args.command == 'trash':
        manager.move_to_trash(args.file, args.reason)

    elif args.command == 'restore-trash':
        manager.restore_from_trash(args.item)

    elif args.command == 'list-trash':
        trash_items = manager.list_trash()
        if trash_items:
            print("\n🗑️  Trash Contents:\n")
            for item in trash_items:
                print(f"  {Path(item['original_path']).name}")
                print(f"    Original: {item['original_path']}")
                print(f"    Trashed: {item['timestamp']}")
                print(f"    Reason: {item['reason']}\n")
        else:
            print("Trash is empty")

    elif args.command == 'cleanup-trash':
        manager.cleanup_old_trash(args.days)

    elif args.command == 'git-commit':
        manager.git_pre_operation_commit(args.operation)


if __name__ == '__main__':
    main()
