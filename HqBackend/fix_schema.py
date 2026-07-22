with open('app/schemas.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if 'class YieldResponse(BaseModel):' in line:
        new_lines.append(line)
        i += 1
        # Add data_stale field after daily_return
        while i < len(lines):
            l = lines[i]
            new_lines.append(l)
            if 'daily_return' in l and l.strip().endswith('float'):
                new_lines.append('    data_stale: bool = False\n')
                break
            i += 1
    else:
        new_lines.append(line)
    i += 1

with open('app/schemas.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("done")
# Verify
with open('app/schemas.py', 'r', encoding='utf-8') as f:
    content = f.read()
idx = content.find('class YieldResponse')
print(repr(content[idx:idx+300]))
