#!/usr/bin/env python3
"""
dependency_mapper.py - Maps dependencies and import relationships in codebases
Supports multiple languages and generates visual dependency graphs
"""

import os
import re
import json
import argparse
from pathlib import Path
from collections import defaultdict, deque
from typing import Dict, List, Set, Tuple, Optional
import ast

class DependencyMapper:
    def __init__(self, root_path: str, language: str = 'auto'):
        self.root_path = Path(root_path).resolve()
        self.language = language
        self.dependencies = defaultdict(set)
        self.imports = defaultdict(list)
        self.exports = defaultdict(list)
        self.circular_deps = []
        self.orphaned_files = []
        
        # Language-specific import patterns
        self.import_patterns = {
            'python': [
                r'^\s*import\s+([\w\.]+)',
                r'^\s*from\s+([\w\.]+)\s+import',
            ],
            'javascript': [
                r'^\s*import\s+.*\s+from\s+[\'"]([^\'"]+)[\'"]',
                r'^\s*import\s+[\'"]([^\'"]+)[\'"]',
                r'^\s*const\s+.*\s*=\s*require\([\'"]([^\'"]+)[\'"]\)',
                r'^\s*require\([\'"]([^\'"]+)[\'"]\)',
            ],
            'typescript': [
                r'^\s*import\s+.*\s+from\s+[\'"]([^\'"]+)[\'"]',
                r'^\s*import\s+[\'"]([^\'"]+)[\'"]',
                r'^\s*import\s+type\s+.*\s+from\s+[\'"]([^\'"]+)[\'"]',
                r'^\s*export\s+.*\s+from\s+[\'"]([^\'"]+)[\'"]',
            ],
            'java': [
                r'^\s*import\s+([\w\.]+);',
                r'^\s*import\s+static\s+([\w\.]+);',
            ],
            'go': [
                r'^\s*import\s+"([^"]+)"',
                r'^\s*import\s+\(\s*"([^"]+)"',
            ],
            'rust': [
                r'^\s*use\s+([\w:]+)',
                r'^\s*extern\s+crate\s+([\w]+)',
            ],
            'csharp': [
                r'^\s*using\s+([\w\.]+);',
                r'^\s*using\s+static\s+([\w\.]+);',
            ]
        }
        
        # File extensions for each language
        self.file_extensions = {
            'python': ['.py'],
            'javascript': ['.js', '.jsx', '.mjs'],
            'typescript': ['.ts', '.tsx'],
            'java': ['.java'],
            'go': ['.go'],
            'rust': ['.rs'],
            'csharp': ['.cs'],
            'php': ['.php'],
            'ruby': ['.rb'],
        }
    
    def detect_language(self) -> str:
        """Auto-detect the primary language of the codebase"""
        if self.language != 'auto':
            return self.language
            
        extension_counts = defaultdict(int)
        
        for root, dirs, files in os.walk(self.root_path):
            # Skip common ignored directories
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', 'venv']]
            
            for file in files:
                ext = Path(file).suffix.lower()
                extension_counts[ext] += 1
        
        # Find which language has the most files
        language_scores = defaultdict(int)
        for lang, extensions in self.file_extensions.items():
            for ext in extensions:
                language_scores[lang] += extension_counts.get(ext, 0)
        
        if language_scores:
            detected = max(language_scores, key=language_scores.get)
            print(f"Detected language: {detected}")
            return detected
        
        return 'unknown'
    
    def map_dependencies(self) -> Dict:
        """Map all dependencies in the codebase"""
        self.language = self.detect_language()
        
        if self.language == 'unknown':
            print("Warning: Could not detect language, using generic analysis")
            return self.generic_analysis()
        
        print(f"Mapping dependencies for {self.language} project...")
        
        # Get all relevant files
        source_files = self.get_source_files()
        
        # Analyze each file
        for file_path in source_files:
            self.analyze_file(file_path)
        
        # Detect circular dependencies
        self.detect_circular_dependencies()
        
        # Find orphaned files
        self.find_orphaned_files(source_files)
        
        # Generate statistics
        stats = self.generate_statistics()
        
        return {
            'language': self.language,
            'total_files': len(source_files),
            'dependencies': {k: list(v) for k, v in self.dependencies.items()},
            'imports': dict(self.imports),
            'exports': dict(self.exports),
            'circular_dependencies': self.circular_deps,
            'orphaned_files': self.orphaned_files,
            'statistics': stats
        }
    
    def get_source_files(self) -> List[Path]:
        """Get all source files for the detected language"""
        extensions = self.file_extensions.get(self.language, [])
        source_files = []
        
        for root, dirs, files in os.walk(self.root_path):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if not self.should_ignore(d)]
            
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    source_files.append(Path(root) / file)
        
        return source_files
    
    def should_ignore(self, path: str) -> bool:
        """Check if path should be ignored"""
        ignore_patterns = ['node_modules', '.git', '__pycache__', 'venv', 'dist', 'build']
        return any(pattern in str(path) for pattern in ignore_patterns)
    
    def analyze_file(self, file_path: Path):
        """Analyze a single file for dependencies"""
        relative_path = file_path.relative_to(self.root_path)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return
        
        # Get patterns for current language
        patterns = self.import_patterns.get(self.language, [])
        
        # Extract imports
        for pattern in patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                import_path = match.group(1)
                self.process_import(str(relative_path), import_path)
        
        # Language-specific processing
        if self.language == 'python':
            self.analyze_python_file(file_path, content)
        elif self.language in ['javascript', 'typescript']:
            self.analyze_js_file(file_path, content)
    
    def analyze_python_file(self, file_path: Path, content: str):
        """Python-specific analysis using AST"""
        try:
            tree = ast.parse(content)
            relative_path = file_path.relative_to(self.root_path)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        self.imports[str(relative_path)].append(alias.name)
                        self.dependencies[str(relative_path)].add(alias.name)
                        
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        self.imports[str(relative_path)].append(node.module)
                        self.dependencies[str(relative_path)].add(node.module)
                        
                elif isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                    self.exports[str(relative_path)].append(node.name)
                    
        except SyntaxError:
            # Fallback to regex if AST parsing fails
            pass
    
    def analyze_js_file(self, file_path: Path, content: str):
        """JavaScript/TypeScript specific analysis"""
        relative_path = file_path.relative_to(self.root_path)
        
        # Extract exports
        export_patterns = [
            r'^\s*export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([\w]+)',
            r'^\s*export\s+\{([^}]+)\}',
            r'^\s*module\.exports\s*=\s*([\w]+)',
        ]
        
        for pattern in export_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                export_name = match.group(1)
                if ',' in export_name:  # Multiple exports
                    for name in export_name.split(','):
                        self.exports[str(relative_path)].append(name.strip())
                else:
                    self.exports[str(relative_path)].append(export_name)
    
    def process_import(self, from_file: str, import_path: str):
        """Process an import statement"""
        # Resolve relative imports
        if import_path.startswith('.'):
            resolved = self.resolve_relative_import(from_file, import_path)
            if resolved:
                import_path = resolved
        
        self.imports[from_file].append(import_path)
        self.dependencies[from_file].add(import_path)
    
    def resolve_relative_import(self, from_file: str, import_path: str) -> Optional[str]:
        """Resolve relative import paths"""
        from_dir = Path(from_file).parent
        
        # Handle different relative import formats
        if import_path.startswith('./'):
            import_path = import_path[2:]
        elif import_path.startswith('../'):
            levels = import_path.count('../')
            for _ in range(levels):
                from_dir = from_dir.parent
            import_path = import_path.replace('../', '')
        
        if from_dir == Path('.'):
            return import_path
        
        return str(from_dir / import_path)
    
    def detect_circular_dependencies(self):
        """Detect circular dependencies using DFS"""
        visited = set()
        rec_stack = set()
        
        def dfs(node, path):
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for neighbor in self.dependencies.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor, path):
                        return True
                elif neighbor in rec_stack:
                    # Found circular dependency
                    cycle_start = path.index(neighbor)
                    cycle = path[cycle_start:] + [neighbor]
                    self.circular_deps.append(cycle)
                    return True
            
            path.pop()
            rec_stack.remove(node)
            return False
        
        for node in self.dependencies:
            if node not in visited:
                dfs(node, [])
    
    def find_orphaned_files(self, source_files: List[Path]):
        """Find files with no imports or exports"""
        all_files = {str(f.relative_to(self.root_path)) for f in source_files}
        
        # Files that import something
        importing_files = set(self.imports.keys())
        
        # Files that are imported
        imported_files = set()
        for deps in self.dependencies.values():
            imported_files.update(deps)
        
        # Files that export something
        exporting_files = set(self.exports.keys())
        
        # Orphaned = no imports AND not imported by anyone AND no exports
        for file in all_files:
            if (file not in importing_files and 
                file not in imported_files and 
                file not in exporting_files):
                self.orphaned_files.append(file)
    
    def generate_statistics(self) -> Dict:
        """Generate dependency statistics"""
        stats = {
            'total_imports': sum(len(v) for v in self.imports.values()),
            'total_exports': sum(len(v) for v in self.exports.values()),
            'files_with_most_imports': [],
            'files_with_most_dependencies': [],
            'most_imported_modules': [],
            'coupling_score': 0
        }
        
        # Files with most imports
        if self.imports:
            sorted_imports = sorted(self.imports.items(), key=lambda x: len(x[1]), reverse=True)[:5]
            stats['files_with_most_imports'] = [(f, len(imports)) for f, imports in sorted_imports]
        
        # Files with most dependencies
        if self.dependencies:
            sorted_deps = sorted(self.dependencies.items(), key=lambda x: len(x[1]), reverse=True)[:5]
            stats['files_with_most_dependencies'] = [(f, len(deps)) for f, deps in sorted_deps]
        
        # Most imported modules
        import_counts = defaultdict(int)
        for imports in self.imports.values():
            for imp in imports:
                import_counts[imp] += 1
        
        if import_counts:
            sorted_modules = sorted(import_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            stats['most_imported_modules'] = sorted_modules
        
        # Calculate coupling score (0-100, lower is better)
        if self.dependencies:
            total_possible = len(self.dependencies) * (len(self.dependencies) - 1)
            actual_deps = sum(len(deps) for deps in self.dependencies.values())
            stats['coupling_score'] = min(100, (actual_deps / max(total_possible, 1)) * 100)
        
        return stats
    
    def generic_analysis(self) -> Dict:
        """Generic dependency analysis when language cannot be detected"""
        # Implement basic file relationship analysis
        return {
            'language': 'unknown',
            'error': 'Could not detect language for dependency analysis'
        }
    
    def generate_visual_graph(self, output_format: str = 'dot'):
        """Generate a visual representation of dependencies"""
        if output_format == 'dot':
            return self.generate_dot_graph()
        elif output_format == 'mermaid':
            return self.generate_mermaid_graph()
        else:
            return None
    
    def generate_dot_graph(self) -> str:
        """Generate Graphviz DOT format"""
        dot_lines = ['digraph dependencies {']
        dot_lines.append('  rankdir=LR;')
        dot_lines.append('  node [shape=box];')
        
        # Add nodes and edges
        for source, targets in self.dependencies.items():
            source_name = source.replace('/', '_').replace('.', '_')
            for target in targets:
                target_name = target.replace('/', '_').replace('.', '_')
                dot_lines.append(f'  "{source_name}" -> "{target_name}";')
        
        # Highlight circular dependencies
        for cycle in self.circular_deps:
            for i in range(len(cycle) - 1):
                source = cycle[i].replace('/', '_').replace('.', '_')
                target = cycle[i + 1].replace('/', '_').replace('.', '_')
                dot_lines.append(f'  "{source}" -> "{target}" [color=red, penwidth=2];')
        
        dot_lines.append('}')
        return '\n'.join(dot_lines)
    
    def generate_mermaid_graph(self) -> str:
        """Generate Mermaid diagram format"""
        mermaid_lines = ['graph LR']
        
        # Add nodes and edges
        for source, targets in self.dependencies.items():
            source_name = source.replace('/', '_').replace('.', '_')
            for target in targets:
                target_name = target.replace('/', '_').replace('.', '_')
                mermaid_lines.append(f'    {source_name} --> {target_name}')
        
        return '\n'.join(mermaid_lines)

def main():
    parser = argparse.ArgumentParser(description='Map dependencies in a codebase')
    parser.add_argument('--root', default='.', help='Root directory to analyze')
    parser.add_argument('--language', default='auto', help='Programming language (auto-detect by default)')
    parser.add_argument('--output', default='dependencies.json', help='Output file path')
    parser.add_argument('--format', choices=['json', 'visual', 'both'], default='json', 
                       help='Output format')
    parser.add_argument('--detect-circular', action='store_true', help='Focus on circular dependencies')
    parser.add_argument('--visual-format', choices=['dot', 'mermaid'], default='dot',
                       help='Visual graph format')
    
    args = parser.parse_args()
    
    # Run dependency mapping
    mapper = DependencyMapper(args.root, args.language)
    results = mapper.map_dependencies()
    
    # Save JSON results
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nDependency mapping complete! Results saved to: {args.output}")
    
    # Generate visual graph if requested
    if args.format in ['visual', 'both']:
        graph = mapper.generate_visual_graph(args.visual_format)
        if graph:
            visual_file = args.output.replace('.json', f'.{args.visual_format}')
            with open(visual_file, 'w') as f:
                f.write(graph)
            print(f"Visual graph saved to: {visual_file}")
    
    # Print summary
    print(f"\nSummary:")
    print(f"  Language: {results['language']}")
    print(f"  Total files: {results['total_files']}")
    print(f"  Total imports: {results['statistics'].get('total_imports', 0)}")
    print(f"  Circular dependencies: {len(results['circular_dependencies'])}")
    print(f"  Orphaned files: {len(results['orphaned_files'])}")
    print(f"  Coupling score: {results['statistics'].get('coupling_score', 0):.1f}/100")
    
    if results['circular_dependencies']:
        print(f"\n⚠️  Circular dependencies detected:")
        for cycle in results['circular_dependencies'][:5]:  # Show first 5
            print(f"    {' -> '.join(cycle)}")
    
    if results['orphaned_files']:
        print(f"\n📦 Orphaned files (no imports/exports):")
        for file in results['orphaned_files'][:10]:  # Show first 10
            print(f"    {file}")

if __name__ == '__main__':
    main()
