#!/usr/bin/env python3
"""
analyze_structure.py - Main codebase structure analyzer
Analyzes project structure and generates comprehensive reports
"""

import os
import json
import argparse
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set, Tuple
import re

class CodebaseAnalyzer:
    def __init__(self, root_path: str, config: Dict = None):
        self.root_path = Path(root_path).resolve()
        self.config = config or {}
        self.file_tree = {}
        self.statistics = defaultdict(int)
        self.issues = []
        
        # Common ignore patterns
        self.ignore_patterns = {
            'node_modules', 'dist', 'build', '__pycache__',
            '.git', '.venv', 'venv', 'env', 'coverage',
            '*.pyc', '*.pyo', '.DS_Store', 'Thumbs.db'
        }
        
    def analyze(self) -> Dict:
        """Run complete analysis of the codebase"""
        print(f"Analyzing codebase at: {self.root_path}")
        
        # Build file tree
        self.build_file_tree()
        
        # Detect project type and framework
        project_info = self.detect_project_type()
        
        # Analyze structure patterns
        structure_analysis = self.analyze_structure_patterns()
        
        # Calculate metrics
        metrics = self.calculate_metrics()
        
        # Identify issues
        self.identify_issues()
        
        return {
            'root': str(self.root_path),
            'project_info': project_info,
            'structure': structure_analysis,
            'metrics': metrics,
            'statistics': dict(self.statistics),
            'issues': self.issues,
            'recommendations': self.generate_recommendations()
        }
    
    def build_file_tree(self):
        """Build a complete file tree of the project"""
        for root, dirs, files in os.walk(self.root_path):
            # Filter ignored directories
            dirs[:] = [d for d in dirs if not self.should_ignore(d)]
            
            rel_path = Path(root).relative_to(self.root_path)
            level = len(rel_path.parts)
            
            for file in files:
                if self.should_ignore(file):
                    continue
                    
                file_path = Path(root) / file
                ext = file_path.suffix.lower()
                
                # Update statistics
                self.statistics['total_files'] += 1
                self.statistics[f'files_{ext}'] += 1
                self.statistics[f'depth_{level}'] += 1
                
                # Store file info
                rel_file_path = file_path.relative_to(self.root_path)
                self.file_tree[str(rel_file_path)] = {
                    'size': file_path.stat().st_size,
                    'extension': ext,
                    'depth': level,
                    'directory': str(rel_path)
                }
    
    def should_ignore(self, path: str) -> bool:
        """Check if a path should be ignored"""
        path_str = str(path)
        for pattern in self.ignore_patterns:
            if pattern.startswith('*'):
                if path_str.endswith(pattern[1:]):
                    return True
            elif pattern in path_str:
                return True
        return False
    
    def detect_project_type(self) -> Dict:
        """Detect project type and framework from config files"""
        project_info = {
            'type': 'unknown',
            'framework': None,
            'language': None,
            'build_tool': None,
            'test_framework': None
        }
        
        # Check for common config files
        config_checks = {
            'package.json': ('javascript', 'node', self.parse_package_json),
            'pom.xml': ('java', 'maven', None),
            'build.gradle': ('java', 'gradle', None),
            'requirements.txt': ('python', None, None),
            'pyproject.toml': ('python', 'poetry/pip', None),
            'Gemfile': ('ruby', 'bundler', None),
            'go.mod': ('go', 'go modules', None),
            'Cargo.toml': ('rust', 'cargo', None),
            'composer.json': ('php', 'composer', None),
            '*.csproj': ('csharp', 'dotnet', None),
        }
        
        for config_file, (language, build_tool, parser) in config_checks.items():
            if '*' in config_file:
                # Handle wildcard patterns
                pattern = config_file.replace('*', '.*')
                for file_path in self.file_tree:
                    if re.match(pattern, Path(file_path).name):
                        project_info['language'] = language
                        project_info['build_tool'] = build_tool
                        break
            else:
                if config_file in self.file_tree:
                    project_info['language'] = language
                    project_info['build_tool'] = build_tool
                    if parser:
                        parser(self.root_path / config_file, project_info)
                    break
        
        # Detect test framework
        if 'test' in str(self.root_path):
            project_info['test_framework'] = self.detect_test_framework()
        
        return project_info
    
    def parse_package_json(self, file_path: Path, project_info: Dict):
        """Parse package.json for framework detection"""
        try:
            with open(file_path, 'r') as f:
                package_data = json.load(f)
                
            deps = {**package_data.get('dependencies', {}), 
                   **package_data.get('devDependencies', {})}
            
            # Detect framework
            if 'react' in deps:
                project_info['framework'] = 'react'
            elif 'vue' in deps:
                project_info['framework'] = 'vue'
            elif '@angular/core' in deps:
                project_info['framework'] = 'angular'
            elif 'next' in deps:
                project_info['framework'] = 'nextjs'
            elif 'express' in deps:
                project_info['framework'] = 'express'
                
            # Detect test framework
            if 'jest' in deps:
                project_info['test_framework'] = 'jest'
            elif 'mocha' in deps:
                project_info['test_framework'] = 'mocha'
            elif 'vitest' in deps:
                project_info['test_framework'] = 'vitest'
                
        except Exception as e:
            print(f"Error parsing package.json: {e}")
    
    def detect_test_framework(self) -> str:
        """Detect test framework from test files"""
        test_patterns = {
            'jest': ['*.test.js', '*.spec.js', '*.test.ts', '*.spec.ts'],
            'pytest': ['test_*.py', '*_test.py'],
            'junit': ['*Test.java', '*Tests.java'],
            'go test': ['*_test.go'],
            'rspec': ['*_spec.rb'],
        }
        
        for framework, patterns in test_patterns.items():
            for file_path in self.file_tree:
                for pattern in patterns:
                    if self.match_pattern(file_path, pattern):
                        return framework
        return 'unknown'
    
    def match_pattern(self, file_path: str, pattern: str) -> bool:
        """Check if file path matches a pattern"""
        import fnmatch
        return fnmatch.fnmatch(Path(file_path).name, pattern)
    
    def analyze_structure_patterns(self) -> Dict:
        """Analyze the structure pattern of the codebase"""
        structure = {
            'pattern': 'unknown',
            'organization': {},
            'depth_distribution': {},
            'file_distribution': {}
        }
        
        # Analyze directory structure
        dirs = defaultdict(list)
        for file_path, info in self.file_tree.items():
            dir_path = Path(file_path).parent
            dirs[str(dir_path)].append(file_path)
        
        # Check for common patterns
        if 'src' in dirs:
            if 'components' in dirs or 'src/components' in dirs:
                structure['pattern'] = 'component-based'
            elif 'controllers' in dirs or 'src/controllers' in dirs:
                structure['pattern'] = 'mvc'
            elif 'domain' in dirs or 'src/domain' in dirs:
                structure['pattern'] = 'domain-driven'
                
        # Calculate depth distribution
        max_depth = max((info['depth'] for info in self.file_tree.values()), default=0)
        for i in range(max_depth + 1):
            structure['depth_distribution'][i] = self.statistics.get(f'depth_{i}', 0)
        
        # Calculate file type distribution
        extensions = defaultdict(int)
        for file_path, info in self.file_tree.items():
            extensions[info['extension']] += 1
        structure['file_distribution'] = dict(extensions)
        
        return structure
    
    def calculate_metrics(self) -> Dict:
        """Calculate codebase metrics"""
        if not self.file_tree:
            return {}
            
        metrics = {
            'total_files': len(self.file_tree),
            'total_size_bytes': sum(info['size'] for info in self.file_tree.values()),
            'average_file_size': 0,
            'max_depth': 0,
            'average_depth': 0,
            'files_per_directory': 0
        }
        
        # Calculate averages
        metrics['average_file_size'] = metrics['total_size_bytes'] / metrics['total_files']
        depths = [info['depth'] for info in self.file_tree.values()]
        metrics['max_depth'] = max(depths) if depths else 0
        metrics['average_depth'] = sum(depths) / len(depths) if depths else 0
        
        # Files per directory
        dirs = defaultdict(int)
        for info in self.file_tree.values():
            dirs[info['directory']] += 1
        metrics['files_per_directory'] = sum(dirs.values()) / len(dirs) if dirs else 0
        
        return metrics
    
    def identify_issues(self):
        """Identify structural issues in the codebase"""
        # Check for deep nesting
        max_depth = max((info['depth'] for info in self.file_tree.values()), default=0)
        if max_depth > 5:
            self.issues.append({
                'type': 'deep_nesting',
                'severity': 'warning',
                'message': f'Deep nesting detected: {max_depth} levels',
                'recommendation': 'Consider flattening directory structure'
            })
        
        # Check for large directories
        dirs = defaultdict(int)
        for info in self.file_tree.values():
            dirs[info['directory']] += 1
            
        for directory, count in dirs.items():
            if count > 30:
                self.issues.append({
                    'type': 'large_directory',
                    'severity': 'warning',
                    'directory': directory,
                    'file_count': count,
                    'message': f'Large directory with {count} files',
                    'recommendation': 'Consider splitting into subdirectories'
                })
        
        # Check for inconsistent naming
        naming_patterns = defaultdict(int)
        for file_path in self.file_tree:
            name = Path(file_path).stem
            if '-' in name:
                naming_patterns['kebab-case'] += 1
            elif '_' in name:
                naming_patterns['snake_case'] += 1
            elif name[0].isupper():
                naming_patterns['PascalCase'] += 1
            elif any(c.isupper() for c in name[1:]):
                naming_patterns['camelCase'] += 1
                
        if len(naming_patterns) > 2:
            self.issues.append({
                'type': 'inconsistent_naming',
                'severity': 'info',
                'patterns_found': dict(naming_patterns),
                'message': 'Multiple naming conventions detected',
                'recommendation': 'Standardize on one naming convention'
            })
    
    def generate_recommendations(self) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        # Based on depth
        max_depth = max((info['depth'] for info in self.file_tree.values()), default=0)
        if max_depth > 5:
            recommendations.append("Flatten deep directory structures for better maintainability")
        
        # Based on file distribution
        if self.statistics['total_files'] > 1000:
            recommendations.append("Consider modularizing large codebase into separate packages")
        
        # Based on patterns
        if not any(d in str(self.root_path) for d in ['src', 'lib', 'app']):
            recommendations.append("Consider organizing source code in a dedicated 'src' directory")
        
        return recommendations

