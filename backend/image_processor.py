import os
import cv2
import numpy as np
import easyocr
import json
from groq import Groq
from dotenv import load_dotenv

class ImageProcessor:
    def __init__(self):
        self.reader = easyocr.Reader(['en'], gpu=False)
        load_dotenv()
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    def deskew(self, gray):
        coords = np.column_stack(np.where(gray < 128))
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        else:
            angle = -angle
        h, w = gray.shape
        center = (w // 2, h // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        deskewed = cv2.warpAffine(gray, matrix, (w, h), flags=cv2.INTER_CUBIC, borderValue=255)
        return deskewed

    def binarize(self, gray):
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return binary

    def preprocess(self, input_path: str, output_path: str) -> str:
        img = cv2.imread(input_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        deskewed = self.deskew(gray)
        binarized = self.binarize(deskewed)
        cv2.imwrite(output_path, binarized)
        return output_path

    def extract_text(self, image_path: str) -> str:
        results = self.reader.readtext(image_path, detail=0)
        return "\n".join(results)

    def structure_text(self, raw_text: str) -> dict:
        prompt = f"""
        Identify the document type and extract all relevant fields from this OCR text.
        Return ONLY a JSON object with a "document_type" field and all relevant extracted fields.
        If a field is not found, set it to null.
        Return only the JSON, no explanation, no markdown, no code blocks.

        OCR Text:
        {raw_text}
        """
        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        return json.loads(response.choices[0].message.content.strip())

processor = ImageProcessor()