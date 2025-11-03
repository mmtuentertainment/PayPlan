#!/usr/bin/env python3
"""
restructure_planner.py - Generate migration plans for codebase reorganization
Creates step-by-step plans to safely restructure projects
"""

import os
import json
import argparse
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set, Tuple, Optional
import re

class RestructurePlanner:
    def __init__(self, root_path: str, target_pattern: str = 'feature-based'):
        self.root_path = Path(root_path).resolve()
        self.target_pattern = target_pattern
        self.current_structure = {}
        self.migration_plan = {
            'pattern': target_pattern,
            'steps': [],
            'file_moves': [],
            'import_updates': [],
            'new_directories': [],
            'risk_assessment': {}
        }
        
        # Pattern templates
        self.patterns = {
            'feature-based': {
                'description': 'Organize by features/modules',
                'structure': {
                    'features/': ['components', 'hooks', 'services', 'types', 'utils'],
                    'shared/': ['components', 'hooks', 'utils', 'types'],
                    'core/': ['api', 'config', 'constants', 'types']
                }
            },
            'mvc': {
                'description': 'Model-View-Controller pattern',
                'structure': {
                    'models/': [],
                    'views/': ['components', 'layouts', 'pages'],
                    'controllers/': [],
                    'services/': [],
                    'utils/': []
                }
            },
            'clean': {
                'description': 'Clean Architecture',
                'structure': {
                    'domain/': ['entities', 'repositories', 'use-cases'],
                    'application/': ['services', 'dto', 'interfaces'],
                    'infrastructure/': ['database', 'api', 'config'],
                    'presentation/': ['controllers', 'views', 'viewmodels']
                }
            },
            'ddd': {
                'description': 'Domain-Driven Design',
                'structure': {
                    'domain/': ['models', 'services', 'repositories', 'events'],
                    'application/': ['commands', 'queries', 'handlers'],
                    'infrastructure/': ['persistence', 'messaging', 'api'],
                    'presentation/': ['api', 'web', 'cli']
                }
            },
            'modular': {
                'description': 'Self-contained modules',
                'structure': {
                    'modules/': [],  # Dynamic based on analysis
                    'shared/': ['types', 'utils', 'constants'],
                    'core/': ['config', 'bootstrap']
                }
            }
        }
    
    def analyze_current_structure(self) -> Dict:
        """Analyze the current project structure"""
        print(f"Analyzing current structure of {self.root_path}")
        
        self.current_structure = {
            'files': defaultdict(list),
            'directories': set(),
            'file_types': defaultdict(int),
            'patterns_detected': []
        }
        
        for root, dirs, files in os.walk(self.root_path):
            # Skip common ignored directories
            dirs[:] = [d for d in dirs if not self.should_ignore(d)]
            
            rel_dir = Path(root).relative_to(self.root_path)
            self.current_structure['directories'].add(str(rel_dir))
            
            for file in files:
                if self.should_ignore(file):
                    continue
                    
                file_path = Path(root) / file
                rel_path = file_path.relative_to(self.root_path)
                file_type = self.classify_file(file)
                
                self.current_structure['files'][file_type].append(str(rel_path))
                self.current_structure['file_types'][file_type] += 1
        
        # Detect current patterns
        self.detect_current_patterns()
        
        return self.current_structure
    
    def should_ignore(self, path: str) -> bool:
        """Check if path should be ignored"""
        ignore_patterns = [
            'node_modules', '.git', '__pycache__', 'dist', 'build',
            '.DS_Store', 'Thumbs.db', '*.pyc', '*.pyo'
        ]
        
        path_str = str(path).lower()
        for pattern in ignore_patterns:
            if pattern.startswith('*'):
                if path_str.endswith(pattern[1:]):
                    return True
            elif pattern in path_str:
                return True
        return False
    
    def classify_file(self, filename: str) -> str:
        """Classify file by type"""
        name_lower = filename.lower()
        ext = Path(filename).suffix.lower()
        
        # Components
        if any(pattern in name_lower for pattern in ['component', '.jsx', '.tsx']):
            return 'component'
        
        # Services/API
        if any(pattern in name_lower for pattern in ['service', 'api', 'client']):
            return 'service'
        
        # Models/Types
        if any(pattern in name_lower for pattern in ['model', 'schema', 'entity', 'type', 'interface']):
            return 'model'
        
        # Controllers
        if 'controller' in name_lower or 'handler' in name_lower:
            return 'controller'
        
        # Tests
        if any(pattern in name_lower for pattern in ['test', 'spec', '.test.', '.spec.']):
            return 'test'
        
        # Config
        if any(pattern in name_lower for pattern in ['config', 'env', 'settings']):
            return 'config'
        
        # Utils
        if any(pattern in name_lower for pattern in ['util', 'helper', 'common']):
            return 'util'
        
        # Views/Pages
        if any(pattern in name_lower for pattern in ['view', 'page', 'screen']):
            return 'view'
        
        # Hooks (React)
        if 'hook' in name_lower or name_lower.startswith('use'):
            return 'hook'
        
        # Default by extension
        ext_map = {
            '.css': 'style',
            '.scss': 'style', 
            '.less': 'style',
            '.md': 'doc',
            '.txt': 'doc',
            '.json': 'config',
            '.yml': 'config',
            '.yaml': 'config',
        }
        
        return ext_map.get(ext, 'other')
    
    def detect_current_patterns(self):
        """Detect patterns in current structure"""
        dirs = self.current_structure['directories']
        
        # Check for MVC pattern
        if all(d in str(dirs) for d in ['model', 'view', 'controller']):
            self.current_structure['patterns_detected'].append('mvc')
        
        # Check for feature-based
        if 'features' in str(dirs) or 'modules' in str(dirs):
            self.current_structure['patterns_detected'].append('feature-based')
        
        # Check for clean architecture
        if all(d in str(dirs) for d in ['domain', 'application', 'infrastructure']):
            self.current_structure['patterns_detected'].append('clean')
        
        # Check for traditional src structure
        if 'src' in str(dirs):
            self.current_structure['patterns_detected'].append('traditional')
    
    def generate_plan(self) -> Dict:
        """Generate a migration plan"""
        print(f"Generating migration plan to {self.target_pattern} pattern")
        
        # Analyze current structure
        self.analyze_current_structure()
        
        # Generate target structure
        target_structure = self.generate_target_structure()
        
        # Plan directory creation
        self.plan_directory_creation(target_structure)
        
        # Plan file moves
        self.plan_file_moves(target_structure)
        
        # Identify import updates needed
        self.identify_import_updates()
        
        # Assess risks
        self.assess_risks()
        
        # Generate migration steps
        self.generate_migration_steps()
        
        return self.migration_plan
    
    def generate_target_structure(self) -> Dict:
        """Generate the target directory structure"""
        pattern = self.patterns.get(self.target_pattern, {})
        structure = pattern.get('structure', {})
        
        # For modular pattern, detect natural modules
        if self.target_pattern == 'modular':
            modules = self.detect_natural_modules()
            structure['modules/'] = modules
        
        return structure
    
    def detect_natural_modules(self) -> List[str]:
        """Detect natural module boundaries in the code"""
        modules = set()
        
        # Look for feature-like directories
        for dir_path in self.current_structure['directories']:
            parts = Path(dir_path).parts
            if len(parts) > 0:
                # Common module indicators
                if parts[0] not in ['src', 'lib', 'app', 'dist', 'build']:
                    modules.add(parts[0])
        
        # Analyze file groupings
        file_groups = defaultdict(set)
        for file_type, files in self.current_structure['files'].items():
            for file in files:
                # Extract potential module name from path
                parts = Path(file).parts
                if len(parts) > 1:
                    potential_module = parts[0] if parts[0] != 'src' else parts[1] if len(parts) > 1 else None
                    if potential_module:
                        file_groups[potential_module].add(file_type)
        
        # Keep groups with diverse file types as modules
        for module, types in file_groups.items():
            if len(types) >= 3:  # Has multiple concerns
                modules.add(module)
        
        return list(modules)[:10]  # Limit to 10 modules
    
    def plan_directory_creation(self, target_structure: Dict):
        """Plan which directories need to be created"""
        for base_dir, subdirs in target_structure.items():
            self.migration_plan['new_directories'].append(base_dir)
            
            if isinstance(subdirs, list):
                for subdir in subdirs:
                    self.migration_plan['new_directories'].append(f"{base_dir}{subdir}/")
    
    def plan_file_moves(self, target_structure: Dict):
        """Plan where each file should be moved"""
        # Map file types to target directories
        type_to_target = self.map_file_types_to_targets(target_structure)
        
        for file_type, files in self.current_structure['files'].items():
            target_dir = type_to_target.get(file_type)
            
            if target_dir:
                for file in files:
                    # Determine specific target based on file analysis
                    specific_target = self.determine_specific_target(file, file_type, target_structure)
                    
                    if specific_target and str(Path(file).parent) != specific_target:
                        self.migration_plan['file_moves'].append({
                            'from': file,
                            'to': str(Path(specific_target) / Path(file).name),
                            'type': file_type,
                            'reason': f"Organize {file_type} files together"
                        })
    
    def map_file_types_to_targets(self, target_structure: Dict) -> Dict:
        """Map file types to target directories"""
        mapping = {}
        
        if self.target_pattern == 'feature-based':
            mapping = {
                'component': 'features/',
                'service': 'features/',
                'hook': 'features/',
                'model': 'shared/types/',
                'util': 'shared/utils/',
                'config': 'core/config/',
                'test': 'tests/'
            }
        elif self.target_pattern == 'mvc':
            mapping = {
                'component': 'views/components/',
                'view': 'views/pages/',
                'model': 'models/',
                'controller': 'controllers/',
                'service': 'services/',
                'util': 'utils/',
                'test': 'tests/'
            }
        elif self.target_pattern == 'clean':
            mapping = {
                'model': 'domain/entities/',
                'service': 'application/services/',
                'controller': 'presentation/controllers/',
                'component': 'presentation/views/',
                'util': 'infrastructure/',
                'config': 'infrastructure/config/',
                'test': 'tests/'
            }
        
        return mapping
    
    def determine_specific_target(self, file: str, file_type: str, target_structure: Dict) -> Optional[str]:
        """Determine specific target directory for a file"""
        # For feature-based, try to determine which feature
        if self.target_pattern == 'feature-based' and file_type in ['component', 'service', 'hook']:
            feature = self.detect_feature_from_path(file)
            if feature:
                return f"features/{feature}/{file_type}s"
        
        # For modular, determine module
        elif self.target_pattern == 'modular':
            module = self.detect_module_from_path(file)
            if module:
                return f"modules/{module}"
        
        # Default mapping
        type_to_target = self.map_file_types_to_targets(target_structure)
        return type_to_target.get(file_type)
    
    def detect_feature_from_path(self, file_path: str) -> Optional[str]:
        """Detect feature name from file path"""
        parts = Path(file_path).parts
        
        # Common feature indicators
        feature_keywords = ['auth', 'user', 'dashboard', 'admin', 'profile', 'settings', 
                          'cart', 'checkout', 'product', 'search', 'home', 'login']
        
        for part in parts:
            part_lower = part.lower()
            for keyword in feature_keywords:
                if keyword in part_lower:
                    return keyword
        
        # Use first significant directory
        for part in parts:
            if part not in ['src', 'lib', 'app', 'components', 'pages']:
                return part.lower()
        
        return 'common'
    
    def detect_module_from_path(self, file_path: str) -> Optional[str]:
        """Detect module name from file path"""
        parts = Path(file_path).parts
        
        # Use first significant directory as module
        for part in parts:
            if part not in ['src', 'lib', 'app']:
                return part.lower()
        
        return 'core'
    
    def identify_import_updates(self):
        """Identify which imports will need updating"""
        import_updates = defaultdict(list)
        
        for move in self.migration_plan['file_moves']:
            old_path = Path(move['from'])
            new_path = Path(move['to'])
            
            # Calculate how imports to this file will change
            old_import = self.path_to_import(old_path)
            new_import = self.path_to_import(new_path)
            
            if old_import != new_import:
                import_updates[str(old_path)] = {
                    'old': old_import,
                    'new': new_import,
                    'affected_files': []  # Would need dependency analysis to fill
                }
        
        self.migration_plan['import_updates'] = dict(import_updates)
    
    def path_to_import(self, file_path: Path) -> str:
        """Convert file path to import path"""
        # Remove extension
        import_path = file_path.with_suffix('')
        
        # Convert to dot notation for Python or slash for JS
        # This is simplified - real implementation would detect language
        return str(import_path).replace(os.sep, '/')
    
    def assess_risks(self):
        """Assess risks of the migration"""
        risks = {
            'level': 'medium',
            'factors': [],
            'mitigations': []
        }
        
        # Check number of file moves
        num_moves = len(self.migration_plan['file_moves'])
        if num_moves > 100:
            risks['level'] = 'high'
            risks['factors'].append(f"Large number of file moves: {num_moves}")
            risks['mitigations'].append("Execute migration in phases")
        
        # Check for import complexity
        num_imports = len(self.migration_plan['import_updates'])
        if num_imports > 50:
            risks['factors'].append(f"Many import updates needed: {num_imports}")
            risks['mitigations'].append("Use automated tools for import updates")
        
        # Check for test coverage
        test_files = len(self.current_structure['files'].get('test', []))
        total_files = sum(len(files) for files in self.current_structure['files'].values())
        test_ratio = test_files / max(total_files, 1)
        
        if test_ratio < 0.2:
            risks['factors'].append(f"Low test coverage: {test_ratio:.1%}")
            risks['mitigations'].append("Add tests before migration")
        
        # Pattern compatibility
        if self.current_structure['patterns_detected']:
            current = self.current_structure['patterns_detected'][0]
            if current != self.target_pattern:
                risks['factors'].append(f"Pattern change from {current} to {self.target_pattern}")
                risks['mitigations'].append("Review architectural decisions")
        
        self.migration_plan['risk_assessment'] = risks
    
    def generate_migration_steps(self):
        """Generate step-by-step migration plan"""
        steps = []
        
        # Step 1: Preparation
        steps.append({
            'phase': 'preparation',
            'order': 1,
            'description': 'Prepare for migration',
            'tasks': [
                'Create backup of current codebase',
                'Ensure all tests are passing',
                'Commit all pending changes',
                'Document current structure'
            ]
        })
        
        # Step 2: Create directories
        if self.migration_plan['new_directories']:
            steps.append({
                'phase': 'structure',
                'order': 2,
                'description': 'Create new directory structure',
                'tasks': [f"Create directory: {d}" for d in self.migration_plan['new_directories'][:10]]
            })
        
        # Step 3: Move files in batches
        if self.migration_plan['file_moves']:
            # Group moves by type
            moves_by_type = defaultdict(list)
            for move in self.migration_plan['file_moves']:
                moves_by_type[move['type']].append(move)
            
            order = 3
            for file_type, moves in moves_by_type.items():
                steps.append({
                    'phase': 'migration',
                    'order': order,
                    'description': f'Move {file_type} files',
                    'tasks': [f"Move {m['from']} to {m['to']}" for m in moves[:5]],
                    'total_moves': len(moves)
                })
                order += 1
        
        # Step 4: Update imports
        if self.migration_plan['import_updates']:
            steps.append({
                'phase': 'updates',
                'order': order,
                'description': 'Update import statements',
                'tasks': [
                    'Run import update script',
                    'Verify all imports resolve',
                    'Fix any circular dependencies'
                ]
            })
            order += 1
        
        # Step 5: Validation
        steps.append({
            'phase': 'validation',
            'order': order,
            'description': 'Validate migration',
            'tasks': [
                'Run all tests',
                'Check for broken imports',
                'Verify build process',
                'Test application functionality'
            ]
        })
        
        # Step 6: Cleanup
        steps.append({
            'phase': 'cleanup',
            'order': order + 1,
            'description': 'Clean up after migration',
            'tasks': [
                'Remove empty directories',
                'Update documentation',
                'Update build configuration',
                'Commit changes'
            ]
        })
        
        self.migration_plan['steps'] = steps
    
    def export_migration_script(self) -> str:
        """Generate an executable migration script"""
        script_lines = ['#!/bin/bash', '# Auto-generated migration script', '']
        
        # Add safety checks
        script_lines.extend([
            '# Safety checks',
            'if [ ! -d ".git" ]; then',
            '  echo "Error: Not in a git repository"',
            '  exit 1',
            'fi',
            '',
            'if [ -n "$(git status --porcelain)" ]; then',
            '  echo "Error: Uncommitted changes detected"',
            '  exit 1', 
            'fi',
            ''
        ])
        
        # Create directories
        script_lines.append('# Create new directories')
        for dir_path in self.migration_plan['new_directories']:
            script_lines.append(f'mkdir -p "{dir_path}"')
        script_lines.append('')
        
        # Move files
        script_lines.append('# Move files')
        for move in self.migration_plan['file_moves'][:50]:  # Limit for safety
            script_lines.append(f'mv "{move["from"]}" "{move["to"]}"')
        
        script_lines.append('')
        script_lines.append('echo "Migration complete!"')
        
        return '\n'.join(script_lines)

