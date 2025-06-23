'use client';

import React, { useState, FormEvent, useRef, useEffect, useCallback, ChangeEvent, SVGProps } from 'react';
import { Camera, AlertCircle, CheckCircle2, UploadCloud, XCircle, Loader2, ShieldAlert, VideoOff, ScanIcon } from 'lucide-react';

// Define the color palette (REMOVED - Using Tailwind theme)
// const colors = { ... };

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isLoading?: boolean;
}

// Send Icon Component (no changes needed if using currentColor by default)
const SendIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

// Loading Spinner Icon Component (animate-spin is Tailwind)
const LoadingSpinnerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Settings Icon Component (no changes needed if using currentColor by default)
const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.257c-.008.379.137.75.43.99l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.333.184-.582.496-.646.87l-.212 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.646-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.257c.008-.379-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.354.133.75.072 1.075-.124.072-.044.146-.087.22-.128.332-.184.582-.496.646-.87l.212-1.281Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

// Close Icon Component (no changes needed if using currentColor by default)
const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [isScanPopupOpen, setIsScanPopupOpen] = useState(false); // New state for scan popup

  // Scanner Page states
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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash-latest');
  const availableModels = ['gemini-2.0-flash', 'gemini-pro', 'gemini-ultra']; // Keep models if still relevant
  
  const recommendedPrompts = [
    "Buatkan saya cerita pendek tentang petualangan di luar angkasa.",
    "Jelaskan konsep relativitas umum dengan bahasa yang sederhana.",
    "Berikan ide resep masakan untuk makan malam keluarga.",
    "Tuliskan puisi tentang keindahan alam Indonesia.",
    "Apa saja tips untuk belajar bahasa baru secara efektif?"
  ];
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load API keys from localStorage on component mount
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scanner Page useEffects
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

  useEffect(() => {
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;

    const startCameraStream = async () => {
      if (!videoElement || !isCameraOpen) return; // Only proceed if video element is rendered and camera is intended to be open

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
      // Ensure scanning active is reset if camera is closed via cleanup
      if (isScanningActive) {
        setIsScanningActive(false);
      }
    };
  }, [isCameraOpen, videoRef, setIsScanningActive, isScanningActive]);

  // Supabase session and API key management removed.
  // If user-specific API keys are needed, implement a new storage/retrieval mechanism.
  // For now, the backend will use a global API key.

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    const loadingBotMessageId = (Date.now() + 1).toString();
    const loadingBotMessage: Message = {
      id: loadingBotMessageId,
      sender: 'bot',
      text: '...', // Placeholder for loading
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingBotMessage]);

    // Ensure this URL matches your API route structure in Next.js
    // For App Router, this would map to app/api/llm/gemini/generate_conten_chat/route.ts
    const apiUrl = '/api/llm/gemini/generate_conten_chat'; // CORRECTED
    console.log(`Sending prompt to ${apiUrl} with model: ${selectedModel}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization' header is temporarily removed as the backend check is bypassed.
          // Re-implement proper authentication (e.g., TON-based) in production.
        },
        body: JSON.stringify({ 
          prompt: currentInput,
          // model: selectedModel // Uncomment if your backend uses this
        }),
      });

      if (!response.ok) {
        // Attempt to parse error response from backend if available
        let errorDataMessage = `Error from bot server (${response.status} ${response.statusText})`;
        try {
          const errorData = await response.json();
          errorDataMessage = errorData.error || JSON.stringify(errorData) || errorDataMessage;
        } catch {
          try {
            const errorText = await response.text();
            errorDataMessage = errorText ? `${errorDataMessage}: ${errorText}` : errorDataMessage;
          } catch {
             errorDataMessage = `Error from bot server (${response.status} ${response.statusText}) - Gagal membaca detail error.`;
          }
        }
        throw new Error(errorDataMessage);
      }

      const data = await response.json();
      const botMessageText = data.text || 'Maaf, saya tidak dapat memproses itu saat ini.';
      
      const botMessage: Message = {
        id: Date.now().toString(), // Use a new ID for the actual bot message
        sender: 'bot',
        text: botMessageText,
        isLoading: false,
      };
      // Replace the loading message with the actual bot message
      setMessages((prev) => prev.map(msg => msg.id === loadingBotMessageId ? botMessage : msg));

    } catch (error) {
      console.error('Chat submission error:', error);
      const errorMessageText = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
      const errorBotMessage: Message = {
        id: loadingBotMessageId, // Reuse ID to replace the loading message
        sender: 'bot',
        text: `Error: ${errorMessageText}`,
        isLoading: false,
      };
      setMessages((prev) => prev.map(msg => msg.id === loadingBotMessageId ? errorBotMessage : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSettingsPopup = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleScanPopup = () => {
    setIsScanPopupOpen(!isScanPopupOpen);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  const handleRecommendedPromptClick = (prompt: string) => {
    setInput(prompt);
    setIsSettingsOpen(false); // Optionally close the settings popup after selecting a prompt
  };


  // Scanner Page Callbacks
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
      
      const response = await fetch('/api/llm/gemini/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization header removed as Supabase authentication is no longer used.
          // If TON-based authentication is implemented, a new token should be passed here.
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
  }, [convertFileToBase64]); // Removed dailyScanCount, supabaseUser, supabase

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
    setIsCameraOpen(true); // Set to true first to render the video element
    setIsScanningActive(true); // Indicate that camera is being activated
  }, [isScanningActive, isCameraOpen, imagePreviewUrl]);

  const dataURLtoFile = useCallback((dataurl: string, filename: string): File | null => {
    try {
      const arr = dataurl.split(','); if (arr.length < 2 || !arr[0] || !arr[1]) return null;
      const mimeMatch = arr[0].match(/:(.*?);/); if (!mimeMatch || mimeMatch.length < 2 || !mimeMatch[1]) return null;
      const mime = mimeMatch[1]; const bstr = atob(arr[1]); let n = bstr.length;
      const u8arr = new Uint8Array(n); while (n--) { u8arr[n] = bstr.charCodeAt(n); }
      return new File([u8arr], filename, { type: mime });
    } catch (e: unknown) { // Keep as unknown
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
    else await openCamera();
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
                        // Skip empty "Rekomendasi Trading" title if it's just a container
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
    <div className="flex flex-col h-screen max-w-2xl mx-auto font-sans relative bg-background text-foreground">
      {/* Header */}
      <header
        className="p-4 text-lg font-semibold text-center sticky top-0 z-20 shadow-lg flex items-center justify-between bg-neutral-900 text-primary border-b border-border"
      >
        <span className="flex-grow text-center">Hands chat</span> {/* Centered Title */}
        <button
          onClick={toggleSettingsPopup}
          className="p-2 rounded-full hover:bg-neutral-700/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors duration-150 text-primary"
          aria-label="Settings"
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Settings Popup */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div
            className="bg-card text-foreground rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ease-out scale-100 border border-border"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-primary">Pengaturan</h2>
              <button
                onClick={toggleSettingsPopup}
                className="p-2 rounded-full text-muted-foreground hover:bg-neutral-700/60 hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Close settings"
              >
                <CloseIcon className="w-6 h-6"/>
              </button>
            </div>

            {/* Model Selection */}
            <div className="mb-6">
              <label htmlFor="gemini-model" className="block text-sm font-medium mb-2 text-foreground">
                Pilih Model Gemini:
              </label>
              <select
                id="gemini-model"
                value={selectedModel}
                onChange={handleModelChange}
                className={`w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 ease-in-out bg-background text-foreground`}
              >
                {availableModels.map(model => (
                  <option key={model} value={model} className="bg-background text-foreground">
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key inputs removed as Supabase user metadata is no longer used for storage. */}
            {/* If API keys are still needed, they should be managed via a new system. */}

            {/* Recommended Prompts */}
            <div className="mb-2">
              <h3 className="text-lg font-medium mb-3 text-foreground">Rekomendasi Prompt:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {recommendedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecommendedPromptClick(prompt)}
                    className="w-full text-left p-3 border border-border rounded-lg hover:shadow-md transition-shadow duration-150 text-sm bg-neutral-800/70 hover:bg-neutral-700/90 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg 
              ${ msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-foreground rounded-bl-none'} 
              ${msg.isLoading ? 'animate-pulse opacity-80' : ''}`}
            >
              {/* Render newlines correctly */}
              {msg.text.split('\n').map((line, index, arr) => (
                <span key={index} className="block break-words whitespace-pre-wrap">
                  {line}
                  {/* Add <br/> only if it's not the last line, to prevent extra space.
                      However, CSS white-space: pre-wrap on the parent might be a cleaner way
                      if you want to preserve all whitespace and newlines from the string directly.
                  */}
                  {index < arr.length - 1 && <br/>}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-border sticky bottom-0 z-20 bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan Anda..."
            className={`flex-grow p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 ease-in-out text-foreground placeholder:text-muted-foreground bg-card disabled:opacity-70`}
            disabled={isLoading}
          />
          <button
            type="button" // Changed to type="button" to prevent form submission
            onClick={toggleScanPopup} // Added onClick handler
            className={`p-3 rounded-lg transition-all duration-200 ease-in-out shadow-md hover:shadow-lg active:shadow-sm bg-primary text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed`}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinnerIcon className="w-6 h-6" />
            ) : (
              <ScanIcon className="w-6 h-6" />
            )}
          </button>
          <button
            type="submit"
            className={`p-3 rounded-lg transition-all duration-200 ease-in-out shadow-md hover:shadow-lg active:shadow-sm bg-primary text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed`}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinnerIcon className="w-6 h-6" />
            ) : (
              <SendIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </form>

      {/* Scan Popup */}
      {isScanPopupOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div
            className="bg-card text-foreground rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ease-out scale-100 border border-border"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-primary">Scan Options</h2>
              <button
                onClick={toggleScanPopup}
                className="p-2 rounded-full text-muted-foreground hover:bg-neutral-700/60 hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Close scan options"
              >
                <CloseIcon className="w-6 h-6"/>
              </button>
            </div>
            {/* Start of Scanner Page content */}
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
                              <p className="text-sm text-muted-foreground mb-6 whitespace-pre-line">{cameraError ?? "Terjadi kesalahan saat mengakses kamera."}</p>
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
                        <p className="text-sm text-muted-foreground">Klik &#34;{mainButtonText()}&#34; di bawah, atau unggah gambar.</p>
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
              
              {/* Footer message related to Supabase and scan limits removed. */}
              {/* If a new status message is needed, it should be added here. */}
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
            {/* End of Scanner Page content */}
          </div>
        </div>
      )}
      {/* Custom scrollbar styles - ensuring they use theme variables if possible */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-border, #333333); /* Fallback to direct value */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-muted-foreground, #A0A0A0); /* Fallback to direct value */
        }
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--color-border, #333333) transparent;
        }
      `}</style>
    </div>
  );
}
