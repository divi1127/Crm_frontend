import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, CheckCircle2, AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
const FACEAPI_CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';

const euclideanDist = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
};

const FaceLoginVerify = ({ userInfo, onClose, onSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const activeRef = useRef(true);

  const [step, setStep] = useState('loading');
  const [message, setMessage] = useState('Loading face recognition models...');
  const [matched, setMatched] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    activeRef.current = true;
    initRecognition();
    return () => {
      activeRef.current = false;
      cleanup();
    };
  }, []);

  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const initRecognition = async () => {
    try {
      if (!window.faceapi) {
        setMessage('Loading face-api.js (first run may take ~10s)...');
        await loadScript(FACEAPI_CDN);
      }
      const faceapi = window.faceapi;
      setMessage('Loading recognition models...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      if (!userInfo || !userInfo.token) {
        setStep('error');
        setMessage('Login session expired. Please sign in again.');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data: users } = await axios.get('/api/users/faces', config);
      const registered = users
        .filter((u) => u.faceDescriptor)
        .map((u) => ({
          id: u.id,
          name: u.name,
          descriptor: new Float32Array(JSON.parse(u.faceDescriptor)),
        }));

      if (registered.length === 0) {
        setStep('error');
        setMessage('No registered face data found. Ask your admin to register your face.');
        return;
      }

      setMessage('Opening the camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStep('ready');
      setMessage(`Camera ready. Look into the frame to verify your face.`);
      startScanning(faceapi, registered);
    } catch (err) {
      console.error('FaceLoginVerify init error:', err);
      if (activeRef.current) {
        setStep('error');
        setMessage('Unable to start face detection. Check camera permission and try again.');
      }
    }
  };

  const startScanning = (faceapi, registered) => {
    intervalRef.current = setInterval(async () => {
      if (!activeRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 3) return;

      setStep('scanning');
      try {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 });
        const result = await faceapi
          .detectSingleFace(videoRef.current, options)
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        if (!result) {
          setStep('ready');
          setMessage('No face detected. Move closer and look at the camera.');
          clearCanvas();
          return;
        }

        drawBox(result.detection.box, '#14B8A6', false);

        let bestDist = Infinity;
        let bestMatch = null;
        for (const user of registered) {
          const distance = euclideanDist(result.descriptor, user.descriptor);
          if (distance < bestDist) {
            bestDist = distance;
            bestMatch = user;
          }
        }

        const THRESHOLD = 0.52;
        if (bestDist <= THRESHOLD && bestMatch) {
          clearInterval(intervalRef.current);
          const pct = Math.round((1 - bestDist) * 100);
          setConfidence(pct);
          drawBox(result.detection.box, '#10B981', true, bestMatch.name);
          setMatched(bestMatch);

          if (bestMatch.id !== Number(userInfo.id)) {
            setStep('error');
            setMessage(`Face matched ${bestMatch.name}, but you are signed in as ${userInfo.name}. Use your own registered face.`);
            return;
          }

          setStep('matched');
          setMessage(`Face verified: ${bestMatch.name} (${pct}% confidence). Recording attendance...`);
          await performCheckIn(bestMatch);
        } else {
          drawBox(result.detection.box, '#F59E0B', false, 'Unknown');
          setStep('noMatch');
          setMessage('Face unrecognized. Try again or ask admin to register your face.');
        }
      } catch (err) {
        // ignore temporary errors and keep scanning
      }
    }, 1200);
  };

  const drawBox = (box, colour, glow, label = '') => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (glow) {
      ctx.shadowColor = colour;
      ctx.shadowBlur = 18;
    }
    ctx.strokeStyle = colour;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    if (label) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = colour;
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(label, box.x + 6, box.y - 8);
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return null;
    const photoCanvas = document.createElement('canvas');
    photoCanvas.width = videoRef.current.videoWidth || 640;
    photoCanvas.height = videoRef.current.videoHeight || 480;
    const ctx = photoCanvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, photoCanvas.width, photoCanvas.height);
    return photoCanvas.toDataURL('image/jpeg', 0.8);
  };

  const getLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('Geolocation unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`),
      () => resolve('Location unavailable'),
      { timeout: 10000 }
    );
  });

  const performCheckIn = async (employee) => {
    try {
      const photo = capturePhoto();
      const location = await getLocation();
      const now = new Date();
      const payload = {
        employeeId: employee.id,
        employeeName: employee.name,
        faceVerified: true,
        location,
        photo,
      };
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post('/api/attendances/checkin', payload, config);
      setSummary({ photo, location, time: now.toLocaleString(), record: data });
      setStep('success');
      setMessage('Face verified and attendance recorded. Redirecting to dashboard...');
      setTimeout(() => {
        onSuccess && onSuccess(data);
        cleanup();
      }, 2000);
    } catch (err) {
      if (activeRef.current) {
        setStep('error');
        setMessage(err.response?.data?.message || 'Attendance recording failed. Try again.');
      }
    }
  };

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const retry = () => {
    cleanup();
    setMatched(null);
    setConfidence(0);
    setSummary(null);
    setStep('loading');
    setMessage('Restarting face recognition...');
    initRecognition();
  };

  const statusColor = {
    loading: 'border-blue-500/30',
    ready: 'border-[var(--color-accent)]/40',
    scanning: 'border-yellow-500/30',
    matched: 'border-teal-500/30',
    noMatch: 'border-yellow-500/40',
    error: 'border-red-500/30',
    success: 'border-teal-500/30',
  };

  const textColor = {
    loading: 'text-blue-400',
    ready: 'text-[var(--color-accent)]',
    scanning: 'text-yellow-400',
    matched: 'text-teal-400',
    noMatch: 'text-yellow-400',
    error: 'text-red-400',
    success: 'text-teal-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`glass-card w-full max-w-xl overflow-hidden border-2 transition-colors ${statusColor[step]}`}
      >
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-accent)]/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${step === 'success' || step === 'matched' ? 'bg-teal-500/20' : 'bg-[var(--color-accent)]/10'}`}>
              {step === 'success' || step === 'matched' ? <ShieldCheck className="w-5 h-5 text-teal-400" /> : <Camera className="w-5 h-5 text-[var(--color-accent)]" />}
            </div>
            <div>
              <h2 className="font-bold text-white">Face Verification</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {step === 'success'
                  ? 'Attendance recorded successfully'
                  : 'Verify your face to access the dashboard'}
              </p>
            </div>
          </div>
          <button onClick={() => { cleanup(); onClose && onClose(); }} className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black" style={{ aspectRatio: '4 / 3' }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
          {(step === 'ready' || step === 'scanning' || step === 'noMatch') && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-44 h-56 rounded-full border-2 ${step === 'scanning' ? 'border-yellow-400 animate-pulse' : 'border-[var(--color-accent)]/50'}`} />
            </div>
          )}
          {step === 'loading' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
              </div>
              <p className="text-white text-sm text-center px-6">{message}</p>
            </div>
          )}
          {(step === 'error' || step === 'success') && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-4 px-6 text-center">
              {step === 'error' ? <AlertCircle className="w-10 h-10 text-red-400" /> : <CheckCircle2 className="w-10 h-10 text-teal-400" />}
              <p className={`text-sm font-medium ${textColor[step]}`}>{message}</p>
              {step === 'success' && summary && (
                <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-bg)] p-4 text-left text-sm text-[var(--color-text-secondary)]">
                  <p className="text-white font-semibold mb-2">Attendance details</p>
                  <p><span className="font-semibold text-white">Time:</span> {summary.time}</p>
                  <p><span className="font-semibold text-white">Location:</span> {summary.location}</p>
                  {summary.photo && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-[var(--color-border)] bg-black">
                      <img src={summary.photo} alt="Captured" className="w-full h-auto object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {step === 'scanning' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-400 text-[10px] font-bold uppercase tracking-wide">Scanning</span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-primary-bg)]/60">
          <p className={`text-sm font-medium flex items-center gap-2 ${textColor[step] || 'text-white'}`}>
            {step === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === 'scanning' && <Camera className="w-4 h-4" />}
            {step === 'matched' && <CheckCircle2 className="w-4 h-4" />}
            {step === 'noMatch' && <AlertCircle className="w-4 h-4" />}
            {step === 'error' && <AlertCircle className="w-4 h-4" />}
            {step === 'success' && <CheckCircle2 className="w-4 h-4" />}
            <span className="line-clamp-2">{message}</span>
          </p>
        </div>

        <div className="p-4 flex justify-end gap-3">
          <button onClick={() => { cleanup(); onClose && onClose(); }} className="px-4 py-2 bg-[var(--color-primary-bg)] text-white rounded-lg border border-[var(--color-border)] hover:bg-white/5 transition-colors text-sm">
            Cancel
          </button>
          {(step === 'error' || step === 'noMatch') && (
            <button onClick={retry} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg transition-all text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FaceLoginVerify;
