#!/usr/bin/env python3
"""
dead_code_detector.py - Detects unused code, files, and exports
Identifies code that can be safely removed from the codebase
"""

import os
import re
import json
import argparse
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set, Tuple

class DeadCodeDetector:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path).resolve()
        self.all_files = set()
        self.all_exports = defaultdict(set)  # file -> exported symbols
        self.all_imports = defaultdict(set)  # file -> imported symbols
        self.file_references = defaultdict(set)  # file -> files it references
        self.used_exports = defaultdict(set)  # file -> used exports
        self.entry_points = []
        self.dead_code = {
            'unused_files': [],
            'unused_exports': defaultdict(list),
            'unused_imports': defaultdict(list),
            'commented_code': defaultdict(list),
            'empty_files': []
        }
    
    def detect(self, entry_points: List[str] = None) -> Dict:
        """Run dead code detection"""
        print(f"Detecting dead code in: {self.root_path}")
        
        # Set entry points (main files that are always considered "used")
        self.entry_points = entry_points or self.find_entry_points()
        
        # Scan all source files
        self.scan_files()
        
        # Analyze usage patterns
        self.analyze_usage()
        
        # Find dead code
        self.find_unused_files()
        self.find_unused_exports()
        self.find_unused_imports()
        self.find_commented_code()
        self.find_empty_files()
        
        # Calculate statistics
        stats = self.calculate_statistics()
        
        return {
            'entry_points': self.entry_points,
            'dead_code': {
                'unused_files': self.dead_code['unused_files'],
                'unused_exports': dict(self.dead_code['unused_exports']),
                'unused_imports': dict(self.dead_code['unused_imports']),
                'commented_code': dict(self.dead_code['commented_code']),
                'empty_files': self.dead_code['empty_files']
            },
            'statistics': stats,
            'safe_to_delete': self.get_safe_deletions()
        }
    
    def find_entry_points(self) -> List[str]:
        """Find likely entry points in the codebase"""
        entry_points = []
        common_entries = [
            'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts',
            'index.py', 'main.py', 'app.py', '__main__.py',
            'Main.java', 'Application.java', 'App.java',
            'main.go', 'main.rs', 'Program.cs'
        ]
        
        for root, dirs, files in os.walk(self.root_path):
            dirs[:] = [d for d in dirs if not self.should_ignore(d)]
            
            for file in files:
                if file in common_entries:
                    rel_path = Path(root, file).relative_to(self.root_path)
                    entry_points.append(str(rel_path))
                    
                # Also check package.json for entry points
                if file == 'package.json':
                    try:
                        with open(Path(root, file), 'r') as f:
                            pkg = json.load(f)
                            if 'main' in pkg:
                                entry_points.append(pkg['main'])
                            if 'bin' in pkg:
                                if isinstance(pkg['bin'], dict):
                                    entry_points.extend(pkg['bin'].values())
                                else:
                                    entry_points.append(pkg['bin'])
                    except:
                        pass
        
        return entry_points
    
    def should_ignore(self, path: str) -> bool:
        """Check if path should be ignored"""
        ignore_patterns = [
            'node_modules', '.git', '__pycache__', 'venv', 'env',
            'dist', 'build', 'coverage', '.pytest_cache', 'target'
        ]
        return any(pattern in str(path) for pattern in ignore_patterns)
    
    def scan_files(self):
        """Scan all source files and extract exports/imports"""
        extensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.cs', '.php', '.rb']
        
        for root, dirs, files in os.walk(self.root_path):
            dirs[:] = [d for d in dirs if not self.should_ignore(d)]
            
            for file in files:
                file_path = Path(root, file)
                if file_path.suffix in extensions:
                    rel_path = file_path.relative_to(self.root_path)
                    self.all_files.add(str(rel_path))
                    self.analyze_file(file_path)
    
    def analyze_file(self, file_path: Path):
        """Analyze a single file for exports, imports, and references"""
        rel_path = str(file_path.relative_to(self.root_path))
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            return
        
        # Detect language based on extension
        ext = file_path.suffix
        
        if ext in ['.js', '.jsx', '.ts', '.tsx']:
            self.analyze_javascript_file(rel_path, content)
        elif ext == '.py':
            self.analyze_python_file(rel_path, content)
        else:
            # Generic analysis for other languages
            self.analyze_generic_file(rel_path, content)
    
    def analyze_javascript_file(self, file_path: str, content: str):
        """Analyze JavaScript/TypeScript file"""
        # Extract exports
        export_patterns = [
            # Named exports
            r'export\s+(?:const|let|var|function|class)\s+(\w+)',
            r'export\s+\{([^}]+)\}',
            # Default export
            r'export\s+default\s+(?:function\s+)?(\w+)?',
            # CommonJS
            r'module\.exports\s*=\s*\{([^}]+)\}',
            r'exports\.(\w+)\s*=',
        ]
        
        for pattern in export_patterns:
            for match in re.finditer(pattern, content):
                if match.group(1):
                    exports = match.group(1)
                    if ',' in exports:
                        for exp in exports.split(','):
                            self.all_exports[file_path].add(exp.strip())
                    else:
                        self.all_exports[file_path].add(exports.strip())
        
        # Extract imports
        import_patterns = [
            # ES6 imports
            r'import\s+(?:\*\s+as\s+)?(\w+)?\s*(?:,\s*\{([^}]+)\})?\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'import\s+\{([^}]+)\}\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'import\s+[\'"]([^\'"]+)[\'"]',
            # CommonJS
            r'require\([\'"]([^\'"]+)[\'"]\)',
        ]
        
        for pattern in import_patterns:
            for match in re.finditer(pattern, content):
                # Track which files are imported
                if pattern == import_patterns[-1]:  # require pattern
                    imported_file = match.group(1)
                else:
                    imported_file = match.group(3) if match.lastindex >= 3 else match.group(2) if match.lastindex >= 2 else match.group(1)
                
                if imported_file and not imported_file.startswith('.'):
                    # External module
                    self.all_imports[file_path].add(imported_file)
                elif imported_file:
                    # Local file reference
                    resolved = self.resolve_import_path(file_path, imported_file)
                    if resolved:
                        self.file_references[file_path].add(resolved)
                        
                        # Track which exports are used
                        if match.lastindex >= 2 and match.group(2):  # Named imports
                            imports = match.group(2) if match.group(2) else match.group(1)
                            if imports and ',' in imports:
                                for imp in imports.split(','):
                                    self.used_exports[resolved].add(imp.strip())
                            elif imports:
                                self.used_exports[resolved].add(imports.strip())
    
    def analyze_python_file(self, file_path: str, content: str):
        """Analyze Python file"""
        import ast
        
        try:
            tree = ast.parse(content)
            
            # Extract exports (top-level definitions)
            for node in ast.iter_child_nodes(tree):
                if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                    if not node.name.startswith('_'):  # Public symbols
                        self.all_exports[file_path].add(node.name)
                elif isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name) and not target.id.startswith('_'):
                            self.all_exports[file_path].add(target.id)
            
            # Extract imports
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        self.all_imports[file_path].add(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        self.all_imports[file_path].add(node.module)
                        # Track specific imports
                        for alias in node.names:
                            if alias.name != '*':
                                # Try to resolve local imports
                                if node.level > 0 or node.module.startswith('.'):
                                    resolved = self.resolve_python_import(file_path, node.module, node.level)
                                    if resolved:
                                        self.used_exports[resolved].add(alias.name)
        except:
            # Fallback to regex if AST parsing fails
            self.analyze_generic_file(file_path, content)
    
    def analyze_generic_file(self, file_path: str, content: str):
        """Generic analysis for other languages"""
        # Look for import-like patterns
        import_patterns = [
            r'import\s+[\"\']?([^\s\"\']+)',
            r'include\s+[\"\']?([^\s\"\']+)',
            r'require\s+[\"\']?([^\s\"\']+)',
            r'using\s+([^\s;]+)',
        ]
        
        for pattern in import_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                self.all_imports[file_path].add(match.group(1))
    
    def resolve_import_path(self, from_file: str, import_path: str) -> str:
        """Resolve import path to actual file"""
        from_dir = Path(from_file).parent
        
        # Handle relative imports
        if import_path.startswith('./'):
            import_path = import_path[2:]
        elif import_path.startswith('../'):
            levels = import_path.count('../')
            for _ in range(levels):
                from_dir = from_dir.parent if from_dir != Path('.') else Path('.')
            import_path = import_path.replace('../', '')
        
        # Try different extensions
        possible_files = [
            from_dir / import_path,
            from_dir / f"{import_path}.js",
            from_dir / f"{import_path}.ts",
            from_dir / f"{import_path}.jsx",
            from_dir / f"{import_path}.tsx",
            from_dir / import_path / "index.js",
            from_dir / import_path / "index.ts",
        ]
        
        for possible in possible_files:
            if (self.root_path / possible).exists():
                return str(possible)
        
        return str(from_dir / import_path)
    
    def resolve_python_import(self, from_file: str, module: str, level: int) -> str:
        """Resolve Python import path"""
        from_dir = Path(from_file).parent
        
        if level > 0:  # Relative import
            for _ in range(level - 1):
                from_dir = from_dir.parent if from_dir != Path('.') else Path('.')
        
        if module:
            parts = module.split('.')
            path = from_dir / '/'.join(parts)
        else:
            path = from_dir
        
        # Try .py file or __init__.py
        possible_files = [
            path.with_suffix('.py'),
            path / '__init__.py'
        ]
        
        for possible in possible_files:
            if (self.root_path / possible).exists():
                return str(possible)
        
        return str(path)
    
    def analyze_usage(self):
        """Analyze which files and exports are actually used"""
        # Start from entry points and trace usage
        visited = set()
        to_visit = set(self.entry_points)
        
        while to_visit:
            current = to_visit.pop()
            if current in visited:
                continue
            
            visited.add(current)
            
            # Add files referenced by current file
            if current in self.file_references:
                for ref in self.file_references[current]:
                    if ref not in visited and ref in self.all_files:
                        to_visit.add(ref)
        
        self.reachable_files = visited
    
    def find_unused_files(self):
        """Find files that are never imported or used"""
        for file in self.all_files:
            if file not in self.reachable_files and file not in self.entry_points:
                # Check if it's a test file (often not imported directly)
                if not any(pattern in file for pattern in ['test', 'spec', '.test.', '.spec.']):
                    self.dead_code['unused_files'].append(file)
    
    def find_unused_exports(self):
        """Find exports that are never imported"""
        for file, exports in self.all_exports.items():
            used = self.used_exports.get(file, set())
            unused = exports - used
            
            if unused and file in self.reachable_files:  # Only report for reachable files
                self.dead_code['unused_exports'][file] = list(unused)
    
    def find_unused_imports(self):
        """Find imports that are never used in the file"""
        # This requires more sophisticated analysis of variable usage
        # For now, we'll identify imports in files that export nothing
        for file, imports in self.all_imports.items():
            if file not in self.all_exports or not self.all_exports[file]:
                if imports and file in self.reachable_files:
                    # File imports things but exports nothing - might be dead
                    self.dead_code['unused_imports'][file] = list(imports)
    
    def find_commented_code(self):
        """Find large blocks of commented code"""
        for file in self.all_files:
            file_path = self.root_path / file
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                commented_blocks = []
                in_block_comment = False
                block_start = 0
                block_lines = []
                
                for i, line in enumerate(lines, 1):
                    stripped = line.strip()
                    
                    # Check for block comments
                    if '/*' in stripped and not in_block_comment:
                        in_block_comment = True
                        block_start = i
                        block_lines = [line]
                    elif '*/' in stripped and in_block_comment:
                        in_block_comment = False
                        block_lines.append(line)
                        if len(block_lines) > 10:  # Large commented block
                            commented_blocks.append({
                                'start': block_start,
                                'end': i,
                                'lines': len(block_lines)
                            })
                    elif in_block_comment:
                        block_lines.append(line)
                    # Check for consecutive line comments
                    elif stripped.startswith('//') or stripped.startswith('#'):
                        if not block_lines:
                            block_start = i
                        block_lines.append(line)
                    else:
                        if len(block_lines) > 10:  # Large commented block
                            commented_blocks.append({
                                'start': block_start,
                                'end': i - 1,
                                'lines': len(block_lines)
                            })
                        block_lines = []
                
                if commented_blocks:
                    self.dead_code['commented_code'][file] = commented_blocks
                    
            except:
                pass
    
    def find_empty_files(self):
        """Find empty or nearly empty files"""
        for file in self.all_files:
            file_path = self.root_path / file
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                
                # Check if file is effectively empty
                if not content or len(content) < 10:
                    self.dead_code['empty_files'].append(file)
                # Check if it's just imports with no actual code
                elif self.is_imports_only(content):
                    self.dead_code['empty_files'].append(file)
            except:
                pass
    
    def is_imports_only(self, content: str) -> bool:
        """Check if file contains only imports and no actual code"""
        lines = content.split('\n')
        non_import_lines = []
        
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith('#') or stripped.startswith('//'):
                continue
            if not any(keyword in stripped for keyword in ['import', 'from', 'require', 'include', 'using']):
                non_import_lines.append(stripped)
        
        return len(non_import_lines) < 3  # Less than 3 lines of actual code
    
    def calculate_statistics(self) -> Dict:
        """Calculate dead code statistics"""
        total_dead_files = len(self.dead_code['unused_files']) + len(self.dead_code['empty_files'])
        total_dead_exports = sum(len(exports) for exports in self.dead_code['unused_exports'].values())
        
        stats = {
            'total_files': len(self.all_files),
            'reachable_files': len(self.reachable_files),
            'dead_files': total_dead_files,
            'dead_exports': total_dead_exports,
            'files_with_dead_exports': len(self.dead_code['unused_exports']),
            'files_with_commented_code': len(self.dead_code['commented_code']),
            'dead_code_percentage': (total_dead_files / max(len(self.all_files), 1)) * 100
        }
        
        # Calculate potential size savings
        size_savings = 0
        for file in self.dead_code['unused_files'] + self.dead_code['empty_files']:
            try:
                size_savings += (self.root_path / file).stat().st_size
            except:
                pass
        
        stats['potential_size_savings_bytes'] = size_savings
        stats['potential_size_savings_kb'] = size_savings / 1024
        
        return stats
    
    def get_safe_deletions(self) -> List[str]:
        """Get list of files that are safe to delete"""
        safe = []
        
        # Empty files are generally safe to delete
        safe.extend(self.dead_code['empty_files'])
        
        # Unused files that aren't configuration or documentation
        for file in self.dead_code['unused_files']:
            # Skip potential configuration files
            if not any(pattern in file.lower() for pattern in [
                'config', 'setup', 'init', 'readme', 'license', 
                'package', 'manifest', 'requirements'
            ]):
                safe.append(file)
        
        return safe

def main():
    parser = argparse.ArgumentParser(description='Detect dead code in codebase')
    parser.add_argument('--root', default='.', help='Root directory to analyze')
    parser.add_argument('--output', default='dead_code_report.json', help='Output file path')
    parser.add_argument('--entry-points', nargs='*', help='Entry point files')
    parser.add_argument('--exclude', nargs='*', help='Patterns to exclude')
    parser.add_argument('--format', choices=['json', 'summary'], default='json', help='Output format')
    
    args = parser.parse_args()
    
    # Run dead code detection
    detector = DeadCodeDetector(args.root)
    results = detector.detect(args.entry_points)
    
    # Save results
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nDead code detection complete! Results saved to: {args.output}")
    
    # Print summary
    stats = results['statistics']
    print(f"\nSummary:")
    print(f"  Total files analyzed: {stats['total_files']}")
    print(f"  Reachable files: {stats['reachable_files']}")
    print(f"  Dead files: {stats['dead_files']}")
    print(f"  Dead exports: {stats['dead_exports']}")
    print(f"  Dead code percentage: {stats['dead_code_percentage']:.1f}%")
    print(f"  Potential savings: {stats['potential_size_savings_kb']:.1f} KB")
    
    # Show some dead files
    if results['dead_code']['unused_files']:
        print(f"\n🗑️  Unused files (first 10):")
        for file in results['dead_code']['unused_files'][:10]:
            print(f"    {file}")
    
    # Show files with unused exports
    if results['dead_code']['unused_exports']:
        print(f"\n📦 Files with unused exports:")
        for file, exports in list(results['dead_code']['unused_exports'].items())[:5]:
            print(f"    {file}: {', '.join(exports[:5])}")
    
    # Show safe deletions
    safe = results['safe_to_delete']
    if safe:
        print(f"\n✅ Files safe to delete ({len(safe)} files):")
        for file in safe[:10]:
            print(f"    {file}")

if __name__ == '__main__':
    main()
