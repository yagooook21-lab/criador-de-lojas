import sys
import re

with open('htmlDesktop.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'(?i)<body[^>]*>', '', html)
html = re.sub(r'(?i)</body>', '', html)
html = html.replace('class="', 'className="')
html = html.replace('for="', 'htmlFor="')
html = re.sub(r'(?i)<img([^>]*?)(?<!/)>', r'<img\1 />', html)
html = re.sub(r'(?i)<input([^>]*?)(?<!/)>', r'<input\1 />', html)
html = re.sub(r'(?i)<hr([^>]*?)(?<!/)>', r'<hr\1 />', html)
html = re.sub(r'(?i)<br([^>]*?)(?<!/)>', r'<br\1 />', html)
html = html.replace('brick="[object Object]"', '')
html = html.replace('style="font-size:16px"', "style={{ fontSize: '16px' }}")
html = html.replace('style="font-size:10px;margin-top:2px"', "style={{ fontSize: '10px', marginTop: '2px' }}")
html = html.replace('style="font-size:18px"', "style={{ fontSize: '18px' }}")
html = html.replace('style="font-size:10px;margin-top:3px"', "style={{ fontSize: '10px', marginTop: '3px' }}")
html = re.sub(r'content_hover="[^"]*"', '', html)

with open('desktopJsx.txt', 'w', encoding='utf-8') as f:
    f.write(html)
