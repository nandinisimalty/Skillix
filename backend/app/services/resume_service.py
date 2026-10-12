import pymupdf as fitz # PyMuPDF
import logging

logger = logging.getLogger(__name__)

class ResumeService:
    @staticmethod
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
        """
        Extracts raw plain text from PDF bytes using PyMuPDF (fitz).
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            extracted_text = []
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text("text")
                if text:
                    extracted_text.append(text)
            
            full_text = "\n".join(extracted_text).strip()
            if not full_text:
                raise ValueError("No readable text found in the PDF. The file may contain scanned images or be empty.")
                
            return full_text
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {str(e)}")
            raise e
