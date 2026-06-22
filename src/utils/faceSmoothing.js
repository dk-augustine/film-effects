import * as faceapi from 'face-api.js';

export const loadModels = async () => {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
};

export const applyFaceSmoothing = async (canvas, originalImage, intensity) => {
  if (intensity === 0) return;

  const detections = await faceapi.detectAllFaces(
    originalImage, 
    new faceapi.TinyFaceDetectorOptions()
  ).withFaceLandmarks();

  if (detections.length === 0) return;

  const ctx = canvas.getContext('2d');
  
  // Create a temporary canvas for the blurred version
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = canvas.width;
  blurCanvas.height = canvas.height;
  const blurCtx = blurCanvas.getContext('2d');
  
  // Draw current state
  blurCtx.drawImage(canvas, 0, 0);
  
  // Apply a strong blur to the temporary canvas
  // The intensity controls how much we blend this blurred version back in
  const blurAmount = (intensity / 100) * 10;
  blurCtx.filter = `blur(${blurAmount}px)`;
  blurCtx.drawImage(canvas, 0, 0);

  // Now, we only want to apply this blur to the skin regions (cheeks, forehead, chin)
  // We'll create a mask path using the facial landmarks
  
  detections.forEach(detection => {
    const landmarks = detection.landmarks;
    const jawOutline = landmarks.getJawOutline();
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const mouth = landmarks.getMouth();

    ctx.save();
    
    // Create a path for the face
    ctx.beginPath();
    jawOutline.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    // Complete the loop roughly around forehead
    ctx.lineTo(jawOutline[0].x, jawOutline[0].y - 50); 
    ctx.closePath();

    ctx.clip(); // Clip to face bounds

    // Blend the blurred version over the original, but only inside the face path
    // The global alpha controls the "strength" of the skin smoothing
    ctx.globalAlpha = intensity / 100;
    ctx.drawImage(blurCanvas, 0, 0);

    // To be more precise (like real Meitu), we'd want to "un-blur" the eyes and lips.
    // For this MVP, we will restore the original image data over the eyes and mouth.
    
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'destination-out';
    
    // Clear out blur from left eye
    ctx.beginPath();
    ctx.ellipse(leftEye[0].x + 10, leftEye[0].y, 25, 15, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Clear out blur from right eye
    ctx.beginPath();
    ctx.ellipse(rightEye[0].x - 10, rightEye[0].y, 25, 15, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Clear out blur from mouth
    ctx.beginPath();
    ctx.ellipse(mouth[0].x + 20, mouth[0].y, 35, 20, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  });
};
