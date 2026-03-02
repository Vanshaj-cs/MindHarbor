import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import Button from '../common/Button';

const CameraDetection = ({ onDetect }) => {
  const [active, setActive] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setError(null);
    setSnapshot(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);
    } catch (err) {
      const messages = {
        NotAllowedError: 'Camera access was denied. Please allow camera permissions and try again.',
        NotFoundError: 'No camera found on this device.',
        NotReadableError: 'Camera is already in use by another application.',
      };
      setError(messages[err.name] || 'Could not access the camera. Please try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
    setDetecting(false);
    setSnapshot(null);
    setError(null);
  };

  const handleToggle = () => {
    if (active) stopCamera();
    else startCamera();
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setSnapshot(dataUrl);
    return dataUrl;
  };

  const handleDetect = async () => {
    setDetecting(true);
    setError(null);

    try {
      const dataUrl = captureSnapshot();
      if (!dataUrl) throw new Error('Failed to capture snapshot.');

      // Convert base64 dataURL → Blob → FormData
      const fetchRes = await fetch(dataUrl);
      const blob = await fetchRes.blob();

      const formData = new FormData();
      formData.append('image', blob, 'snapshot.jpg');

      // POST to the correct endpoint
      const response = await fetch('http://localhost:5000/api/mood/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (onDetect) {
        onDetect({
          emotion: result.emotion,
          confidence: result.confidence,
          emoji: result.emoji,
        });
      }
    } catch (err) {
      setError(`Detection failed: ${err.message}`);
      setSnapshot(null);
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Camera Mood Detection</h3>
      <p className="text-xs text-text-muted mb-4">
        Let our AI detect your current mood through facial expression analysis
      </p>

      <div
        className={`
          relative w-full aspect-video rounded-xl overflow-hidden
          flex items-center justify-center
          ${active ? 'bg-gray-900' : 'bg-surface-raised'}
          transition-colors duration-300
        `}
      >
        {/* Live video — mirrored for natural selfie feel */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${active && !snapshot ? 'block' : 'hidden'}`}
        />

        {/* Frozen snapshot preview while awaiting backend */}
        {snapshot && (
          <img
            src={snapshot}
            alt="Captured snapshot"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Detecting overlay */}
        {detecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
            <div className="w-40 h-40 rounded-full border-2 border-emerald-400 animate-ping opacity-30" />
            <div className="absolute w-40 h-40 rounded-full border-2 border-dashed border-emerald-400 opacity-70" />
            <p className="absolute bottom-4 text-xs text-emerald-300 bg-black/50 px-3 py-1 rounded-full">
              Analyzing your expression...
            </p>
          </div>
        )}

        {/* Inactive state */}
        {!active && !error && (
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-forest-800/30 flex items-center justify-center mb-3">
              <CameraOff size={24} className="text-emerald-400" />
            </div>
            <p className="text-sm text-text-secondary">Camera is off</p>
            <p className="text-xs text-text-muted mt-1">
              Enable camera to detect your mood automatically
            </p>
          </div>
        )}

        {/* Error state (camera off) */}
        {error && !active && (
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center mb-3">
              <CameraOff size={24} className="text-red-400" />
            </div>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Inline error banner when camera is still active */}
      {error && active && (
        <p className="text-xs text-red-400 mt-2 px-1">{error}</p>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-3 mt-4">
        <Button
          variant={active ? 'danger' : 'primary'}
          size="sm"
          icon={active ? CameraOff : Camera}
          onClick={handleToggle}
        >
          {active ? 'Turn Off' : 'Enable Camera'}
        </Button>
        {active && (
          <Button variant="secondary" size="sm" onClick={handleDetect} disabled={detecting}>
            {detecting ? 'Detecting...' : 'Detect Mood'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraDetection;