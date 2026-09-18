import re

with open('src/contexts/I18nContext.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

seen_keys_pt = set()
seen_keys_es = set()
current_lang = None
out_lines = []

for line in lines:
    if 'pt: {' in line:
        current_lang = 'pt'
        out_lines.append(line)
        continue
    elif 'es: {' in line:
        current_lang = 'es'
        out_lines.append(line)
        continue
    
    match = re.match(r'^\s*\"([^\"]+)\"\s*:', line)
    if match and current_lang:
        key = match.group(1)
        if current_lang == 'pt':
            if key in seen_keys_pt:
                print(f'Removing pt duplicate: {key} at {line.strip()}')
                continue
            else:
                seen_keys_pt.add(key)
        elif current_lang == 'es':
            if key in seen_keys_es:
                print(f'Removing es duplicate: {key} at {line.strip()}')
                continue
            else:
                seen_keys_es.add(key)
    out_lines.append(line)

with open('src/contexts/I18nContext.tsx', 'w', encoding='utf-8') as f:
    f.writelines(out_lines)
