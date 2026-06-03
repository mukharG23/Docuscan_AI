import cv2
import numpy as np

def deskew(gray):
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

def preprocess_image(input_path: str, output_path: str) -> str:
    img = cv2.imread(input_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    deskewed = deskew(gray)
    cv2.imwrite(output_path, deskewed)
    return output_path