def main():
    parser = argparse.ArgumentParser(description='Analyze codebase structure')
    parser.add_argument('--root', default='.', help='Root directory to analyze')
    parser.add_argument('--output', default='analysis_report.json', help='Output file path')
    parser.add_argument('--config', help='Configuration file path')
    parser.add_argument('--format', choices=['json', 'pretty'], default='json', help='Output format')
    
    args = parser.parse_args()
    
    # Load config if provided
    config = {}
    if args.config and Path(args.config).exists():
        with open(args.config, 'r') as f:
            config = json.load(f)
    
    # Run analysis
    analyzer = CodebaseAnalyzer(args.root, config)
    results = analyzer.analyze()
    
    # Output results
    if args.format == 'pretty':
        print(json.dumps(results, indent=2))
    
    # Save to file
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nAnalysis complete! Results saved to: {args.output}")
    
    # Print summary
    print(f"\nSummary:")
    print(f"  Total files: {results['statistics']['total_files']}")
    print(f"  Project type: {results['project_info']['language'] or 'unknown'}")
    print(f"  Framework: {results['project_info']['framework'] or 'none detected'}")
    print(f"  Structure pattern: {results['structure']['pattern']}")
    print(f"  Issues found: {len(results['issues'])}")
    
    if results['recommendations']:
        print(f"\nRecommendations:")
        for rec in results['recommendations']:
            print(f"  • {rec}")

if __name__ == '__main__':
    main()
