import * as faceapi from "@vladmandic/face-api";

let modelsLoaded = false;

/**
 * Face detection result interface
 */
export interface FaceDetectionResult {
  success: boolean;
  message: string;
  faceCount: number;
}

/**
 * Load face detection models from CDN
 */
export const loadFaceDetectionModels = async (): Promise<void> => {
  if (modelsLoaded) return;

  try {
    const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log("Face detection models loaded successfully");
  } catch (error) {
    console.error("Error loading face detection models:", error);
    throw new Error("Failed to load face detection models");
  }
};

/**
 * Detect if image contains a human face
 * @param imageFile - The image file to verify
 * @returns Promise<FaceDetectionResult> - Detection result with details
 */
export const detectHumanFace = async (imageFile: File): Promise<FaceDetectionResult> => {
  try {
    // Load models if not already loaded
    await loadFaceDetectionModels();

    // Create image element from file
    const img = await createImageElement(imageFile);

    // Detect faces in the image
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    const faceCount = detections.length;

    // Check face count
    if (faceCount === 0) {
      return {
        success: false,
        message: "No face detected in the image. Please upload a clear photo of your face.",
        faceCount: 0
      };
    } else if (faceCount > 1) {
      return {
        success: false,
        message: `Multiple faces detected (${faceCount} faces). Please upload a photo with only one person.`,
        faceCount
      };
    } else {
      return {
        success: true,
        message: "Face detected successfully.",
        faceCount: 1
      };
    }
  } catch (error) {
    console.error("Error detecting face:", error);
    return {
      success: false,
      message: "Error processing image. Please try again.",
      faceCount: 0
    };
  }
};

/**
 * Create an image element from a file
 */
const createImageElement = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};
