#!/usr/bin/env python3
import os, re, json, argparse
from pathlib import Path
from datetime import datetime

class CodeAuditor:
    def __init__(self):
        self.issues = []
        self.stats = {'files_analyzed': 0, 'total_lines': 0, 'issues_found': 0, 
                      'severity_breakdown': {'critical': 0, 'warning': 0, 'info': 0}}
    
    def audit_directory(self, path):
        print(f"Auditing: {path}")
        path_obj = Path(path)
        if not path_obj.exists():
            return {'error': f'Path does not exist: {path}'}
        
        files = [path_obj] if path_obj.is_file() else [
            f for ext in ['.html', '.htm', '.css', '.js'] 
            for f in path_obj.rglob(f'*{ext}')
        ]
        
        for fp in files:
            self._audit_file(fp)
        return self._generate_report()
    
    def _audit_file(self, fp):
        self.stats['files_analyzed'] += 1
        try:
            content = fp.read_text(encoding='utf-8')
            lines = content.split('\n')
            self.stats['total_lines'] += len(lines)
            
            if fp.suffix in ['.html', '.htm']:
                if re.findall(r'style\s*=', content):
                    self._add_issue(fp, 0, 'warning', 'inline_styles', 'Inline styles found')
                if not re.search(r'<meta[^>]*viewport', content, re.I):
                    self._add_issue(fp, 0, 'warning', 'missing_viewport', 'Missing viewport')
                if re.findall(r'<img(?![^>]*alt=)', content, re.I):
                    self._add_issue(fp, 0, 'critical', 'missing_alt', 'Images without alt text')
        except: pass
    
    def _add_issue(self, fp, line, severity, itype, msg):
        self.issues.append({'file': str(fp), 'line': line, 'severity': severity, 'type': itype, 'message': msg})
        self.stats['issues_found'] += 1
        self.stats['severity_breakdown'][severity] += 1
    
    def _generate_report(self):
        return {'timestamp': datetime.now().isoformat(), 'summary': self.stats, 'issues': self.issues}

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('path')
    p.add_argument('--output', '-o')
    args = p.parse_args()
    
    auditor = CodeAuditor()
    report = auditor.audit_directory(args.path)
    
    print(f"\n📊 Files: {report['summary']['files_analyzed']}, Issues: {report['summary']['issues_found']}")
    
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"Saved to: {args.output}")
