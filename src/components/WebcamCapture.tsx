import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (canvas: HTMLCanvasElement) => void;
  isActive: boolean;
  onStop: () => void;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  isActive,
  onStop,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isActive) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isActive]);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      setError('Failed to access webcam. Please check permissions.');
      console.error('Webcam error:', err);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onCapture(canvas);
        stopWebcam();
        onStop();
      }
    }
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
        <CameraOff className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg bg-slate-900"
      />
      {isActive && (
        <div className="mt-4 flex gap-3 justify-center">
          <button
            onClick={captureFrame}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Camera className="w-5 h-5" />
            Capture Frame
          </button>
          <button
            onClick={() => {
              stopWebcam();
              onStop();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <CameraOff className="w-5 h-5" />
            Stop Webcam
          </button>
        </div>
      )}
    </div>
  );
};
