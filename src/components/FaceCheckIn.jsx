import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Camera, X, CheckCircle2, AlertCircle, Loader2,
  Scan, UserCheck, RefreshCw, ShieldCheck
} from 'lucide-react';
import axios from 'axios';

const MODEL_URL    = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
const FACEAPI_CDN  = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';

/* ───── Euclidean distance ───── */
const euclideanDist = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
};

const FaceCheckIn = ({ onSuccess, onClose }) => {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);
  const isActiveRef = useRef(true);

  const [step, setStep]         = useState('loading');
  // loading | ready | scanning | matched | noFace | error | noMatch
  const [message, setMessage]   = useState('Loading face recognition models...');
  const [matched, setMatched]   = useState(null);
  const [confidence, setConf]   = useState(0);

  useEffect(() => {
    isActiveRef.current = true;
    initAll();
    return () => {
      isActiveRef.current = false;
      cleanup();
    };
  }, []);

  /* ── load script helper ── */
  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  /* ── main initialiser ── */
  const initAll = async () => {
    try {
      if (!window.faceapi) {
        setMessage('Loading face-api.js (first run ~10 s)...');
        await loadScript(FACEAPI_CDN);
      }
      const faceapi = window.faceapi;

      setMessage('Loading recognition models...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        setStep('error');
        setMessage('Please login before using Face Check-In.');
        return;
      }

      /* fetch registered face descriptors */
      const config   = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data: users } = await axios.get('/api/users/faces', config);

      const registered = users
        .filter(u => u.faceDescriptor)
        .map(u => ({
          id:         u.id,
          name:       u.name,
          descriptor: new Float32Array(JSON.parse(u.faceDescriptor)),
        }));

      if (registered.length === 0) {
        setStep('error');
        setMessage('No faces are registered yet. Ask your Admin to register faces first via the Employees page.');
        return;
      }

      /* start camera */
      setMessage('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStep('ready');
      setMessage(`Camera ready. ${registered.length} employee(s) registered — look at the camera!`);

      /* start scanning loop */
      startScanning(faceapi, registered, userInfo);
    } catch (err) {
      console.error('FaceCheckIn init:', err);
      if (isActiveRef.current) {
        setStep('error');
        setMessage('Failed to start face recognition. Check camera permissions and internet access.');
      }
    }
  };

  /* ── detection loop ── */
  const startScanning = (faceapi, registered, currentUser) => {
    intervalRef.current = setInterval(async () => {
      if (!isActiveRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 3) return;

      setStep('scanning');
      try {
        const opts   = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 });
        const result = await faceapi
          .detectSingleFace(videoRef.current, opts)
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        if (!result) {
          setStep('ready');
          setMessage('No face detected — move closer and look straight at the camera.');
          clearCanvas();
          return;
        }

        /* draw detection box */
        drawBox(result.detection.box, '#14B8A6', false);

        /* compare against all registered descriptors */
        let bestDist  = Infinity;
        let bestMatch = null;
        for (const reg of registered) {
          const d = euclideanDist(result.descriptor, reg.descriptor);
          if (d < bestDist) { bestDist = d; bestMatch = reg; }
        }

        const THRESHOLD = 0.52;
        if (bestDist <= THRESHOLD && bestMatch) {
          clearInterval(intervalRef.current);
          const pct = Math.round((1 - bestDist) * 100);
          setConf(pct);
          drawBox(result.detection.box, '#10B981', true, bestMatch.name);
          setMatched(bestMatch);
          setStep('matched');

          const currentUserId = Number(currentUser.id);
          if (bestMatch.id !== currentUserId) {
            setStep('error');
            setMessage(`Detected ${bestMatch.name}, but you are signed in as ${currentUser.name}. Please use your own face.`);
            return;
          }

          setMessage(`✓ Recognised: ${bestMatch.name} (${pct}% confidence). Checking in...`);
          await performCheckIn(bestMatch);
        } else {
          drawBox(result.detection.box, '#F59E0B', false, 'Unknown');
          setStep('noMatch');
          setMessage(`Face detected but not recognised (score: ${(1 - bestDist).toFixed(2)}). Try again or register your face.`);
        }
      } catch (err) {
        // silent — will retry
      }
    }, 1500);
  };

  /* ── canvas helpers ── */
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const drawBox = (box, colour, glow, label = '') => {
    if (!canvasRef.current || !videoRef.current) return;
    const c   = canvasRef.current;
    c.width   = videoRef.current.videoWidth;
    c.height  = videoRef.current.videoHeight;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    if (glow) { ctx.shadowColor = colour; ctx.shadowBlur = 20; }
    ctx.strokeStyle = colour;
    ctx.lineWidth   = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    if (label) {
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = colour;
      ctx.font        = 'bold 14px Inter, sans-serif';
      ctx.fillText(label, box.x + 4, box.y - 8);
    }
  };

  /* ── auto check-in ── */
  const performCheckIn = async (employee) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config   = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post('/api/attendances/checkin', {
        employeeId:    employee.id,
        employeeName:  employee.name,
        faceVerified:  true,
      }, config);
      setTimeout(() => {
        if (!isActiveRef.current) return;
        onSuccess && onSuccess(data, employee.name);
        cleanup();
        onClose && onClose();
      }, 2200);
    } catch (err) {
      if (isActiveRef.current) {
        setStep('error');
        setMessage(err.response?.data?.message || 'Check-in failed. Try again.');
      }
    }
  };

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retry = () => {
    cleanup();
    setStep('loading');
    setMessage('Restarting...');
    setMatched(null);
    isActiveRef.current = true;
    initAll();
  };

  /* ── colour map ── */
  const borderColor = {
    loading:  'border-blue-500/30',
    ready:    'border-[var(--color-accent)]/40',
    scanning: 'border-yellow-500/30',
    matched:  'border-teal-500/30',
    noMatch:  'border-yellow-500/40',
    error:    'border-red-500/30',
    noFace:   'border-[var(--color-border)]',
  };

  const msgColor = {
    loading:  'text-blue-400',
    ready:    'text-[var(--color-accent)]',
    scanning: 'text-yellow-400',
    matched:  'text-teal-400',
    noMatch:  'text-yellow-400',
    error:    'text-red-400',
    noFace:   'text-[var(--color-text-secondary)]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`glass-card w-full max-w-lg relative overflow-hidden border-2 transition-colors ${borderColor[step]}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-accent)]/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${step === 'matched' ? 'bg-teal-500/20' : 'bg-[var(--color-accent)]/10'}`}>
              {step === 'matched'
                ? <ShieldCheck className="w-5 h-5 text-teal-400" />
                : <Scan className="w-5 h-5 text-[var(--color-accent)]" />
              }
            </div>
            <div>
              <h2 className="font-bold text-white">Face Check-In</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {step === 'matched'
                  ? `Recognised as ${matched?.name}`
                  : 'Look at the camera to auto check-in'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { cleanup(); onClose && onClose(); }}
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Feed */}
        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
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
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Face guide oval */}
          {(step === 'ready' || step === 'scanning' || step === 'noMatch') && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-44 h-56 rounded-full border-2 ${
                step === 'scanning' ? 'border-yellow-400 animate-pulse' :
                step === 'noMatch'  ? 'border-orange-400' :
                'border-[var(--color-accent)]/50'
              }`} />
            </div>
          )}

          {/* Loading overlay */}
          {(step === 'loading') && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
              </div>
              <p className="text-white text-sm font-medium text-center px-6">{message}</p>
            </div>
          )}

          {/* Error overlay */}
          {step === 'error' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-red-400 text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Success overlay */}
          {step === 'matched' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-teal-500/10 flex flex-col items-center justify-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="p-5 rounded-full bg-teal-500/20 border-2 border-teal-400/40"
              >
                <UserCheck className="w-10 h-10 text-teal-400" />
              </motion.div>
              <div className="text-center">
                <p className="text-teal-300 text-lg font-bold">{matched?.name}</p>
                <p className="text-teal-400 text-sm">{confidence}% match — Checking in...</p>
              </div>
            </motion.div>
          )}

          {/* Scanning indicator */}
          {step === 'scanning' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-400 text-[10px] font-bold uppercase tracking-wide">Scanning</span>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-primary-bg)]/50">
          <p className={`text-sm font-medium flex items-center gap-2 ${msgColor[step] || 'text-white'}`}>
            {step === 'loading'   && <Loader2     className="w-4 h-4 animate-spin flex-shrink-0" />}
            {step === 'scanning'  && <Scan        className="w-4 h-4 flex-shrink-0 animate-pulse" />}
            {step === 'matched'   && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {step === 'error'     && <AlertCircle  className="w-4 h-4 flex-shrink-0" />}
            {step === 'ready'     && <Camera       className="w-4 h-4 flex-shrink-0" />}
            {step === 'noMatch'   && <AlertCircle  className="w-4 h-4 flex-shrink-0" />}
            <span className="line-clamp-2">{message}</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="p-4 flex gap-3 justify-end">
          <button
            onClick={() => { cleanup(); onClose && onClose(); }}
            className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)] hover:bg-white/5 transition-colors text-sm"
          >
            Cancel
          </button>
          {(step === 'error' || step === 'noMatch') && (
            <button
              onClick={retry}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-lg transition-all text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FaceCheckIn;
