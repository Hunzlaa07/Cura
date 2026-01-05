/**
 * Face Detection Utility for Proctoring
 * Uses TensorFlow.js MediaPipe Face Detector for accurate real-time face detection
 * Runs entirely in the browser with ML-based detection
 */

import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import * as blazeface from '@tensorflow-models/blazeface';

// Face detection configuration
export interface FaceDetectionResult {
  faceCount: number;
  faces: FaceData[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  eventType: string;
  message: string;
  confidence: number;
  rawDetections?: any[]; // optional raw model detections for debugging
}

export interface FaceData {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

// Configuration thresholds - tuned for accuracy and robustness
const CONFIG = {
  // Face must be at least 1.5% of frame (reduced to avoid false negatives when user is slightly far)
  MIN_FACE_SIZE_RATIO: 0.015,
  // Face shouldn't be more than 90% of frame
  MAX_FACE_SIZE_RATIO: 0.90,
  // Minimum confidence score for a face to be considered valid (0.0 - 1.0)
  // Lowered to reduce false negatives; we also check size as a secondary signal
  CONFIDENCE_THRESHOLD: 0.40,
  // Minimum distance between faces (as ratio of frame width) to count as separate faces
  // Reduced so nearby duplicate detections merge more aggressively
  MIN_FACE_SEPARATION_RATIO: 0.10,
  // Severities
  NO_FACE_SEVERITY: 'medium' as const,
  MULTIPLE_FACES_SEVERITY: 'high' as const,
  FACE_TOO_SMALL_SEVERITY: 'low' as const,
  NORMAL_SEVERITY: 'low' as const,
};

// Singleton detector instance
let detectorInstance: faceDetection.FaceDetector | null = null;
let isInitializing = false;
let initPromise: Promise<faceDetection.FaceDetector> | null = null;

// BlazeFace fallback model (lighter, good as a secondary check)
let blazefaceModel: any | null = null;
let blazefaceInitPromise: Promise<any | null> | null = null;

// Temporal smoothing state to avoid transient false negatives
let lastPositiveResult: FaceDetectionResult | null = null;
let lastPositiveTimestamp = 0;
const TEMPORAL_FALLBACK_MS = 1000; // ms - briefly trust recent positive detection

async function getBlazeFace(): Promise<any | null> {
  if (blazefaceModel) return blazefaceModel;
  if (blazefaceInitPromise) return blazefaceInitPromise;

  blazefaceInitPromise = (async () => {
    try {
      const model = await blazeface.load();
      blazefaceModel = model;
      console.log('✅ BlazeFace model initialized');
      return blazefaceModel;
    } catch (err) {
      console.warn('⚠️ Failed to initialize BlazeFace fallback:', err);
      blazefaceInitPromise = null;
      return null;
    }
  })();

  return blazefaceInitPromise;
}

/**
 * Initialize TensorFlow.js and create face detector
 * Uses MediaPipe Face Detector which is optimized for real-time detection
 */
async function getDetector(): Promise<faceDetection.FaceDetector | null> {
  // Return existing instance
  if (detectorInstance) {
    return detectorInstance;
  }

  // Wait for ongoing initialization
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;

  initPromise = (async () => {
    try {
      // Set TensorFlow.js backend (WebGL is fastest for browsers)
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('🧠 TensorFlow.js ready, backend:', tf.getBackend());

      // Create MediaPipe face detector
      const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
      detectorInstance = await faceDetection.createDetector(model, {
        runtime: 'tfjs',
        maxFaces: 5, // Detect up to 5 faces
        modelType: 'full', // 'full' is more accurate (less false negatives), 'short' is faster
      });

      console.log('✅ Face detector initialized successfully');
      return detectorInstance;
    } catch (error) {
      console.error('❌ Failed to initialize face detector:', error);
      isInitializing = false;
      initPromise = null;
      return null;
    }
  })();

  return initPromise;
}

/**
 * Main face detection function using TensorFlow.js MediaPipe Face Detector
 */
export async function detectFaces(
  videoElement: HTMLVideoElement,
  _canvas?: HTMLCanvasElement
): Promise<FaceDetectionResult> {
  // Check if video is ready
  if (!videoElement.videoWidth || !videoElement.videoHeight) {
    return {
      faceCount: -1,
      faces: [],
      severity: 'low',
      eventType: 'detection_failed',
      message: 'Video not ready for detection',
      confidence: 0,
    };
  }

  try {
    const detector = await getDetector();
    
    if (!detector) {
      console.warn('Face detector not available, returning neutral result');
      return {
        faceCount: -1,
        faces: [],
        severity: 'low',
        eventType: 'detection_unavailable',
        message: 'Face detection not available',
        confidence: 0,
      };
    }

    // Run face detection on video element
    const detections = await detector.estimateFaces(videoElement, {
      flipHorizontal: false,
    }) as any[];

    // Convert detections to our format and filter by confidence
    const frameWidth = videoElement.videoWidth;
    const frameHeight = videoElement.videoHeight;
    const frameArea = frameWidth * frameHeight;

    // Collect raw detections for debugging
    const rawDetections = detections.map(d => ({
      box: d.box,
      score: ((d as any).score ?? ((d as any).scores && (d as any).scores[0]) ?? null),
      keypoints: d.keypoints?.length || 0
    }));

    let faces: FaceData[] = detections
      .map(detection => {
        const box = detection.box;
        const rawScore = ((detection as any).score ?? ((detection as any).scores && (detection as any).scores[0]) ?? 0) as number;
        const inferredConfidence = rawScore > 0 ? rawScore : (detection.keypoints?.length ? 0.9 : 0.8);
        return {
          detectionRaw: detection,
          boundingBox: {
            x: box.xMin,
            y: box.yMin,
            width: box.width,
            height: box.height,
          },
          confidence: inferredConfidence,
        } as any;
      })
      .filter((d: any) => {
        // Keep detection if model score >= threshold OR size is large enough
        const faceArea = d.boundingBox.width * d.boundingBox.height;
        return d.confidence >= CONFIG.CONFIDENCE_THRESHOLD || (faceArea / frameArea) >= CONFIG.MIN_FACE_SIZE_RATIO;
      })
      .map((d: any) => ({ boundingBox: d.boundingBox, confidence: d.confidence }));

    // Filter by size
    faces = faces.filter(face => {
      const faceArea = face.boundingBox.width * face.boundingBox.height;
      const ratio = faceArea / frameArea;
      return ratio >= CONFIG.MIN_FACE_SIZE_RATIO && ratio <= CONFIG.MAX_FACE_SIZE_RATIO;
    });

    // If no faces detected, briefly trust a recent positive detection to avoid transient drops
    if (faces.length === 0 && lastPositiveResult && (Date.now() - lastPositiveTimestamp) <= TEMPORAL_FALLBACK_MS) {
      console.debug('🤝 Temporal smoothing: reusing recent face detection to avoid false no-face');

      // Return a slightly downgraded copy of the last positive result
      return {
        ...lastPositiveResult,
        eventType: 'face_temp_lost',
        message: 'Temporary detection loss — reusing recent positive result',
        confidence: Math.max(0, (lastPositiveResult.confidence || 0) * 0.9),
      } as FaceDetectionResult;
    }

    // If still no faces, try BlazeFace as a fallback to reduce false negatives
    if (faces.length === 0) {
      try {
        const bf = await getBlazeFace();
        if (bf) {
          const bfPreds: any[] = await bf.estimateFaces(videoElement, false);
          if (bfPreds && bfPreds.length) {
            console.debug('🔁 BlazeFace fallback detected faces', bfPreds.length);
            faces = bfPreds.map(pred => {
              const topLeft = Array.isArray(pred.topLeft) ? pred.topLeft : pred.topLeft?.arraySync?.() ?? [0,0];
              const bottomRight = Array.isArray(pred.bottomRight) ? pred.bottomRight : pred.bottomRight?.arraySync?.() ?? [0,0];
              const x = topLeft[0];
              const y = topLeft[1];
              const width = Math.abs(bottomRight[0] - topLeft[0]);
              const height = Math.abs(bottomRight[1] - topLeft[1]);
              const confidence = (pred.probability && pred.probability[0]) ? pred.probability[0] : (pred.probability ?? 0.8);
              return {
                boundingBox: { x, y, width, height },
                confidence,
              } as FaceData;
            }).filter(face => {
              const faceArea = face.boundingBox.width * face.boundingBox.height;
              const ratio = faceArea / frameArea;
              return ratio >= CONFIG.MIN_FACE_SIZE_RATIO && ratio <= CONFIG.MAX_FACE_SIZE_RATIO;
            });
          }
        }
      } catch (err) {
        console.warn('⚠️ BlazeFace fallback failed:', err);
      }
    }

    // Merge overlapping/nearby face detections (prevents false multiple faces)
    faces = mergeNearbyFaces(faces, frameWidth);

    // Evaluate and add rawDetections for debugging
    const result = evaluateFaceDetection(faces, frameWidth, frameHeight);
    result.rawDetections = rawDetections;

    // If a real face is detected, update temporal smoothing state
    if (result.eventType === 'face_detected' || result.eventType === 'face_too_far') {
      lastPositiveResult = result;
      lastPositiveTimestamp = Date.now();
    }

    // Helpful debug logs when unexpected outcomes occur
    if (result.eventType !== 'face_detected') {
      console.debug('🔍 FaceDetection debug:', {
        event: result.eventType,
        faceCount: result.faceCount,
        confidence: result.confidence,
        rawDetections: rawDetections,
        frame: { width: frameWidth, height: frameHeight }
      });
    }

    return result;
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      faceCount: -1,
      faces: [],
      severity: 'low',
      eventType: 'detection_error',
      message: 'Face detection failed',
      confidence: 0,
      rawDetections: []
    };
  }
}

/**
 * Merge faces that are too close together (likely the same face detected multiple times)
 */
function mergeNearbyFaces(faces: FaceData[], frameWidth: number): FaceData[] {
  if (faces.length <= 1) return faces;

  const minSeparation = frameWidth * CONFIG.MIN_FACE_SEPARATION_RATIO;
  const mergedFaces: FaceData[] = [];
  const used = new Set<number>();

  for (let i = 0; i < faces.length; i++) {
    if (used.has(i)) continue;

    const face1 = faces[i];
    const center1X = face1.boundingBox.x + face1.boundingBox.width / 2;
    const center1Y = face1.boundingBox.y + face1.boundingBox.height / 2;

    // Find all faces that are too close to this one
    const group: FaceData[] = [face1];
    used.add(i);

    for (let j = i + 1; j < faces.length; j++) {
      if (used.has(j)) continue;

      const face2 = faces[j];
      const center2X = face2.boundingBox.x + face2.boundingBox.width / 2;
      const center2Y = face2.boundingBox.y + face2.boundingBox.height / 2;

      const distance = Math.sqrt(
        Math.pow(center2X - center1X, 2) + Math.pow(center2Y - center1Y, 2)
      );

      // Check overlap (IoU-like) and distance; merge more aggressively for overlapping boxes
      const overlap = calculateOverlap(face1.boundingBox, face2.boundingBox);
      if (distance < minSeparation || overlap > 0.25) {
        group.push(face2);
        used.add(j);
      }
    }

    // Merge the group into one face (use averaged box or the one with highest confidence/largest area)
    const bestFace = group.reduce((best, current) => {
      const currentArea = current.boundingBox.width * current.boundingBox.height;
      const bestArea = best.boundingBox.width * best.boundingBox.height;
      // Prefer higher confidence, or if equal, larger area
      if (current.confidence > best.confidence) return current;
      if (current.confidence === best.confidence && currentArea > bestArea) return current;
      return best;
    });

    mergedFaces.push(bestFace);
  }

  return mergedFaces;
}

/**
 * Calculate overlap ratio between two bounding boxes
 */
function calculateOverlap(
  box1: { x: number; y: number; width: number; height: number },
  box2: { x: number; y: number; width: number; height: number }
): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  if (x2 <= x1 || y2 <= y1) return 0;

