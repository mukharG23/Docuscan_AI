import cv2
import numpy as np
import easyocr

class ImageProcessor:
    def __init__(self):
        self.reader = easyocr.Reader(['en'], gpu=False)

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

processor = ImageProcessor()