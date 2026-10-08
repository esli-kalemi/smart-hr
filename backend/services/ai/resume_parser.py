import fitz
import io
from docx import Document


def extract_text_from_pdf(file_bytes):
    text = ""

    document = fitz.open(stream=file_bytes, filetype="pdf")

    for page in document:
        text += page.get_text()

    document.close()

    return text


def extract_text_from_docx(file_bytes):
    document = Document(io.BytesIO(file_bytes))

    text = ""

    for paragraph in document.paragraphs:
        text += paragraph.text + "\n"

    return text


def extract_resume_text(filename, file_bytes):
    if filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)

    if filename.lower().endswith(".docx"):
        return extract_text_from_docx(file_bytes)

    raise ValueError("Unsupported file format")


def clean_resume_text(text):
    lines = text.splitlines()

    cleaned_lines = []

    for line in lines:
        line = line.strip()

        if line:
            cleaned_lines.append(line)

    return "\n".join(cleaned_lines)