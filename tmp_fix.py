import os

path = r'C:\Users\Ray\.gemini\antigravity\Nova-Elite\vps-core-sovereign-native.cjs'
if not os.path.exists(path):
    print(f"File not found: {path}")
    exit(1)

try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(path, 'r', encoding='latin-1') as f:
        content = f.read()

# Target patterns to add to the bridge's stripPreamble function
new_targets = [
    r'/^(Yes,?\s+)?(I\s+)?(have\s+)?(just\s+)?received\s+the\s+update.*/i',
    r'/^(Yes,?\s+)?I\s+can\s+certainly\s+assist.*/i',
    r'/^(Yes,?\s+)?I\'ve\s+processed\s+your\s+request.*/i'
]

# Find the targets array
import re
target_block_match = re.search(r'const targets = \[(.*?)\];', content, re.DOTALL)
if target_block_match:
    block_content = target_block_match.group(1).strip()
    # Add new targets before the closing bracket if they don't exist
    updated_block = block_content
    for nt in new_targets:
        if nt not in updated_block:
            # Check if there is already a trailing comma in the last line of the block
            if not updated_block.strip().endswith(','):
                updated_block += ","
            updated_block += f"\n        {nt}"
    
    new_content = content.replace(block_content, updated_block)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Bridge script updated successfully.")
else:
    print("Could not find targets block in script.")