  const intersectionArea = (x2 - x1) * (y2 - y1);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const smallerArea = Math.min(box1Area, box2Area);

  return smallerArea > 0 ? intersectionArea / smallerArea : 0;
}

// Evaluate face detection results and determine severity
function evaluateFaceDetection(
  faces: FaceData[],
  frameWidth: number,
  frameHeight: number
): FaceDetectionResult {
  const frameArea = frameWidth * frameHeight;
  
  // No face detected
  if (faces.length === 0) {
    return {
      faceCount: 0,
      faces: [],
      severity: CONFIG.NO_FACE_SEVERITY,
      eventType: 'no_face_detected',
      message: 'No face detected in frame',
      confidence: 0.9, // High confidence that there's no face
    };
  }
  
  // Multiple faces detected
  if (faces.length > 1) {
    return {
      faceCount: faces.length,
      faces: faces,
      severity: CONFIG.MULTIPLE_FACES_SEVERITY,
      eventType: 'multiple_faces',
      message: `${faces.length} faces detected`,
      confidence: Math.max(...faces.map(f => f.confidence)),
    };
  }
  
  // Single face - check size
  const face = faces[0];
  const faceArea = face.boundingBox.width * face.boundingBox.height;
  const ratio = faceArea / frameArea;
  
  if (ratio < CONFIG.MIN_FACE_SIZE_RATIO * 2) {
    return {
      faceCount: 1,
      faces: faces,
      severity: CONFIG.FACE_TOO_SMALL_SEVERITY,
      eventType: 'face_too_far',
      message: 'Face appears too far from camera',
      confidence: face.confidence,
    };
  }
  
  // Normal - single face at good distance
  return {
    faceCount: 1,
    faces: faces,
    severity: CONFIG.NORMAL_SEVERITY,
    eventType: 'face_detected',
    message: 'Face detected normally',
    confidence: face.confidence,
  };
}

