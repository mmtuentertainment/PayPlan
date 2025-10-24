#!/usr/bin/env python3
import json, argparse
from datetime import datetime

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('audit_file')
    p.add_argument('--output', '-o')
    args = p.parse_args()
    
    with open(args.audit_file) as f:
        data = json.load(f)
    
    plan = f"""# Modernization Plan
Generated: {datetime.now().strftime('%Y-%m-%d')}

## Summary
- Files: {data['summary']['files_analyzed']}
- Issues: {data['summary']['issues_found']}

## Phase 1: Critical Fixes
Fix accessibility and critical issues first.

## Phase 2: Modernization  
Update to modern patterns and practices.

## Phase 3: Optimization
Improve performance and maintainability.

See references/ for detailed guidance.
"""
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(plan)
        print(f"Plan saved to: {args.output}")
    else:
        print(plan)
