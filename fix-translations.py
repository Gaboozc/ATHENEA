#!/usr/bin/env python3
import re

# Read the file
with open('src/context/LanguageContext.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the section between "const translations = {" and "const LanguageContext"
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'const translations = {' in line:
        start_idx = i
    if start_idx >= 0 and 'const LanguageContext' in line:
        end_idx = i
        break

if start_idx == -1 or end_idx == -1:
    print("ERROR: Could not find translations block")
    exit(1)

print(f"Translations block: lines {start_idx+1} to {end_idx}")

# Extract the translation lines
translation_lines = lines[start_idx:end_idx]

# Pattern to match translation entries: '...': '...',
pattern = r"^\s*'([^'\\]*(?:\\.[^'\\]*)*)'\s*:\s*'([^'\\]*(?:\\.[^'\\]*)*)',?\s*$"

# Parse and deduplicate
seen_keys = {}
new_lines = []

for line in translation_lines:
    match = re.match(pattern, line)
    if match:
        key = match.group(1)
        if key not in seen_keys:
            seen_keys[key] = True
            new_lines.append(line)
        else:
            print(f"Removing duplicate: {key}")
    else:
        # Keep non-translation lines (like braces, es: {, etc.)
        new_lines.append(line)

print(f"Original translation entries in block: {len([l for l in translation_lines if re.match(pattern, l)])}")
print(f"After deduplication: {len([l for l in new_lines if re.match(pattern, l)])}")

# Rebuild the file
new_content_lines = lines[:start_idx] + new_lines + lines[end_idx:]

# Write back
with open('src/context/LanguageContext.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_content_lines)

print("✓ Fixed translations - duplicates removed!")
