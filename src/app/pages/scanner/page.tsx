'use client';

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { Camera, AlertCircle, CheckCircle2, UploadCloud, XCircle, Loader2, ShieldAlert, VideoOff } from 'lucide-react';

export default function ScannerPage() {
  const [feedbackMessage, setFeedbackMessage] = useState('Siap untuk memindai.');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [isScanningActive, setIsScanningActive] = useState(false);

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showScanResultsPopup, setShowScanResultsPopup] = useState(false);
  const [scanResults, setScanResults] = useState('');


  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevImagePreviewUrlBlobRef = useRef<string | null>(null);
  const [showCameraErrorModal, setShowCameraErrorModal] = useState(false);

  useEffect(() => {
    const previousBlobUrl = prevImagePreviewUrlBlobRef.current;
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      prevImagePreviewUrlBlobRef.current = imagePreviewUrl;
    } else {
      prevImagePreviewUrlBlobRef.current = null;
    }
    return () => {
      if (previousBlobUrl && previousBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previousBlobUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    const videoElement = videoRef.current;
    return () => {
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        if (videoElement) videoElement.srcObject = null;
      }
    };
  }, []);

  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const resultString = reader.result?.toString();
        if (resultString) {
            const base64ImageData = resultString.split(',')[1];
            if (base64ImageData) {
                resolve(base64ImageData);
            } else {
                reject(new Error('Gagal memisahkan data base64 dari string hasil pembacaan file.'));
            }
        } else {
             reject(new Error('Gagal konversi file ke base64 (hasil pembacaan kosong).'));
        }
      };
      reader.onerror = (error) => reject(new Error('Gagal baca file: ' + (error instanceof ProgressEvent ? 'ProgressEvent Error' : String(error)) ) );
    });
  }, []);

  const performGeminiScanViaBackend = useCallback(async (imageFile: File | null) => {
    if (!imageFile) {
      setFeedbackMessage('Tidak ada gambar untuk analisis.');
      setFeedbackType('error');
      setIsScanningActive(false);
      return;
    }
    setIsScanningActive(true);
    setFeedbackMessage('Mengkonversi gambar dan mengirim ke AI...');
    setFeedbackType('info');

    let base64ImageData: string;
    const mimeType: string = imageFile.type;

    try {
        base64ImageData = await convertFileToBase64(imageFile);
    } catch (conversionError: unknown) {
        console.error('Error converting file to base64:', conversionError);
        const message = conversionError instanceof Error ? conversionError.message : String(conversionError);
        setFeedbackMessage(`Gagal memproses gambar: ${message}`);
        setFeedbackType('error');
        setIsScanningActive(false);
        return;
    }
    
    const tradingPrompt = `You are a very useful assistant. Help me with determining the analisis day trading content of my market finance. The photo shows market analisis product for a trading. Determine which products are shown in the photo and return them ONLY as a text list, where each list element should contain:
- Market Structure: (e.g., Uptrend, Downtrend, Sideways, Breakout, Support/Resistance levels)
- Candlestick Pattern: (e.g., Doji, Hammer, Engulfing, Morning Star, etc., and its implication)
- Trend Market: (e.g., Strong Bullish, Weak Bullish, Strong Bearish, Weak Bearish, Neutral)
- Signal Type: (e.g., Buy, Sell, Hold, Wait for Confirmation)
- Bandarmology: (Brief analysis of potential institutional activity if discernible, e.g., Accumulation, Distribution, No Clear Sign)
- Rekomendasi Trading:
  - Time Frame: (Choose one or more:15 minute,30 minute,4 hours or 1 Day)
  - Gaya Trading: (Choose one or more: Scalping, Day Trading, Swing Trading, Position Trading)
  - Resiko: (e.g., Low, Medium, High)
  - Rekomendasi Aksi: (e.g., Buy now, Sell now, Wait for pullback to [price], Set stop loss at [price], Target price [price])
- Sentimen Pasar
- Sentimen Media sosial
`;
    try {
      setFeedbackMessage('Mengirim ke AI untuk analisis...');
      
      const response = await fetch('/api/llm/openrouter/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: tradingPrompt,
          imageData: base64ImageData,
          mimeType: mimeType,
        }),
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ error: `Permintaan gagal dengan status ${response.status}` }));
        console.error(`Error from backend API (${response.status}):`, errorResult);
        const displayError = errorResult.error || `Analisis AI gagal (Status: ${response.status})`;
        setFeedbackMessage(displayError);
        setFeedbackType('error');
        setScanResults(`Error: ${displayError}`);
        setShowScanResultsPopup(true);
        setIsScanningActive(false);
        return;
      }

      const result = await response.json();
      
      if (result.text) {
        setScanResults(result.text);
        setShowScanResultsPopup(true);
        setFeedbackMessage('Analisis AI berhasil!');
        setFeedbackType('success');
      } else {
        console.error('Backend response missing text field:', result);
        const errorMessage = result.error || 'Format respons dari AI tidak valid.';
        setFeedbackMessage(errorMessage);
        setFeedbackType('error');
        setScanResults(`Error: ${errorMessage}`);
        setShowScanResultsPopup(true);
      }

    } catch (error: unknown) {
      console.error('Error during Gemini scan fetch:', error);
      const message = error instanceof Error ? error.message : String(error);
      setFeedbackMessage(`Analisis AI gagal: ${message}`);
      setFeedbackType('error');
      setScanResults(`Error: ${message}`);
      setShowScanResultsPopup(true);
    } finally {
      setIsScanningActive(false);
    }
  }, [convertFileToBase64]);

  const closeCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  }, []);

  const openCamera = useCallback(() => {
    if (isScanningActive || isCameraOpen) return;

    setFeedbackMessage('Mengakses kamera...');
    setFeedbackType('info');
    setCameraError(null);
    setShowCameraErrorModal(false);

    if (imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setUploadedImage(null);
    setIsCameraOpen(true); 
    setIsScanningActive(true);
  }, [isScanningActive, isCameraOpen, imagePreviewUrl]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;

    const startCameraStream = async () => {
      if (!videoElement || !isCameraOpen) return;

      if (navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          videoElement.srcObject = stream;
          videoElement.onloadedmetadata = () => {
            setTimeout(() => {
              videoElement.play().then(() => {
                setFeedbackMessage('Kamera aktif. Arahkan & ambil foto.');
                setFeedbackType('info');
              }).catch((err: Error) => {
                const errorMessage = err.message;
                const finalMessage = `Gagal memulai stream video: ${errorMessage}`;
                setCameraError(finalMessage);
                setFeedbackMessage(finalMessage);
                setFeedbackType('error');
                setShowCameraErrorModal(true);
                stream?.getTracks().forEach(track => track.stop());
                setIsCameraOpen(false);
              }).finally(() => {
                setIsScanningActive(false);
              });
            }, 100);
          };
        } catch (err: unknown) {
          let message = 'Gagal akses kamera.';
          const errorName = err instanceof Error ? err.name : undefined;
          const errorMessageText = err instanceof Error ? err.message : String(err);
          if (errorName === "NotAllowedError") message = 'Akses kamera ditolak. Mohon izinkan di pengaturan browser Anda.';
          else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") message = 'Kamera tidak ditemukan. Pastikan kamera terhubung.';
          else if (errorName === "NotReadableError" || errorName === "TrackStartError") message = 'Kamera sedang digunakan atau bermasalah. Coba tutup aplikasi lain yang mungkin menggunakan kamera.';
          else message = `Gagal kamera: ${errorName || errorMessageText}`;
          setCameraError(message);
          setFeedbackMessage(message);
          setFeedbackType('error');
          setShowCameraErrorModal(true);
          setIsCameraOpen(false);
          setIsScanningActive(false);
        }
      } else {
        const msg = 'Fitur kamera tidak didukung di browser atau perangkat ini.';
        setFeedbackMessage(msg);
        setFeedbackType('error');
        setCameraError(msg);
        setShowCameraErrorModal(true);
        setIsCameraOpen(false);
        setIsScanningActive(false);
      }
    };

    if (isCameraOpen && videoElement) {
      startCameraStream();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        if (videoElement) videoElement.srcObject = null;
      }
      if (isScanningActive) {
        setIsScanningActive(false);
      }
    };
  }, [isCameraOpen, isScanningActive]);

  const dataURLtoFile = useCallback((dataurl: string, filename: string): File | null => {
    try {
      const arr = dataurl.split(','); if (arr.length < 2 || !arr[0] || !arr[1]) return null;
      const mimeMatch = arr[0].match(/:(.*?);/); if (!mimeMatch || mimeMatch.length < 2 || !mimeMatch[1]) return null;
      const mime = mimeMatch[1]; const bstr = atob(arr[1]); let n = bstr.length;
      const u8arr = new Uint8Array(n); while (n--) { u8arr[n] = bstr.charCodeAt(n); }
      return new File([u8arr], filename, { type: mime });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Error converting data URL to file:", errorMessage);
      setFeedbackMessage(`Gagal konversi foto: ${errorMessage}`); setFeedbackType('error');
      return null;
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!isCameraOpen || !videoRef.current || !canvasRef.current) {
        setFeedbackMessage('Kamera tidak aktif atau komponen tidak siap.'); setFeedbackType('error'); return;
    }
    if (videoRef.current.readyState >= videoRef.current.HAVE_METADATA && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      setFeedbackMessage('Mengambil foto...'); setFeedbackType('info'); setIsScanningActive(true);
      const video = videoRef.current; const canvas = canvasRef.current;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        if (imagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(dataUrl);
        const photoFile = dataURLtoFile(dataUrl, `scan-${Date.now()}.jpg`);
        if (photoFile) {
          setUploadedImage(photoFile); setFeedbackMessage('Foto diambil. Siap untuk dipindai.'); setFeedbackType('success');
        } else {
          setFeedbackMessage('Gagal memproses foto setelah diambil.'); setFeedbackType('error');
          if (imagePreviewUrl === dataUrl) setImagePreviewUrl(null);
        }
      } else {
        setFeedbackMessage('Gagal mendapatkan konteks canvas untuk mengambil foto.'); setFeedbackType('error');
      }
      closeCamera(); setIsScanningActive(false);
    } else {
        setFeedbackMessage('Kamera belum siap atau stream video tidak valid.'); setFeedbackType('error'); setIsScanningActive(false);
    }
  }, [isCameraOpen, closeCamera, dataURLtoFile, imagePreviewUrl]);

  const handleCloseScanResultsPopup = async () => {
    setShowScanResultsPopup(false);
    const isErrorResult = scanResults.toLowerCase().startsWith('error:');
    
    setScanResults('');
    
    if (isErrorResult) {
        setFeedbackMessage('Analisis gagal. Silakan coba lagi atau unggah gambar lain.');
        setFeedbackType('warning');
    } else {
        setFeedbackMessage('Hasil analisis ditutup.');
        setFeedbackType('info');
    }
  };

  const handleActualScanOrOpenCamera = async () => {
    if (uploadedImage) await performGeminiScanViaBackend(uploadedImage);
    else openCamera();
  };

  const handleMainScanClick = async () => {
    if (isScanningActive || isCameraOpen) return;
    await handleActualScanOrOpenCamera();
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (isCameraOpen) closeCamera();
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFeedbackMessage('Format file tidak didukung. Harap unggah file gambar.'); setFeedbackType('error');
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setUploadedImage(file);
      if (imagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFeedbackMessage('Gambar diunggah. Siap untuk dipindai.'); setFeedbackType('info');
    }
  };

  const handleRemoveImage = () => {
    if (isCameraOpen) closeCamera();
    if (imagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
    setUploadedImage(null); setImagePreviewUrl(null);
    setFeedbackMessage('Gambar dibuang.'); setFeedbackType('info');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFeedbackStyles = () => {
    switch (feedbackType) {
      case 'success': return { borderColorClass: 'border-green-500', bgColorClass: 'bg-green-500/10', textColorClass: 'text-green-400', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> };
      case 'error': return { borderColorClass: 'border-red-500', bgColorClass: 'bg-red-500/10', textColorClass: 'text-red-400', icon: <AlertCircle className="h-5 w-5 text-red-500" /> };
      case 'warning': return { borderColorClass: 'border-yellow-500', bgColorClass: 'bg-yellow-500/10', textColorClass: 'text-yellow-400', icon: <ShieldAlert className="h-5 w-5 text-yellow-500" /> };
      default: return { borderColorClass: 'border-blue-500', bgColorClass: 'bg-blue-500/10', textColorClass: 'text-blue-400', icon: <AlertCircle className="h-5 w-5 text-blue-500" /> };
    }
  };
  const feedbackStyles = getFeedbackStyles();

  const mainButtonText = () => {
    if (isCameraOpen) return 'Kamera Aktif...';
    if (uploadedImage) return 'Pindai Gambar';
    return 'Buka Kamera';
  };
  
  const mainButtonDisabled = isScanningActive;
  
  const parseScanResults = (results: string): Array<{ title: string; content: string; isSubItem?: boolean }> => {
    if (!results || typeof results !== 'string') return [{ title: "Error", content: "Hasil analisis tidak valid atau kosong." }];
    
    if (results.toLowerCase().startsWith('error:')) {
        return [{ title: "Kesalahan Analisis", content: results.substring(6).trim() }];
    }

    const lines = results.split('\n');
    const parsed: Array<{ title: string; content: string; isSubItem?: boolean }> = [];
    let currentTitle = "Informasi Umum";
    let currentContent = "";
    const mainTitles = ["Market Structure", "Candlestick Pattern", "Trend Market", "Signal Type", "Bandarmology", "Rekomendasi Trading", "Sentimen Pasar", "Sentimen Media sosial"];

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        let isNewTitle = false;
        for (const mTitle of mainTitles) {
            if (trimmedLine.toLowerCase().startsWith(mTitle.toLowerCase() + ":")) {
                if (currentContent.trim() || (currentTitle !== "Informasi Umum" && !(parsed.length > 0 && parsed[parsed.length -1].title === currentTitle && !parsed[parsed.length-1].content.trim()))) {
                    if (currentTitle.toLowerCase() === "rekomendasi trading" && !currentContent.trim() && parsed.length > 0 && parsed[parsed.length - 1].title.toLowerCase() !== "rekomendasi trading") {
                    } else {
                        parsed.push({ title: currentTitle, content: currentContent.trim() });
                    }
                }
                const splitPoint = trimmedLine.indexOf(':');
                currentTitle = trimmedLine.substring(0, splitPoint).trim();
                currentContent = trimmedLine.substring(splitPoint + 1).trim();
                isNewTitle = true;
                break;
            }
        }
        if (!isNewTitle) {
            currentContent += (currentContent ? "\n" : "") + trimmedLine;
        }
    }
    if (currentTitle && (currentContent.trim() || (currentTitle !== "Informasi Umum" && !(parsed.length > 0 && parsed[parsed.length -1].title === currentTitle && !parsed[parsed.length-1].content.trim())))) {
        parsed.push({ title: currentTitle, content: currentContent.trim() });
    } else if (parsed.length === 0 && results.trim()) {
        return [{ title: "Analisis Detail", content: results.trim() }];
    }
    
    if (parsed.length === 0 && !results.trim()) return [{ title: "Info", content: "Tidak ada hasil untuk ditampilkan." }];
    
    if (parsed.length > 1 && parsed[0].title === "Informasi Umum" && !parsed[0].content.trim()) {
        return parsed.slice(1);
    }
    
    return parsed.length > 0 ? parsed : [{ title: "Analisis", content: "Tidak ada detail yang dapat ditampilkan." }];
  };

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 font-sans relative bg-background text-foreground">
        {showScanResultsPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
              <div className="p-6 text-center border-b border-border">
                {scanResults.toLowerCase().startsWith('error:') ?
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" /> :
                    <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                }
                <h2 className="text-2xl font-semibold text-foreground">
                    {scanResults.toLowerCase().startsWith('error:') ? "Gagal Menganalisis" : "Hasil Analisis AI Trading"}
                </h2>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5 custom-scrollbar-dark">
                {parseScanResults(scanResults).map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${result.isSubItem ? 'ml-4 bg-neutral-800/30 border-neutral-700' : 'bg-background/50 shadow-sm border-border'}`}>
                    <h3 className={`font-semibold text-lg mb-2 ${result.isSubItem ? 'text-primary/90' : (result.title === "Kesalahan Analisis" ? 'text-destructive' : 'text-primary')}`}>{result.title}</h3>
                    <div className="whitespace-pre-wrap break-words text-sm text-muted-foreground leading-relaxed">
                      {result.content.split('\n').map((line, lineIndex) => {
                        const boldMatch = line.match(/\*\*(.*?)\*\*/);
                        if (boldMatch?.[1]) {
                          const parts = line.split(/\*\*(.*?)\*\*/);
                          return (<React.Fragment key={lineIndex}>{parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part)}<br/></React.Fragment>);
                        }
                        if (line.startsWith('- ')) return (<span key={lineIndex} className="flex items-start pl-1"><span className="mr-2 mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0"></span><span className="flex-grow">{line.substring(2)}</span><br/></span>);
                        return <React.Fragment key={lineIndex}>{line}<br/></React.Fragment>;
                      })}
                    </div>
                  </div>
                ))}
                {parseScanResults(scanResults).length === 0 && (<p className="text-muted-foreground text-center py-4">Tidak ada hasil untuk ditampilkan.</p>)}
              </div>
              <div className="p-6 border-t border-border">
                <button onClick={handleCloseScanResultsPopup} className="w-full btn-primary">Tutup</button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Error Modal */}
        {showCameraErrorModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[102] p-4 backdrop-blur-md">
                <div className="bg-card border border-red-500 rounded-xl shadow-2xl w-full max-w-sm p-6">
                    <div className="text-center">
                        <VideoOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">Kesalahan Kamera</h2>
                        <p className="text-sm text-muted-foreground mb-6 whitespace-pre-line">{cameraError || "Terjadi kesalahan saat mengakses kamera."}</p>
                        <button onClick={() => setShowCameraErrorModal(false)} className="w-full btn-danger text-sm">Mengerti</button>
                    </div>
                </div>
            </div>
        )}

        {/* Main UI Card */}
        <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-neutral-800/50 p-5 sm:p-6 text-center border-b border-border">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pemindai Analisis Trading</h1>
            <p className="text-xs sm:text-sm mt-1 text-muted-foreground">Unggah gambar chart trading untuk analisis AI.</p>
          </div>
          <div className="p-5 sm:p-6 bg-card">
            <div className={`relative mx-auto w-full aspect-[4/3] max-w-[320px] rounded-xl border-2 flex items-center justify-center bg-background overflow-hidden transition-all duration-300
              ${(isScanningActive && !isCameraOpen) ? 'border-primary shadow-lg shadow-primary/20' : 'border-border'}
              ${isCameraOpen ? 'border-primary' : 'border-dashed'}
              ${imagePreviewUrl ? 'border-solid border-primary' : (isCameraOpen ? 'border-solid border-primary' : 'border-dashed border-border')}`}
            >
              {isCameraOpen ? (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                      <button onClick={takePhoto} disabled={!videoRef.current?.srcObject || isScanningActive} className="btn-primary btn-sm bg-opacity-80 backdrop-blur-sm hover:bg-opacity-100">
                        <Camera className="w-5 h-5 mr-2" />Ambil Foto
                      </button>
                      <button onClick={closeCamera} disabled={isScanningActive} className="btn-icon bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm" aria-label="Tutup Kamera">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </>
              ) : imagePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreviewUrl}
                  alt={"Pratinjau Gambar"}
                  className="absolute inset-0 w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-center p-4 select-none">
                  <Camera className={`h-16 w-16 mb-3 transition-colors ${isScanningActive ? 'text-primary opacity-40' : 'text-muted-foreground opacity-70'}`} />
                  <p className="text-sm text-muted-foreground">Klik &ldquo;{mainButtonText()}&rdquo; di bawah, atau unggah gambar.</p>
                </div>
              )}
              {!isCameraOpen && !imagePreviewUrl && !isScanningActive && (
                  <> <div className={`corner top-left ${'border-border/70'}`}></div> <div className={`corner top-right ${'border-border/70'}`}></div> <div className={`corner bottom-left ${'border-border/70'}`}></div> <div className={`corner bottom-right ${'border-border/70'}`}></div> </>
              )}
              {imagePreviewUrl && !isScanningActive && !isCameraOpen && (
                <button onClick={handleRemoveImage} disabled={false} className="absolute top-2 right-2 btn-icon bg-black/60 hover:bg-black/80 text-white z-20" aria-label="Buang gambar"><XCircle className="w-5 h-5" /></button>
              )}
              {isScanningActive && (<div className="absolute inset-0 bg-black/30 flex-center z-10 backdrop-blur-sm rounded-xl"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>)}
              <canvas ref={canvasRef} className="hidden" aria-hidden="true"></canvas>
            </div>
          </div>
          <div className="px-5 sm:px-6 pb-3 sm:pb-4 space-y-3 bg-card">
            <button onClick={handleMainScanClick} disabled={mainButtonDisabled || isCameraOpen} className={`w-full btn-primary text-base sm:text-lg ${(mainButtonDisabled || isCameraOpen) ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {(isScanningActive && !isCameraOpen) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} {mainButtonText()}
            </button>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} id="imageUploadInputScannerPage" aria-label="Unggah gambar"/>
            <button onClick={() => { if (isCameraOpen) closeCamera(); fileInputRef.current?.click(); }} disabled={mainButtonDisabled || isCameraOpen} className={`w-full btn-neutral text-sm sm:text-base ${(mainButtonDisabled || isCameraOpen) ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />{imagePreviewUrl ? 'Ganti Gambar' : (isCameraOpen ? 'Tutup & Unggah Gambar' : 'Unggah Gambar')}
            </button>
          </div>
          {feedbackMessage && (
            <div className={`mx-5 sm:mx-6 mb-5 sm:mb-6 p-3.5 sm:p-4 border-l-4 rounded-md shadow-md flex items-start space-x-3 ${feedbackStyles.bgColorClass} ${feedbackStyles.borderColorClass}`} role="alert">
              <div className="flex-shrink-0 pt-0.5">{feedbackStyles.icon}</div>
              <p className={`text-sm ${feedbackStyles.textColorClass}`}>{feedbackMessage}</p>
            </div>
          )}
        </div>
        
        <footer className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Pemindai Analisis Trading.
          </p>
        </footer>


        <style jsx global>{`
          :root {
            --card: hsl(222.2, 84%, 4.9%);
            --muted-foreground: hsl(215, 20.2%, 65.1%);
            --primary: hsl(210, 40%, 98%);
            --primary-foreground: hsl(222.2, 47.4%, 11.2%);
            --background: hsl(222.2, 84%, 4.9%);
            --border: hsl(217.2, 32.6%, 17.5%);
            --foreground: hsl(210, 40%, 98%);
            --destructive: hsl(0, 84.2%, 60.2%);
            --destructive-foreground: hsl(0, 0%, 98%);
          }
          body {
            background-color: var(--background);
            color: var(--foreground);
          }
          .custom-scrollbar-dark::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar-dark::-webkit-scrollbar-track { background: hsl(var(--card)/0.5); border-radius: 10px; }
          .custom-scrollbar-dark::-webkit-scrollbar-thumb { background-color: hsl(var(--muted-foreground)); border-radius: 10px; border: 2px solid hsl(var(--card)/0.5); }
          .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background-color: hsl(var(--primary)/0.8); }

          .btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; transition: all 0.2s ease-in-out; display: inline-flex; align-items: center; justify-content: center; line-height: 1.25; border: 1px solid transparent; }
          .btn:disabled { opacity: 0.6; cursor: not-allowed; }

          .btn-primary { background-color: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }
          .btn-primary:hover:not(:disabled) { background-color: hsl(var(--primary)/0.9); opacity:0.9}
          .btn-primary.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.875rem; }

          .btn-neutral { background-color: hsl(var(--muted-foreground) / 0.2); color: var(--foreground); border-color: hsl(var(--muted-foreground) / 0.3); }
          .btn-neutral:hover:not(:disabled) { background-color: hsl(var(--muted-foreground) / 0.3); }

          .btn-outline { border: 1px solid var(--border); color: var(--foreground); background-color: transparent; }
          .btn-outline:hover:not(:disabled) { background-color: hsl(var(--muted-foreground) / 0.1); border-color: hsl(var(--muted-foreground) / 0.2); }

          .btn-danger { background-color: var(--destructive); color: var(--destructive-foreground); border-color: var(--destructive); }
          .btn-danger:hover:not(:disabled) { background-color: hsl(var(--destructive)/0.9); }

          .btn-secondary { background-color: #0088cc; color: white; border-color: #0088cc; }
          .btn-secondary:hover:not(:disabled) { background-color: #0077b3; }

          .btn-icon { padding: 0.5rem; border-radius: 9999px; background-color: transparent; border: none; }
          .btn-icon:hover:not(:disabled) { background-color: hsl(var(--muted-foreground) / 0.2); }
          .btn-icon.backdrop-blur-sm { backdrop-filter: blur(4px); }

          .btn-toggle { flex: 1; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; transition: all 0.3s ease-out; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; background-color: transparent; }
          .btn-toggle.active { background-color: var(--primary); color: var(--primary-foreground); box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06); border-color: var(--primary); }
          .btn-toggle:not(.active) { color: var(--muted-foreground); border-color: var(--border); }
          .btn-toggle:not(.active):hover:not(:disabled) { background-color: hsl(var(--muted-foreground) / 0.1); border-color: hsl(var(--muted-foreground) / 0.2); }

          .corner { position: absolute; width: 1.5rem; height: 1.5rem; border-width: 3px; transition: border-color 0.3s; }
          .corner.top-left { top: 0.5rem; left: 0.5rem; border-top-style: solid; border-left-style: solid; border-top-left-radius: 0.375rem; }
          .corner.top-right { top: 0.5rem; right: 0.5rem; border-top-style: solid; border-right-style: solid; border-top-right-radius: 0.375rem; }
          .corner.bottom-left { bottom: 0.5rem; left: 0.5rem; border-bottom-style: solid; border-left-style: solid; border-bottom-left-radius: 0.375rem; }
          .corner.bottom-right { bottom: 0.5rem; right: 0.5rem; border-bottom-style: solid; border-right-style: solid; border-bottom-right-radius: 0.375rem; }

          .flex-center { display: flex; align-items: center; justify-content: center; }
        `}</style>
      </main>
    </>
  );
}
