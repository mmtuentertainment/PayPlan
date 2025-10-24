#!/usr/bin/env python3
"""
Web Code Modernizer - Automatically transforms legacy code to modern standards
"""

import os
import re
import argparse
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List

class CodeModernizer:
    """Automatically modernizes web code"""
    
    def __init__(self, project_path: str, dry_run: bool = False, backup: bool = True):
        self.project_path = Path(project_path)
        self.dry_run = dry_run
        self.backup = backup
        self.changes = []
        
    def modernize(self):
        """Run modernization process"""
        print(f"🔧 Modernizing: {self.project_path}")
        
        if self.backup and not self.dry_run:
            self.create_backup()
        
        # Find all web files
        html_files = list(self.project_path.rglob("*.html"))
        css_files = list(self.project_path.rglob("*.css"))
        js_files = list(self.project_path.rglob("*.js"))
        
        print(f"📁 Processing {len(html_files)} HTML, {len(css_files)} CSS, {len(js_files)} JS files")
        
        # Modernize each file type
        for html_file in html_files:
            self.modernize_html(html_file)
            
        for css_file in css_files:
            self.modernize_css(css_file)
            
        for js_file in js_files:
            self.modernize_js(js_file)
        
        # Print summary
        self.print_summary()
    
    def create_backup(self):
        """Create backup of project"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.project_path.parent / f"{self.project_path.name}_backup_{timestamp}"
        shutil.copytree(self.project_path, backup_path)
        print(f"💾 Backup created: {backup_path}")
    
    def modernize_html(self, file_path: Path):
        """Modernize HTML file"""
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        original_content = content
        
        # Extract inline styles to classes
        inline_styles = re.findall(r'style="([^"]*)"', content)
        if inline_styles:
            # Generate CSS classes from inline styles
            css_classes = []
            for i, style in enumerate(inline_styles):
                class_name = f"inline-style-{i+1}"
                css_classes.append(f".{class_name} {{ {style} }}")
                # Replace inline style with class
                content = content.replace(
                    f'style="{style}"',
                    f'class="{class_name}"',
                    1
                )
            
            # Add note about extracted styles
            if css_classes:
                self.log_change(
                    file_path,
                    "inline-styles",
                    f"Extracted {len(inline_styles)} inline styles to classes"
                )
        
        # Add viewport meta tag if missing
        if '<meta name="viewport"' not in content and '<head' in content:
            viewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
            content = content.replace('<head>', f'<head>\n    {viewport}', 1)
            self.log_change(file_path, "viewport", "Added viewport meta tag")
        
        # Fix images missing alt attributes
        imgs_without_alt = re.findall(r'<img(?![^>]*alt=)[^>]*>', content)
        for img in imgs_without_alt:
            # Extract src for context
            src_match = re.search(r'src="([^"]*)"', img)
            alt_text = "Image" if not src_match else Path(src_match.group(1)).stem.replace('-', ' ').replace('_', ' ').title()
            new_img = img.replace('<img', f'<img alt="{alt_text}"', 1)
            content = content.replace(img, new_img, 1)
        
        if imgs_without_alt:
            self.log_change(
                file_path,
                "accessibility",
                f"Added alt attributes to {len(imgs_without_alt)} images"
            )
        
        # Replace deprecated tags
        deprecated_replacements = {
            '<b>': '<strong>',
            '</b>': '</strong>',
            '<i>': '<em>',
            '</i>': '</em>',
            '<center>': '<div style="text-align: center;">',
            '</center>': '</div>',
        }
        
        for old, new in deprecated_replacements.items():
            if old in content:
                content = content.replace(old, new)
                self.log_change(
                    file_path,
                    "deprecated-tags",
                    f"Replaced {old} with {new}"
                )
        
        # Write changes if not dry run
        if content != original_content:
            if not self.dry_run:
                file_path.write_text(content, encoding='utf-8')
                print(f"✅ Modified: {file_path.name}")
            else:
                print(f"[DRY RUN] Would modify: {file_path.name}")
    
    def modernize_css(self, file_path: Path):
        """Modernize CSS file"""
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        original_content = content
        
        # Convert fixed pixel widths to relative units (simple cases)
        # Note: This is a basic transformation, manual review recommended
        simple_px_widths = re.findall(r'width:\s*(\d+)px', content)
        changes_made = False
        
        # Add CSS variables suggestion if not present
        if '--' not in content:
            css_vars = """
