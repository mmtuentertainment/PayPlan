#!/usr/bin/env python3
import re, argparse
from pathlib import Path

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('file')
    p.add_argument('--output', '-o')
    args = p.parse_args()
    
    content = Path(args.file).read_text()
    
    components = []
    if re.search(r'class="[^"]*card', content):
        components.append('card')
    if re.search(r'<button', content):
        components.append('button')
    
    print(f"Found components: {', '.join(components) if components else 'none'}")
