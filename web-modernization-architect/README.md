# Web Modernization Architect Skill

Transform legacy, messy web code into modern, performant, accessible applications.

## What This Skill Does

✅ **Automated Code Analysis** - Detects 50+ issues  
✅ **Automated Transformation** - Fixes common problems automatically  
✅ **Design System Templates** - Complete CSS variable systems  
✅ **Step-by-Step Workflows** - Comprehensive refactoring guides  
✅ **Real Examples** - Before/after transformation case studies  

## Quick Start

### 1. Analyze Your Code

```bash
python scripts/audit_code.py /path/to/your/project
```

### 2. Apply Automated Fixes

```bash
python scripts/modernize.py /path/to/your/project --auto-fix
```

### 3. Manual Refactoring

Follow `references/modernization-workflow.md` for detailed guidance.

## Requirements

- Python 3.7+
- No external dependencies

## File Structure

```
web-modernization-architect/
├── SKILL.md                     # Main documentation
├── README.md                    # This file
├── scripts/
│   ├── audit_code.py            # Code analyzer
│   └── modernize.py             # Automated transformer
└── references/
    └── modernization-workflow.md  # Step-by-step workflow
```

## Usage Examples

```bash
# Audit with JSON report
python scripts/audit_code.py ~/my-app --format json --output report.json

# Preview changes (dry run)
python scripts/modernize.py ~/my-app --dry-run

# Apply changes with backup
python scripts/modernize.py ~/my-app --auto-fix
```

## Version

**v2.0** - October 23, 2025

## License

MIT
