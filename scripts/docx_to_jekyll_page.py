import html
import os
import re
import shutil
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
    "v": "urn:schemas-microsoft-com:vml",
}


def q(name):
    prefix, local = name.split(":")
    return f"{{{NS[prefix]}}}{local}"


def rels_map(zip_file):
    rels = {}
    root = ET.fromstring(zip_file.read("word/_rels/document.xml.rels"))
    for rel in root:
        rid = rel.attrib.get("Id")
        target = rel.attrib.get("Target")
        mode = rel.attrib.get("TargetMode")
        rels[rid] = {"target": target, "mode": mode}
    return rels


def para_style(paragraph):
    style = paragraph.find("./w:pPr/w:pStyle", NS)
    return style.attrib.get(q("w:val")) if style is not None else ""


def is_list_para(paragraph):
    return paragraph.find("./w:pPr/w:numPr", NS) is not None


def inline_text_from_run(run, rels, media_dir, media_prefix, image_counter, figures):
    pieces = []
    for child in list(run):
        if child.tag == q("w:t"):
            pieces.append(html.escape(child.text or ""))
        elif child.tag == q("w:tab"):
            pieces.append(" ")
        elif child.tag in {q("w:br"), q("w:cr")}:
            pieces.append("<br>")
        else:
            rid = None
            blip = child.find(".//a:blip", NS)
            if blip is not None:
                rid = blip.attrib.get(q("r:embed")) or blip.attrib.get(q("r:link"))
            imagedata = child.find(".//v:imagedata", NS)
            if rid is None and imagedata is not None:
                rid = imagedata.attrib.get(q("r:id"))
            if rid and rid in rels:
                target = rels[rid]["target"]
                src = target if rels[rid].get("mode") == "External" else f"word/{target}"
                if src.startswith("word/media/"):
                    original = Path(src).name
                    suffix = Path(original).suffix
                    image_counter[0] += 1
                    out_name = f"sapflow-manual-{image_counter[0]:02d}{suffix}"
                    token = f"[[FIGURE:{image_counter[0]}]]"
                    figures[token] = f'<figure class="manual-figure"><a href="{media_prefix}/{out_name}"><img src="{media_prefix}/{out_name}" alt="Sapflow manual figure {image_counter[0]}"></a></figure>'
                    pieces.append(token)
                    media_dir.mkdir(parents=True, exist_ok=True)
                    with open(media_dir / out_name, "wb") as out:
                        out.write(ZIP.read(src))
    return "".join(pieces)


def paragraph_html(paragraph, rels, media_dir, media_prefix, image_counter, figures):
    pieces = []

    def consume_runs(parent):
        for node in list(parent):
            if node.tag == q("w:r"):
                pieces.append(inline_text_from_run(node, rels, media_dir, media_prefix, image_counter, figures))
            elif node.tag == q("w:hyperlink"):
                rid = node.attrib.get(q("r:id"))
                anchor = node.attrib.get(q("w:anchor"))
                href = ""
                if rid and rid in rels:
                    href = rels[rid]["target"]
                elif anchor:
                    href = f"#{anchor}"
                inner = []
                for run in node.findall("./w:r", NS):
                    inner.append(inline_text_from_run(run, rels, media_dir, media_prefix, image_counter, figures))
                text = "".join(inner)
                pieces.append(f'<a href="{html.escape(href, quote=True)}">{text}</a>' if href else text)

    consume_runs(paragraph)
    text = "".join(pieces).strip()
    return text


def emit_text_and_figures(out, text, figures, wrap_tag="p"):
    parts = re.split(r"(\[\[FIGURE:\d+\]\])", text)
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if part in figures:
            out.append(figures[part])
        elif wrap_tag:
            out.append(f"<{wrap_tag}>{part}</{wrap_tag}>")
        else:
            out.append(part)


def cell_html(cell, rels, media_dir, media_prefix, image_counter, figures):
    chunks = []
    for paragraph in cell.findall("./w:p", NS):
        text = paragraph_html(paragraph, rels, media_dir, media_prefix, image_counter, figures)
        if text:
            chunks.append(text)
    return "<br>".join(chunks)


def table_html(table, rels, media_dir, media_prefix, image_counter, figures):
    rows = []
    for tr in table.findall("./w:tr", NS):
        cells = []
        for tc in tr.findall("./w:tc", NS):
            cells.append(cell_html(tc, rels, media_dir, media_prefix, image_counter, figures))
        rows.append(cells)
    if not rows:
        return ""
    out = ['<div class="manual-table">', "<table>"]
    for row_i, cells in enumerate(rows):
        tag = "th" if row_i == 0 else "td"
        out.append("<tr>" + "".join(f"<{tag}>{cell}</{tag}>" for cell in cells) + "</tr>")
    out.extend(["</table>", "</div>"])
    return "\n".join(out)


def emit_docx_page(docx_path, page_path, media_dir, media_prefix):
    global ZIP
    with zipfile.ZipFile(docx_path) as zf:
        ZIP = zf
        rels = rels_map(zf)
        root = ET.fromstring(zf.read("word/document.xml"))
        body = root.find("./w:body", NS)
        image_counter = [0]
        figures = {}
        out = [
            "---",
            "layout: archive",
            'title: "Sapflow Sensors"',
            "permalink: /sapflow/",
            "author_profile: true",
            "---",
            "",
            '<p><a href="{{ site.baseurl }}/files/ucsb.sapflow_manual_2026_04_09.docx" class="btn btn--primary" download>Download the Word manual</a></p>',
            "",
        ]
        list_open = False

        def close_list():
            nonlocal list_open
            if list_open:
                out.append("</ul>")
                list_open = False

        for child in list(body):
            if child.tag == q("w:p"):
                text = paragraph_html(child, rels, media_dir, media_prefix, image_counter, figures)
                if not text:
                    close_list()
                    continue
                style = para_style(child)
                if style == "Heading1":
                    close_list()
                    out.append(f"# {text}")
                elif style == "Heading2":
                    close_list()
                    out.append(f"## {text}")
                elif style == "Heading3":
                    close_list()
                    out.append(f"### {text}")
                elif is_list_para(child) or style == "ListParagraph":
                    if "[[FIGURE:" in text:
                        close_list()
                        emit_text_and_figures(out, text, figures)
                        continue
                    if not list_open:
                        out.append("<ul>")
                        list_open = True
                    out.append(f"<li>{text}</li>")
                else:
                    close_list()
                    emit_text_and_figures(out, text, figures)
            elif child.tag == q("w:tbl"):
                close_list()
                table = table_html(child, rels, media_dir, media_prefix, image_counter, figures)
                if table:
                    out.append(table)
        close_list()
        page_path.write_text("\n".join(out) + "\n", encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("Usage: docx_to_jekyll_page.py input.docx output.md media_dir")
    emit_docx_page(
        Path(sys.argv[1]),
        Path(sys.argv[2]),
        Path(sys.argv[3]),
        "{{ site.baseurl }}/images/sapflow-manual",
    )
