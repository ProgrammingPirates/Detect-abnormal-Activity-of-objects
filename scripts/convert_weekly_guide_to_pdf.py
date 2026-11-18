"""
Generate WiSense Weekly Lab Evaluation & Viva Guide PDF
Converts markdown to beautifully styled HTML and prints to PDF using Edge headless.
"""

import os
import subprocess
from markdown_it import MarkdownIt

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MD_PATH = os.path.join(ROOT_DIR, "WEEKLY_LAB_PROGRESS_AND_EVALUATION_GUIDE.md")
HTML_PATH = os.path.join(ROOT_DIR, "weekly_guide_styled.html")
PDF_PATH = os.path.join(ROOT_DIR, "WiSense_Weekly_Lab_Evaluation_Guide.pdf")

with open(MD_PATH, "r", encoding="utf-8") as f:
    md_content = f.read()

md = MarkdownIt().enable('table')
html_body = md.render(md_content)

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>WiSense - 5-Week Lab Evaluation & Viva Defense Guide</title>
<style>
    @page {{
        size: A4;
        margin: 15mm 15mm 18mm 15mm;
        @bottom-right {{
            content: "Page " counter(page) " of " counter(pages);
            font-size: 8pt;
            font-family: Arial, sans-serif;
            color: #64748b;
        }}
    }}
    body {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1e293b;
        line-height: 1.5;
        font-size: 10pt;
        background: #ffffff;
        margin: 0;
        padding: 0;
    }}
    h1 {{
        color: #0f172a;
        font-size: 17pt;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 6px;
        margin-top: 18px;
        margin-bottom: 12px;
    }}
    h2 {{
        color: #1e3a8a;
        font-size: 13pt;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 4px;
        margin-top: 18px;
        margin-bottom: 8px;
        page-break-after: avoid;
    }}
    h3 {{
        color: #0369a1;
        font-size: 11pt;
        margin-top: 12px;
        margin-bottom: 6px;
        page-break-after: avoid;
    }}
    h4 {{
        color: #334155;
        font-size: 10pt;
        margin-top: 8px;
        margin-bottom: 4px;
        page-break-after: avoid;
    }}
    blockquote {{
        border-left: 3.5px solid #2563eb;
        background: #f8fafc;
        margin: 8px 0;
        padding: 8px 12px;
        color: #334155;
        font-style: italic;
    }}
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 8.5pt;
    }}
    th, td {{
        border: 1px solid #cbd5e1;
        padding: 5px 8px;
        text-align: left;
    }}
    th {{
        background: #f1f5f9;
        color: #0f172a;
        font-weight: 600;
    }}
    pre, code {{
        font-family: Consolas, "Courier New", monospace;
        font-size: 8.5pt;
    }}
    pre {{
        background: #0f172a;
        color: #38bdf8;
        padding: 8px;
        border-radius: 4px;
        overflow-x: auto;
    }}
    p code {{
        background: #f1f5f9;
        color: #b91c1c;
        padding: 1px 4px;
        border-radius: 3px;
    }}
    ul, ol {{
        margin-top: 4px;
        margin-bottom: 8px;
        padding-left: 20px;
    }}
    li {{
        margin-bottom: 3px;
    }}
    hr {{
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 16px 0;
    }}
    .badge-completed {{
        background: #dcfce7;
        color: #15803d;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
    }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(full_html)

print("Generated styled HTML:", HTML_PATH)

cmd = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={PDF_PATH}",
    HTML_PATH
]

res = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(PDF_PATH):
    print(f"Successfully generated: {PDF_PATH} ({os.path.getsize(PDF_PATH)} bytes)")
else:
    print("Edge headless failed with code:", res.returncode)
