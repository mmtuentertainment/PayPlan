#!/usr/bin/env python3
"""
issue_detector.py - Unified issue detection across codebase
Aggregates results from all analysis scripts to identify structural problems
"""

import os
import json
import argparse
import subprocess
from pathlib import Path
from typing import Dict, List
from collections import defaultdict

class IssueDetector:
    """
    Unified issue detector that aggregates results from:
    - analyze_structure.py (structure issues)
    - dependency_mapper.py (circular deps, orphans)
    - dead_code_detector.py (unused code)
    """

    SEVERITY_CRITICAL = 'critical'
    SEVERITY_HIGH = 'high'
    SEVERITY_MEDIUM = 'medium'
    SEVERITY_LOW = 'low'

    def __init__(self, root_path: str):
        self.root_path = Path(root_path).resolve()
        self.issues = []
        self.scripts_dir = Path(__file__).parent

    def detect_all_issues(self, severity_filter: str = 'all') -> Dict:
        """
        Run all detection scripts and aggregate issues

        Args:
            severity_filter: Filter by severity (all, critical, high, medium, low)

        Returns:
            Dictionary of aggregated issues
        """
        print(f"🔍 Detecting issues in: {self.root_path}\n")

        # Run structure analysis
        structure_issues = self._detect_structure_issues()

        # Run dependency analysis
        dependency_issues = self._detect_dependency_issues()

        # Run dead code detection
        dead_code_issues = self._detect_dead_code_issues()

        # Aggregate all issues
        all_issues = structure_issues + dependency_issues + dead_code_issues

        # Filter by severity if requested
        if severity_filter != 'all':
            all_issues = [i for i in all_issues if i['severity'] == severity_filter]

        # Group by severity
        issues_by_severity = defaultdict(list)
        for issue in all_issues:
            issues_by_severity[issue['severity']].append(issue)

        return {
            'root': str(self.root_path),
            'total_issues': len(all_issues),
            'by_severity': {
                'critical': len(issues_by_severity[self.SEVERITY_CRITICAL]),
                'high': len(issues_by_severity[self.SEVERITY_HIGH]),
                'medium': len(issues_by_severity[self.SEVERITY_MEDIUM]),
                'low': len(issues_by_severity[self.SEVERITY_LOW])
            },
            'issues': all_issues,
            'issues_by_severity': dict(issues_by_severity)
        }

    def _detect_structure_issues(self) -> List[Dict]:
        """Detect structural issues using analyze_structure.py"""
        print("📁 Analyzing structure...")

        issues = []
        temp_output = '/tmp/structure_analysis.json'

        try:
            result = subprocess.run(
                [
                    'python3',
                    str(self.scripts_dir / 'analyze_structure.py'),
                    '--root', str(self.root_path),
                    '--output', temp_output
                ],
                capture_output=True,
                text=True
            )

            if result.returncode == 0 and Path(temp_output).exists():
                with open(temp_output, 'r') as f:
                    data = json.load(f)

                # Extract issues from analysis
                for issue in data.get('issues', []):
                    severity = self.SEVERITY_MEDIUM
                    if issue['type'] == 'deep_nesting':
                        severity = self.SEVERITY_HIGH

                    issues.append({
                        'category': 'structure',
                        'type': issue['type'],
                        'severity': severity,
                        'message': issue.get('message', ''),
                        'details': issue
                    })

                # Check for excessive depth
                metrics = data.get('metrics', {})
                if metrics.get('max_depth', 0) > 5:
                    issues.append({
                        'category': 'structure',
                        'type': 'excessive_depth',
                        'severity': self.SEVERITY_HIGH,
                        'message': f"Maximum nesting depth is {metrics['max_depth']} (recommended: ≤4)",
                        'details': {'max_depth': metrics['max_depth']}
                    })

        except Exception as e:
            print(f"⚠️  Structure analysis failed: {e}")

        print(f"  Found {len(issues)} structure issues\n")
        return issues

    def _detect_dependency_issues(self) -> List[Dict]:
        """Detect dependency issues using dependency_mapper.py"""
        print("🔗 Analyzing dependencies...")

        issues = []
        temp_output = '/tmp/dependency_analysis.json'

        try:
            result = subprocess.run(
                [
                    'python3',
                    str(self.scripts_dir / 'dependency_mapper.py'),
                    '--root', str(self.root_path),
                    '--output', temp_output,
                    '--detect-circular'
                ],
                capture_output=True,
                text=True
            )

            if result.returncode == 0 and Path(temp_output).exists():
                with open(temp_output, 'r') as f:
                    data = json.load(f)

                # Circular dependencies (CRITICAL)
                circular_deps = data.get('circular_dependencies', [])
                for cycle in circular_deps:
                    issues.append({
                        'category': 'dependencies',
                        'type': 'circular_dependency',
                        'severity': self.SEVERITY_CRITICAL,
                        'message': f"Circular dependency detected: {' → '.join(cycle)}",
                        'details': {'cycle': cycle}
                    })

                # Orphaned files (MEDIUM)
                orphaned_files = data.get('orphaned_files', [])
                for orphan in orphaned_files:
                    issues.append({
                        'category': 'dependencies',
                        'type': 'orphaned_file',
                        'severity': self.SEVERITY_MEDIUM,
                        'message': f"Orphaned file (no imports/exports): {orphan}",
                        'details': {'file': orphan}
                    })

                # High coupling (HIGH)
                coupling_score = data.get('coupling_score', 0)
                if coupling_score > 50:
                    issues.append({
                        'category': 'dependencies',
                        'type': 'high_coupling',
                        'severity': self.SEVERITY_HIGH,
                        'message': f"High coupling score: {coupling_score}/100 (recommended: <30)",
                        'details': {'coupling_score': coupling_score}
                    })

        except Exception as e:
            print(f"⚠️  Dependency analysis failed: {e}")

        print(f"  Found {len(issues)} dependency issues\n")
        return issues

    def _detect_dead_code_issues(self) -> List[Dict]:
        """Detect dead code using dead_code_detector.py"""
        print("🗑️  Detecting dead code...")

        issues = []
        temp_output = '/tmp/dead_code_analysis.json'

        try:
            result = subprocess.run(
                [
                    'python3',
                    str(self.scripts_dir / 'dead_code_detector.py'),
                    '--root', str(self.root_path),
                    '--output', temp_output
                ],
                capture_output=True,
                text=True
            )

            if result.returncode == 0 and Path(temp_output).exists():
                with open(temp_output, 'r') as f:
                    data = json.load(f)

                # Dead files (MEDIUM - unless percentage is high)
                dead_files = data.get('dead_files', [])
                dead_percentage = data.get('dead_code_percentage', 0)

                if dead_percentage > 50:
                    severity = self.SEVERITY_HIGH
                elif dead_percentage > 25:
                    severity = self.SEVERITY_MEDIUM
                else:
                    severity = self.SEVERITY_LOW

                if dead_files:
                    issues.append({
                        'category': 'dead_code',
                        'type': 'unused_files',
                        'severity': severity,
                        'message': f"{len(dead_files)} unused files ({dead_percentage:.1f}% of codebase)",
                        'details': {
                            'count': len(dead_files),
                            'percentage': dead_percentage,
                            'files': dead_files[:10]  # First 10 for brevity
                        }
                    })

                # Unused exports (LOW)
                dead_exports = data.get('dead_exports', {})
                for file_path, exports in dead_exports.items():
                    issues.append({
                        'category': 'dead_code',
                        'type': 'unused_exports',
                        'severity': self.SEVERITY_LOW,
                        'message': f"Unused exports in {file_path}: {', '.join(exports)}",
                        'details': {'file': file_path, 'exports': exports}
                    })

        except Exception as e:
            print(f"⚠️  Dead code detection failed: {e}")

        print(f"  Found {len(issues)} dead code issues\n")
        return issues


