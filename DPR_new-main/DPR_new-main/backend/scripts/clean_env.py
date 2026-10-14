with open('.env', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    raw = line.strip()
    if '=' in raw and not raw.startswith('#'):
        k, v = raw.split('=', 1)
        v = v.strip().strip('"').strip("'").strip()
        new_lines.append(f"{k}={v}\n")
    else:
        new_lines.append(line)

with open('.env', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Sanitized .env file quotes successfully.")
