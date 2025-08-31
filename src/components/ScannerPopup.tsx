'use client'

import React, { useState, useRef, useEffect, SVGProps } from 'react';

interface ScannerAiMobileProps {
  onClose: () => void;
}

export default function ScannerAiMobile({ onClose }: ScannerAiMobileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        // handle error
      }
    };
    getCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const captureImage = (): Promise<{ imageData: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const mimeType = 'image/jpeg';
          const imageData = canvas.toDataURL(mimeType);
          resolve({ imageData: imageData.split(',')[1], mimeType });
        } else {
          reject(new Error('Could not get 2D context'));
        }
      } else {
        reject(new Error('Video or canvas not available'));
      }
    });
  };

  const handleScanNow = async () => {
    setIsLoading(true);
    setScanResult(null);
    try {
      const { imageData, mimeType } = await captureImage();
      const response = await fetch('/api/llm/openrouter/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, mimeType }),
      });
      const data = await response.json();
      setScanResult(data.text);
    } catch {
      setScanResult('Scan error!');
    } finally {
      setIsLoading(false);
    }
  };

  const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between relative font-sans">
      {/* TOP ICONS */}
      <div className="flex items-center justify-between w-full px-6 pt-6">
        <button className="p-2"><svg className="h-5 w-5" fill="none" stroke="white"><path d="M3 3v4"/></svg></button>
        <button className="p-2"><svg className="h-5 w-5" fill="none" stroke="white"><circle cx="12" cy="12" r="2"/></svg></button>
        <button className="p-2"><svg className="h-5 w-5" fill="none" stroke="white"><circle cx="12" cy="12" r="2"/></svg></button>
        {/* Close button */}
        <button onClick={onClose} className="p-2">
          <CloseIcon className="h-5 w-5 text-white" />
        </button>
      </div>
      {/* LABEL */}
      <div className="mt-4 text-center text-lg tracking-widest font-bold">
        SCANNER
      </div>
      {/* SCANNER BORDER */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-72 h-96 rounded-xl border-2 border-white/50 flex items-center justify-center">
          {/* Scanner corners */}
          <div className="absolute left-0 top-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
          <div className="absolute right-0 top-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
          <div className="absolute left-0 bottom-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
          <div className="absolute right-0 bottom-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
          {/* Camera/video layer */}
          <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover z-0" />
          <canvas ref={canvasRef} className="hidden" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <span className="text-lg font-bold">Scanning...</span>
            </div>
          )}
          {scanResult && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4 text-center">
              <span>{scanResult}</span>
            </div>
          )}
          {/* Middle lines */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-5 pointer-events-none">
            <div className="h-[2px] bg-white/60 rounded-full"></div>
            <div className="h-[2px] bg-white/40 rounded-full"></div>
          </div>
        </div>
      </div>
      {/* AI LABEL */}
      <div className="text-center mb-2">AI</div>
      {/* CIRCLE BUTTON */}
      <button
        onClick={handleScanNow}
        className="mx-auto mb-6 bg-white text-black rounded-full px-10 py-3 font-semibold text-xl shadow-lg hover:bg-gray-200 transition duration-150"
        disabled={isLoading}
      >
        SCAN
      </button>
    </div>
  );
}
