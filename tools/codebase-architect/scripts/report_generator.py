#!/usr/bin/env python3
"""
report_generator.py - Generate HTML/Markdown reports from analysis results
Creates human-readable reports with visualizations
"""

import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict

class ReportGenerator:
    """Generate reports in multiple formats"""

    def __init__(self, analysis_files: Dict[str, str]):
        self.data = {}
        for key, file_path in analysis_files.items():
            if Path(file_path).exists():
                with open(file_path, 'r') as f:
                    self.data[key] = json.load(f)

    def generate_markdown(self, output_path: str):
        """Generate Markdown report"""
        md = []
        md.append("# Codebase Architecture Analysis\n")
        md.append(f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n")

        # Structure Analysis
        if 'structure' in self.data:
            md.append("## 📁 Structure Analysis\n")
            metrics = self.data['structure'].get('metrics', {})
            md.append(f"- **Total Files**: {metrics.get('total_files', 'N/A')}")
            md.append(f"- **Total Size**: {self._format_bytes(metrics.get('total_size_bytes', 0))}")
            md.append(f"- **Max Depth**: {metrics.get('max_depth', 'N/A')}")
            md.append(f"- **Pattern**: {self.data['structure'].get('structure', {}).get('pattern', 'unknown')}\n")

        # Dependencies
        if 'dependencies' in self.data:
            md.append("## 🔗 Dependencies\n")
            md.append(f"- **Total Imports**: {self.data['dependencies'].get('total_imports', 'N/A')}")
            md.append(f"- **Circular Dependencies**: {len(self.data['dependencies'].get('circular_dependencies', []))}")
            md.append(f"- **Orphaned Files**: {len(self.data['dependencies'].get('orphaned_files', []))}")
            md.append(f"- **Coupling Score**: {self.data['dependencies'].get('coupling_score', 'N/A')}/100\n")

        # Dead Code
        if 'dead_code' in self.data:
            md.append("## 🗑️ Dead Code\n")
            md.append(f"- **Dead Files**: {len(self.data['dead_code'].get('dead_files', []))}")
            md.append(f"- **Dead Percentage**: {self.data['dead_code'].get('dead_code_percentage', 0):.1f}%")
            md.append(f"- **Potential Savings**: {self._format_bytes(self.data['dead_code'].get('potential_savings_bytes', 0))}\n")

        # Issues
        if 'issues' in self.data:
            md.append("## 🚨 Issues\n")
            by_sev = self.data['issues'].get('by_severity', {})
            md.append(f"- **Critical**: {by_sev.get('critical', 0)}")
            md.append(f"- **High**: {by_sev.get('high', 0)}")
            md.append(f"- **Medium**: {by_sev.get('medium', 0)}")
            md.append(f"- **Low**: {by_sev.get('low', 0)}\n")

        with open(output_path, 'w') as f:
            f.write('\n'.join(md))

    def generate_html(self, output_path: str):
        """Generate HTML report with charts"""
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codebase Analysis Report</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 8px 8px 0 0; }}
        h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
        .timestamp {{ opacity: 0.9; font-size: 0.9em; }}
        .content {{ padding: 40px; }}
        .section {{ margin-bottom: 40px; }}
        h2 {{ color: #667eea; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; }}
        .metric-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }}
        .metric-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }}
        .metric-label {{ font-size: 0.9em; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }}
        .metric-value {{ font-size: 2em; font-weight: bold; color: #333; margin-top: 10px; }}
        .issue-badge {{ display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600; margin-right: 10px; }}
        .critical {{ background: #fee; color: #c00; }}
        .high {{ background: #ffe; color: #c60; }}
        .medium {{ background: #fef; color: #960; }}
        .low {{ background: #eff; color: #066; }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🏗️ Codebase Architecture Analysis</h1>
            <div class="timestamp">Generated: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}</div>
        </header>

        <div class="content">
"""

        # Structure section
        if 'structure' in self.data:
            html += self._html_structure_section()

        # Dependencies section
        if 'dependencies' in self.data:
            html += self._html_dependencies_section()

        # Dead code section
        if 'dead_code' in self.data:
            html += self._html_dead_code_section()

        # Issues section
        if 'issues' in self.data:
            html += self._html_issues_section()

        html += """
        </div>
    </div>
</body>
</html>
"""

        with open(output_path, 'w') as f:
            f.write(html)

    def _html_structure_section(self) -> str:
        metrics = self.data['structure'].get('metrics', {})
        return f"""
            <div class="section">
                <h2>📁 Structure Analysis</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-label">Total Files</div>
                        <div class="metric-value">{metrics.get('total_files', 'N/A')}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Total Size</div>
                        <div class="metric-value">{self._format_bytes(metrics.get('total_size_bytes', 0))}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Max Depth</div>
                        <div class="metric-value">{metrics.get('max_depth', 'N/A')}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Pattern</div>
                        <div class="metric-value" style="font-size:1.2em">{self.data['structure'].get('structure', {}).get('pattern', 'unknown')}</div>
                    </div>
                </div>
            </div>
"""

    def _html_dependencies_section(self) -> str:
        deps = self.data['dependencies']
        return f"""
            <div class="section">
                <h2>🔗 Dependencies</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-label">Total Imports</div>
                        <div class="metric-value">{deps.get('total_imports', 'N/A')}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Circular Dependencies</div>
                        <div class="metric-value">{len(deps.get('circular_dependencies', []))}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Orphaned Files</div>
                        <div class="metric-value">{len(deps.get('orphaned_files', []))}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Coupling Score</div>
                        <div class="metric-value">{deps.get('coupling_score', 'N/A')}<span style="font-size:0.5em">/100</span></div>
                    </div>
                </div>
            </div>
"""

    def _html_dead_code_section(self) -> str:
        dead = self.data['dead_code']
        return f"""
            <div class="section">
                <h2>🗑️ Dead Code</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-label">Dead Files</div>
                        <div class="metric-value">{len(dead.get('dead_files', []))}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Dead Percentage</div>
                        <div class="metric-value">{dead.get('dead_code_percentage', 0):.1f}%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Potential Savings</div>
                        <div class="metric-value">{self._format_bytes(dead.get('potential_savings_bytes', 0))}</div>
                    </div>
                </div>
            </div>
"""

    def _html_issues_section(self) -> str:
        issues = self.data['issues']
        by_sev = issues.get('by_severity', {})
        return f"""
            <div class="section">
                <h2>🚨 Issues Summary</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-label">Total Issues</div>
                        <div class="metric-value">{issues.get('total_issues', 0)}</div>
                    </div>
                </div>
                <div style="margin-top:20px">
                    <span class="issue-badge critical">Critical: {by_sev.get('critical', 0)}</span>
                    <span class="issue-badge high">High: {by_sev.get('high', 0)}</span>
                    <span class="issue-badge medium">Medium: {by_sev.get('medium', 0)}</span>
                    <span class="issue-badge low">Low: {by_sev.get('low', 0)}</span>
                </div>
            </div>
"""

    def _format_bytes(self, size_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f}{unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f}TB"


def main():
    parser = argparse.ArgumentParser(description='Generate analysis reports')
    parser.add_argument('--format', choices=['html', 'markdown', 'both'], default='both', help='Output format')
    parser.add_argument('--output', default='report', help='Output filename (without extension)')
    parser.add_argument('--structure', help='Path to structure analysis JSON')
    parser.add_argument('--dependencies', help='Path to dependencies analysis JSON')
    parser.add_argument('--dead-code', help='Path to dead code analysis JSON')
    parser.add_argument('--issues', help='Path to issues analysis JSON')

    args = parser.parse_args()

    # Collect analysis files
    files = {}
    if args.structure:
        files['structure'] = args.structure
    if args.dependencies:
        files['dependencies'] = args.dependencies
    if args.dead_code:
        files['dead_code'] = args.dead_code
    if args.issues:
        files['issues'] = args.issues

    if not files:
        print("❌ No analysis files provided. Use --structure, --dependencies, --dead-code, or --issues")
        return

    # Generate reports
    generator = ReportGenerator(files)

    if args.format in ['html', 'both']:
        html_file = f"{args.output}.html"
        generator.generate_html(html_file)
        print(f"✅ HTML report: {html_file}")

    if args.format in ['markdown', 'both']:
        md_file = f"{args.output}.md"
        generator.generate_markdown(md_file)
        print(f"✅ Markdown report: {md_file}")


if __name__ == '__main__':
    main()