// Accumulated violation tracking for session
export interface ViolationTracker {
  noFaceCount: number;
  multipleFacesCount: number;
  faceTooFarCount: number;
  lastEventTime: number;
  totalSnapshots: number;
}

export function createViolationTracker(): ViolationTracker {
  return {
    noFaceCount: 0,
    multipleFacesCount: 0,
    faceTooFarCount: 0,
    lastEventTime: Date.now(),
    totalSnapshots: 0,
  };
}

export function updateViolationTracker(
  tracker: ViolationTracker,
  result: FaceDetectionResult
): ViolationTracker {
  const updated = { ...tracker };
  updated.totalSnapshots++;
  updated.lastEventTime = Date.now();
  
  switch (result.eventType) {
    case 'no_face_detected':
      updated.noFaceCount++;
      break;
    case 'multiple_faces':
      updated.multipleFacesCount++;
      break;
    case 'face_too_far':
      updated.faceTooFarCount++;
      break;
  }
  
  return updated;
}

// Calculate overall session severity based on accumulated violations
export function calculateSessionSeverity(tracker: ViolationTracker): {
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  shouldFlag: boolean;
} {
  const { noFaceCount, multipleFacesCount, faceTooFarCount, totalSnapshots } = tracker;
  
  // Critical: multiple faces detected (potential cheating)
  if (multipleFacesCount >= 1) {
    return {
      severity: 'critical',
      recommendation: 'Multiple people detected - requires manual review',
      shouldFlag: true,
    };
  }
  
  // High: frequent no-face events
  const noFaceRatio = totalSnapshots > 0 ? noFaceCount / totalSnapshots : 0;
  if (noFaceCount >= 5 || noFaceRatio > 0.3) {
    return {
      severity: 'high',
      recommendation: 'Candidate frequently not visible - possible misconduct',
      shouldFlag: true,
    };
  }
  
  // Medium: some issues
  if (noFaceCount >= 2 || faceTooFarCount >= 3) {
    return {
      severity: 'medium',
      recommendation: 'Some visibility issues detected',
      shouldFlag: false,
    };
  }
  
  return {
    severity: 'low',
    recommendation: 'Normal proctoring session',
    shouldFlag: false,
  };
}
