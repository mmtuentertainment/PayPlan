#!/usr/bin/env python3
"""
project_scanner.py - Framework and project type detection
Enhanced framework detection for initial discovery phase
"""

import json
import argparse
from pathlib import Path
from typing import Dict, Optional

class ProjectScanner:
    """Detect project type, framework, and build tools"""

    def __init__(self, root_path: str):
        self.root_path = Path(root_path).resolve()

    def scan(self) -> Dict:
        """Comprehensive project scan"""
        return {
            'framework': self._detect_framework(),
            'language': self._detect_language(),
            'build_tool': self._detect_build_tool(),
            'test_framework': self._detect_test_framework(),
            'package_manager': self._detect_package_manager(),
            'project_type': self._detect_project_type()
        }

    def _detect_framework(self) -> Optional[str]:
        """Detect web framework"""
        # React
        if (self.root_path / 'package.json').exists():
            with open(self.root_path / 'package.json') as f:
                data = json.load(f)
                deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                if 'react' in deps:
                    return 'React'
                if 'vue' in deps:
                    return 'Vue'
                if 'angular' in deps or '@angular/core' in deps:
                    return 'Angular'
                if 'next' in deps:
                    return 'Next.js'
                if 'svelte' in deps:
                    return 'Svelte'

        # Django
        if (self.root_path / 'manage.py').exists():
            return 'Django'

        # Flask
        if any(self.root_path.glob('**/app.py')):
            return 'Flask'

        # Rails
        if (self.root_path / 'Gemfile').exists() and (self.root_path / 'config/routes.rb').exists():
            return 'Rails'

        return None

    def _detect_language(self) -> Optional[str]:
        """Detect primary programming language"""
        extensions = {
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript',
            '.js': 'JavaScript',
            '.jsx': 'JavaScript',
            '.py': 'Python',
            '.java': 'Java',
            '.go': 'Go',
            '.rs': 'Rust',
            '.cs': 'C#',
            '.rb': 'Ruby',
            '.php': 'PHP'
        }

        counts = {}
        for ext, lang in extensions.items():
            count = len(list(self.root_path.rglob(f'*{ext}')))
            if count > 0:
                counts[lang] = counts.get(lang, 0) + count

        return max(counts, key=counts.get) if counts else None

    def _detect_build_tool(self) -> Optional[str]:
        """Detect build tool"""
        tools = {
            'vite.config.ts': 'Vite',
            'vite.config.js': 'Vite',
            'webpack.config.js': 'Webpack',
            'rollup.config.js': 'Rollup',
            'Makefile': 'Make',
            'build.gradle': 'Gradle',
            'pom.xml': 'Maven',
            'Cargo.toml': 'Cargo'
        }

        for file, tool in tools.items():
            if (self.root_path / file).exists():
                return tool

        return None

    def _detect_test_framework(self) -> Optional[str]:
        """Detect test framework"""
        if (self.root_path / 'package.json').exists():
            with open(self.root_path / 'package.json') as f:
                data = json.load(f)
                deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                if 'vitest' in deps:
                    return 'Vitest'
                if 'jest' in deps:
                    return 'Jest'
                if 'mocha' in deps:
                    return 'Mocha'
                if 'playwright' in deps:
                    return 'Playwright'

        if any(self.root_path.glob('**/pytest.ini')):
            return 'Pytest'

        if any(self.root_path.glob('**/*_test.go')):
            return 'Go Test'

        return None

    def _detect_package_manager(self) -> Optional[str]:
        """Detect package manager"""
        if (self.root_path / 'pnpm-lock.yaml').exists():
            return 'pnpm'
        if (self.root_path / 'yarn.lock').exists():
            return 'yarn'
        if (self.root_path / 'package-lock.json').exists():
            return 'npm'
        if (self.root_path / 'Pipfile').exists():
            return 'pipenv'
        if (self.root_path / 'poetry.lock').exists():
            return 'poetry'
        if (self.root_path / 'Gemfile.lock').exists():
            return 'bundler'

        return None

    def _detect_project_type(self) -> str:
        """Determine overall project type"""
        if (self.root_path / 'src/pages').exists():
            return 'frontend-app'
        if (self.root_path / 'src/components').exists():
            return 'frontend-library'
        if (self.root_path / 'src/api').exists():
            return 'backend-api'
        if (self.root_path / 'manage.py').exists() or (self.root_path / 'app.py').exists():
            return 'backend-app'

        return 'unknown'


def main():
    parser = argparse.ArgumentParser(description='Scan project structure')
    parser.add_argument('--root', default='.', help='Project root')
    parser.add_argument('--output', default='project_scan.json', help='Output file')
    args = parser.parse_args()

    scanner = ProjectScanner(args.root)
    results = scanner.scan()

    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"✅ Project scan complete: {args.output}")
    print(f"\nDetected:")
    for key, value in results.items():
        print(f"  {key}: {value or 'unknown'}")


if __name__ == '__main__':
    main()
