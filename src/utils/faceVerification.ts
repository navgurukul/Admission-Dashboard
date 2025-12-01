import * as faceapi from "@vladmandic/face-api";

let modelsLoaded = false;

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
 * @returns Promise<boolean> - true if face detected, false otherwise
 */
export const detectHumanFace = async (imageFile: File): Promise<boolean> => {
  try {
    // Load models if not already loaded
    await loadFaceDetectionModels();

    // Create image element from file
    const img = await createImageElement(imageFile);

    // Detect faces in the image
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    // Return true if at least one face is detected
    return detections.length > 0;
  } catch (error) {
    console.error("Error detecting face:", error);
    return false;
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