def main():
    parser = argparse.ArgumentParser(description='Plan codebase restructuring')
    parser.add_argument('--root', default='.', help='Root directory to analyze')
    parser.add_argument('--pattern', choices=['feature-based', 'mvc', 'clean', 'ddd', 'modular'],
                       default='feature-based', help='Target architecture pattern')
    parser.add_argument('--output', default='migration_plan.json', help='Output file path')
    parser.add_argument('--script', help='Generate executable migration script')
    parser.add_argument('--dry-run', action='store_true', help='Analyze without generating moves')
    
    args = parser.parse_args()
    
    # Generate migration plan
    planner = RestructurePlanner(args.root, args.pattern)
    plan = planner.generate_plan()
    
    # Save plan
    with open(args.output, 'w') as f:
        json.dump(plan, f, indent=2)
    
    print(f"\nMigration plan generated! Saved to: {args.output}")
    
    # Generate script if requested
    if args.script:
        script = planner.export_migration_script()
        with open(args.script, 'w') as f:
            f.write(script)
        Path(args.script).chmod(0o755)
        print(f"Migration script saved to: {args.script}")
    
    # Print summary
    print(f"\nMigration Summary:")
    print(f"  Target pattern: {args.pattern}")
    print(f"  New directories: {len(plan['new_directories'])}")
    print(f"  Files to move: {len(plan['file_moves'])}")
    print(f"  Import updates needed: {len(plan['import_updates'])}")
    print(f"  Risk level: {plan['risk_assessment']['level']}")
    print(f"  Migration phases: {len(plan['steps'])}")
    
    # Show risk factors
    if plan['risk_assessment']['factors']:
        print(f"\nRisk Factors:")
        for factor in plan['risk_assessment']['factors']:
            print(f"  ⚠️  {factor}")
    
    # Show mitigations
    if plan['risk_assessment']['mitigations']:
        print(f"\nRecommended Mitigations:")
        for mitigation in plan['risk_assessment']['mitigations']:
            print(f"  ✓ {mitigation}")
    
    # Show next steps
    print(f"\nNext Steps:")
    for i, step in enumerate(plan['steps'][:3], 1):
        print(f"  {i}. {step['description']}")

if __name__ == '__main__':
    main()