/* CSS Custom Properties - Add your design system values here */
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  --color-info: #17a2b8;
  
  --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.5;
  
  --spacing-unit: 0.25rem;
  --border-radius: 0.25rem;
  
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
}

"""
            content = css_vars + content
            self.log_change(
                file_path,
                "css-variables",
                "Added CSS custom properties template"
            )
            changes_made = True
        
        # Write changes
        if content != original_content:
            if not self.dry_run:
                file_path.write_text(content, encoding='utf-8')
                print(f"✅ Modified: {file_path.name}")
            else:
                print(f"[DRY RUN] Would modify: {file_path.name}")
    
    def modernize_js(self, file_path: Path):
        """Modernize JavaScript file"""
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        original_content = content
        
        # Replace var with let/const (simple cases)
        # Note: This is basic - manual review needed for complex cases
        var_declarations = re.findall(r'\bvar\s+(\w+)\s*=', content)
        for var_name in var_declarations:
            # Use const if value doesn't change (simple heuristic)
            # Check if variable is reassigned
            pattern = f'\\b{var_name}\\s*='
            assignments = len(re.findall(pattern, content))
            
            if assignments == 1:  # Only one assignment, use const
                content = re.sub(
                    f'\\bvar\\s+{var_name}\\s*=',
                    f'const {var_name} =',
                    content,
                    count=1
                )
            else:  # Multiple assignments, use let
                content = re.sub(
                    f'\\bvar\\s+{var_name}\\s*=',
                    f'let {var_name} =',
                    content,
                    count=1
                )
        
        if var_declarations:
            self.log_change(
                file_path,
                "modern-js",
                f"Replaced {len(var_declarations)} var declarations with let/const"
            )
        
        # Write changes
        if content != original_content:
            if not self.dry_run:
                file_path.write_text(content, encoding='utf-8')
                print(f"✅ Modified: {file_path.name}")
            else:
                print(f"[DRY RUN] Would modify: {file_path.name}")
    
    def log_change(self, file_path: Path, category: str, description: str):
        """Log a change made to a file"""
        self.changes.append({
            'file': str(file_path),
            'category': category,
            'description': description
        })
    
    def print_summary(self):
        """Print summary of changes"""
        print("\n" + "="*60)
        print("MODERNIZATION SUMMARY")
        print("="*60)
        
        if not self.changes:
            print("\n✨ No changes needed - code is already modern!")
            return
        
        # Group changes by category
        by_category = {}
        for change in self.changes:
            cat = change['category']
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(change)
        
        print(f"\nTotal changes: {len(self.changes)}")
        print("\nBy category:")
        for category, changes in by_category.items():
            print(f"  {category}: {len(changes)} changes")
        
        if self.dry_run:
            print("\n⚠️  DRY RUN - No files were modified")
            print("   Remove --dry-run to apply changes")
        else:
            print("\n✅ Changes applied successfully!")
        
        print("\n📝 Next steps:")
        print("  1. Test your application thoroughly")
        print("  2. Review extracted CSS classes")
        print("  3. Customize CSS variables with your design system")
        print("  4. Run the audit again to check remaining issues")
        print("="*60 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description='Automatically modernize web code'
    )
    parser.add_argument(
        'project_path',
        help='Path to project directory'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview changes without applying them'
    )
    parser.add_argument(
        '--no-backup',
        action='store_true',
        help='Skip creating backup (not recommended)'
    )
    
    args = parser.parse_args()
    
    # Run modernization
    modernizer = CodeModernizer(
        args.project_path,
        dry_run=args.dry_run,
        backup=not args.no_backup
    )
    modernizer.modernize()


if __name__ == '__main__':
    main()
