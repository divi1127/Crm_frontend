const MODEL_URL = '/models';
const FACEAPI_URL = '/lib/face-api.min.js';

let faceapiPromise = null;
let modelsPromise = null;

const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
  const script = document.createElement('script');
  script.src = src;
  script.onload = resolve;
  script.onerror = () => reject(new Error(`Failed to load ${src}`));
  document.head.appendChild(script);
});

export const getFaceapi = () => {
  if (!faceapiPromise) {
    faceapiPromise = loadScript(FACEAPI_URL).then(() => window.faceapi);
  }
  return faceapiPromise;
};

export const ensureModels = () => {
  if (!modelsPromise) {
    modelsPromise = getFaceapi().then((faceapi) =>
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]).then(() => faceapi)
    );
  }
  return modelsPromise;
};