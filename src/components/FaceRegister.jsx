import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle2, AlertCircle, Loader2, User, Scan, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
const FACEAPI_CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';

const FaceRegister = ({ userId, userName, onClose, onSuccess }) => {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep]       = useState('loading'); // loading | ready | capturing | captured | saving | done | error
  const [message, setMessage] = useState('Loading face recognition library...');
  const [captured, setCaptured] = useState(null); // the descriptor array

  useEffect(() => {
    initFaceAPI();
    return () => stopCamera();
  }, []);

  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  const initFaceAPI = async () => {
    try {
      if (!window.faceapi) {
        setMessage('Loading face-api.js library (first time may take ~10s)...');
        await loadScript(FACEAPI_CDN);
      }
      const faceapi = window.faceapi;
      setMessage('Loading recognition models...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setMessage('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep('ready');
      setMessage(`Ready! Centre your face in the frame, then click "Capture Face".`);
    } catch (err) {
      console.error('FaceAPI init error:', err);
      setStep('error');
      setMessage('Error: Could not load camera or models. Ensure camera permissions are allowed and you have internet access.');
    }
  };

  const drawCanvas = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width  = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const captureFace = async () => {
    setStep('capturing');
    setMessage('Detecting face — please hold still...');
    drawCanvas();
    try {
      const faceapi = window.faceapi;
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
      const result = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!result) {
        setStep('ready');
        setMessage('No face detected. Make sure your face is clearly visible and well lit.');
        return;
      }

      // Draw bounding box on canvas
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        canvas.width  = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const box = result.detection.box;
        ctx.strokeStyle = '#14B8A6';
        ctx.lineWidth   = 3;
        ctx.shadowColor = '#14B8A6';
        ctx.shadowBlur  = 12;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#14B8A6';
        ctx.fillText('✓ Face captured', box.x, box.y - 8);
      }

      setCaptured(Array.from(result.descriptor));
      setStep('captured');
      setMessage(`Face captured successfully! Click "Save Face" to register for ${userName}.`);
    } catch (err) {
      console.error('Capture error:', err);
      setStep('ready');
      setMessage('Detection failed. Please try again.');
    }
  };

  const saveFace = async () => {
    if (!captured) return;
    setStep('saving');
    setMessage('Saving face to database...');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config   = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await api.put(`/api/users/${userId}/face`, { descriptor: captured }, config);
      setStep('done');
      setMessage(`✓ Face registered for ${userName}! They can now use Face Check-In.`);
      stopCamera();
      setTimeout(() => { onSuccess && onSuccess(); onClose && onClose(); }, 2000);
    } catch (err) {
      setStep('error');
      setMessage(err.response?.data?.message || 'Failed to save face. Please try again.');
    }
  };

  const retake = () => {
    setCaptured(null);
    setStep('ready');
    drawCanvas();
    setMessage('Ready! Centre your face and click "Capture Face".');
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const stepColor = {
    loading:   'text-blue-400',
    ready:     'text-[var(--color-accent)]',
    capturing: 'text-yellow-400',
    captured:  'text-purple-400',
    saving:    'text-blue-400',
    done:      'text-teal-400',
    error:     'text-red-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card w-full max-w-lg relative overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-accent)]/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-accent)]/10">
              <Scan className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="font-bold text-white">Register Face</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Registering for: <span className="text-white font-semibold">{userName}</span>
              </p>
            </div>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black aspect-video overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Overlay face guide ring */}
          {(step === 'ready' || step === 'capturing') && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-48 h-48 rounded-full border-2 ${step === 'capturing' ? 'border-yellow-400 animate-pulse' : 'border-[var(--color-accent)]/60'} shadow-[0_0_20px_rgba(20,184,166,0.3)]`} />
            </div>
          )}

          {/* Loading overlay */}
          {(step === 'loading' || step === 'saving') && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
              <p className="text-white text-sm font-medium">Please wait...</p>
            </div>
          )}

          {/* Done overlay */}
          {step === 'done' && (
            <div className="absolute inset-0 bg-teal-500/20 flex flex-col items-center justify-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-teal-400" />
              <p className="text-white text-sm font-bold">Face Registered!</p>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-primary-bg)]/50">
          <p className={`text-sm font-medium flex items-center gap-2 ${stepColor[step] || 'text-white'}`}>
            {step === 'loading' || step === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> :
             step === 'done'    ? <CheckCircle2 className="w-4 h-4" /> :
             step === 'error'   ? <AlertCircle  className="w-4 h-4" /> :
             step === 'ready'   ? <Camera className="w-4 h-4" /> :
             step === 'captured'? <User className="w-4 h-4" /> :
             <Scan className="w-4 h-4" />}
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-5 flex gap-3 justify-end">
          <button onClick={() => { stopCamera(); onClose(); }} className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)] hover:bg-white/5 transition-colors text-sm">
            Cancel
          </button>
          {step === 'ready' && (
            <button onClick={captureFace} className="flex items-center gap-2 px-5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-lg transition-all shadow-[0_0_15px_rgba(20,184,166,0.35)] text-sm">
              <Camera className="w-4 h-4" /> Capture Face
            </button>
          )}
          {step === 'captured' && (
            <>
              <button onClick={retake} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white font-medium rounded-lg border border-[var(--color-border)] hover:bg-white/10 transition-colors text-sm">
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button onClick={saveFace} className="flex items-center gap-2 px-5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-lg transition-all shadow-[0_0_15px_rgba(20,184,166,0.35)] text-sm">
                <CheckCircle2 className="w-4 h-4" /> Save Face
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FaceRegister;