def main():
    """CLI interface for issue detector"""
    parser = argparse.ArgumentParser(description='Detect codebase issues')
    parser.add_argument('--root', default='.', help='Root directory to analyze')
    parser.add_argument('--output', default='issues.json', help='Output file path')
    parser.add_argument(
        '--severity',
        choices=['all', 'critical', 'high', 'medium', 'low'],
        default='all',
        help='Filter by severity level'
    )
    parser.add_argument('--format', choices=['json', 'summary'], default='summary', help='Output format')

    args = parser.parse_args()

    # Run detection
    detector = IssueDetector(args.root)
    results = detector.detect_all_issues(args.severity)

    # Save results
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)

    # Print summary
    print("=" * 60)
    print("📊 ISSUE DETECTION SUMMARY")
    print("=" * 60)
    print(f"\nTotal Issues: {results['total_issues']}")
    print(f"\nBy Severity:")
    print(f"  🔴 Critical: {results['by_severity']['critical']}")
    print(f"  🟠 High:     {results['by_severity']['high']}")
    print(f"  🟡 Medium:   {results['by_severity']['medium']}")
    print(f"  ⚪ Low:      {results['by_severity']['low']}")

    # Show critical and high issues
    critical_high = [
        i for i in results['issues']
        if i['severity'] in ['critical', 'high']
    ]

    if critical_high:
        print(f"\n🚨 Critical & High Priority Issues:\n")
        for issue in critical_high:
            severity_icon = '🔴' if issue['severity'] == 'critical' else '🟠'
            print(f"  {severity_icon} [{issue['category']}] {issue['message']}")

    print(f"\n✅ Full report saved to: {args.output}")


if __name__ == '__main__':
    main()
