'use client';

import React, { useState, useRef, useEffect, useCallback, FormEvent, ChangeEvent, SVGProps } from 'react';
import Image from 'next/image';
import { Camera, AlertCircle, CheckCircle2, UploadCloud, XCircle, Loader2, ShieldAlert, VideoOff, ScanIcon, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning } from 'lucide-react';

// Interface untuk pesan chat
interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isLoading?: boolean;
}

// Interface untuk data saham
interface StockData {
  symbol: string;
  price: number;
  timestamp: number;
}

// Komponen Ikon SVG
const SendIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

const LoadingSpinnerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.257c-.008.379.137.75.43.99l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.333.184-.582.496-.646.87l-.212 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.646-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.257c.008-.379-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.354.133.75.072 1.075-.124.072-.044.146-.087.22-.128.332-.184.582-.496.646-.87l.212-1.281Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BatteryIcon = ({ usageCount }: { usageCount: number }) => {
  const percentage = (usageCount / 5) * 100;
  if (percentage > 75) return <BatteryFull className="w-6 h-6 text-green-500" />;
  if (percentage > 50) return <BatteryMedium className="w-6 h-6 text-yellow-500" />;
  if (percentage > 25) return <BatteryLow className="w-6 h-6 text-orange-500" />;
  return <BatteryWarning className="w-6 h-6 text-red-500" />;
};

// Komponen utama halaman chat
export default function ChatPage() {
  // State untuk manajemen chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  // State untuk manajemen popup
  const [isScanPopupOpen, setIsScanPopupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // State untuk manajemen penggunaan dan data
  const [usageCount, setUsageCount] = useState(5);
  const [stockData, setStockData] = useState<StockData | null>(null);
  
  // State dan Ref untuk WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState('Connecting...');

  // State untuk halaman pemindai
  const [feedbackMessage, setFeedbackMessage] = useState('Siap untuk memindai.');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showScanResultsPopup, setShowScanResultsPopup] = useState(false);
  const [scanResults, setScanResults] = useState('');
  
  // State dan Ref untuk kamera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCameraErrorModal, setShowCameraErrorModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State untuk pengaturan
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash-latest');
  const availableModels = ['gemini-1.5-flash-latest', 'gemini-pro', 'gemini-ultra'];

  const recommendedPrompts = [
    "Buatkan saya cerita pendek tentang petualangan di luar angkasa.",
    "Jelaskan konsep relativitas umum dengan bahasa yang sederhana.",
    "Berikan ide resep masakan untuk makan malam keluarga.",
    "Tuliskan puisi tentang keindahan alam Indonesia.",
    "Apa saja tips untuk belajar bahasa baru secara efektif?"
  ];

  // Fungsi untuk scroll ke bawah
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Efek untuk koneksi WebSocket
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket is already connected.');
        return;
      }

      const ws = new WebSocket(`ws://${window.location.hostname}:3001`);
      wsRef.current = ws;
      setWsStatus('Connecting...');

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsStatus('Connected');
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat') {
            const newChatMessage: ChatMessage = {
              id: Date.now().toString(),
              sender: 'bot',
              text: data.message,
            };
            setChatMessages(prev => [...prev, newChatMessage]);
          } else if (data.type === 'stock_update') {
            setStockData(data);
          }
        } catch (wsError) {
          console.error("Failed to parse WebSocket message:", event.data);
          console.error("WebSocket parsing error:", wsError);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect...');
        setWsStatus('Disconnected. Reconnecting...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = wsError => {
        console.error('WebSocket error:', wsError);
        // onclose akan dipanggil setelahnya dan akan menangani proses koneksi ulang.
      };
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Mencegah koneksi ulang saat komponen di-unmount
        wsRef.current.close();
      }
    };
  }, []);

  // Efek untuk membersihkan URL blob gambar
  useEffect(() => {
    let previousBlobUrl: string | null = null;
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      previousBlobUrl = imagePreviewUrl;
    }
    
    return () => {
      if (previousBlobUrl) {
        URL.revokeObjectURL(previousBlobUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Efek untuk manajemen stream kamera
  useEffect(() => {
    const videoElement = videoRef.current;

    const startCameraStream = async () => {
      if (!videoElement) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = 'Fitur kamera tidak didukung di browser atau perangkat ini.';
        setFeedbackMessage(msg); setFeedbackType('error'); setCameraError(msg);
        setShowCameraErrorModal(true); setIsCameraOpen(false);
        return;
      }

      setIsScanningActive(true);
      setFeedbackMessage('Mengaktifkan kamera...');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoElement.srcObject = stream;
        await videoElement.play();
        setFeedbackMessage('Kamera aktif. Arahkan & ambil foto.');
        setFeedbackType('info');
      } catch (err: unknown) {
        let message = 'Gagal akses kamera.';
        const errorName = err instanceof Error ? err.name : undefined;
        if (errorName === "NotAllowedError") message = 'Akses kamera ditolak. Mohon izinkan di pengaturan browser Anda.';
        else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") message = 'Kamera tidak ditemukan. Pastikan kamera terhubung.';
        else if (errorName === "NotReadableError" || errorName === "TrackStartError") message = 'Kamera sedang digunakan. Coba tutup aplikasi lain.';
        else message = `Gagal kamera: ${errorName || (err instanceof Error ? err.message : String(err))}`;
        
        setCameraError(message); setFeedbackMessage(message); setFeedbackType('error');
        setShowCameraErrorModal(true); setIsCameraOpen(false);
        console.error('Camera error:', err);
      } finally {
        setIsScanningActive(false);
      }
    };

    const stopCameraStream = () => {
      if (videoElement?.srcObject) {
        const mediaStream = videoElement.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
    };

    if (isCameraOpen) {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isCameraOpen]);

  // Handler untuk mengirim pesan chat
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || usageCount <= 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    // Kirim pesan via WebSocket dalam format JSON
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat', message: userMessage.text }));
    }

    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    const loadingBotMessageId = (Date.now() + 1).toString();
    const loadingBotMessage: ChatMessage = {
      id: loadingBotMessageId,
      sender: 'bot',
      text: '...',
      isLoading: true,
    };
    setChatMessages((prev) => [...prev, loadingBotMessage]);

    const apiUrl = '/api/llm/openrouter/generate_conten_chat';
    console.log(`Sending prompt to ${apiUrl} with model: ${selectedModel}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput, model: selectedModel }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'bot',
        text: data.text || 'Maaf, saya tidak dapat memproses itu saat ini.',
        isLoading: false,
      };
      setChatMessages((prev) => prev.map(msg => msg.id === loadingBotMessageId ? botMessage : msg));
      setUsageCount(prev => prev - 1);

    } catch (submitError) {
      console.error('Chat submission error:', submitError);
      const errorMessageText = submitError instanceof Error ? submitError.message : 'Terjadi kesalahan.';
      const errorBotMessage: ChatMessage = {
        id: loadingBotMessageId,
        sender: 'bot',
        text: `Error: ${errorMessageText}`,
        isLoading: false,
      };
      setChatMessages((prev) => prev.map(msg => msg.id === loadingBotMessageId ? errorBotMessage : msg));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler untuk popup
  const toggleSettingsPopup = () => setIsSettingsOpen(!isSettingsOpen);
  const toggleScanPopup = () => setIsScanPopupOpen(!isScanPopupOpen);
  const handleModelChange = (event: ChangeEvent<HTMLSelectElement>) => setSelectedModel(event.target.value);
  const handleRecommendedPromptClick = (prompt: string) => {
    setInput(prompt);
    setIsSettingsOpen(false);
  };

  // Fungsi utilitas untuk konversi file ke base64
  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const resultString = reader.result?.toString();
        if (resultString) {
          const base64ImageData = resultString.split(',')[1];
          if (base64ImageData) resolve(base64ImageData);
          else reject(new Error('Gagal memisahkan data base64.'));
        } else {
          reject(new Error('Gagal konversi file (hasil kosong).'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal baca file.'));
    });
  }, []);

  // Fungsi untuk melakukan scan gambar
  const performGeminiScanViaBackend = useCallback(async (imageFile: File | null) => {
    if (!imageFile || usageCount <= 0) {
      setFeedbackMessage('Tidak ada gambar atau batas penggunaan habis.');
      setFeedbackType('error');
      return;
    }
    setIsScanningActive(true);
    setFeedbackMessage('Memproses gambar untuk analisis AI...');
    setFeedbackType('info');

    try {
      const base64ImageData = await convertFileToBase64(imageFile);
      const mimeType = imageFile.type;
      
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
      const response = await fetch('/api/llm/openrouter/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: tradingPrompt, imageData: base64ImageData, mimeType }),
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ error: `Permintaan gagal (${response.status})` }));
        throw new Error(errorResult.error);
      }

      const result = await response.json();
      if (result.text) {
        setScanResults(result.text);
        setShowScanResultsPopup(true);
        setFeedbackMessage('Analisis AI berhasil!');
        setFeedbackType('success');
        setUsageCount(prev => prev - 1);
      } else {
        throw new Error(result.error || 'Format respons dari AI tidak valid.');
      }
    } catch (scanError: unknown) {
      const message = scanError instanceof Error ? scanError.message : String(scanError);
      console.error('Error during Gemini scan:', scanError);
      setFeedbackMessage(`Analisis AI gagal: ${message}`);
      setFeedbackType('error');
      setScanResults(`Error: ${message}`);
      setShowScanResultsPopup(true);
    } finally {
      setIsScanningActive(false);
    }
  }, [convertFileToBase64, usageCount]);

  // Handler untuk kamera
  const openCamera = useCallback(() => {
    if (isScanningActive || isCameraOpen) return;
    setFeedbackMessage('Mengakses kamera...');
    setFeedbackType('info');
    setCameraError(null);
    setShowCameraErrorModal(false);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setUploadedImage(null);
    setIsCameraOpen(true);
  }, [isScanningActive, isCameraOpen, imagePreviewUrl]);

  const closeCamera = useCallback(() => {
    setIsCameraOpen(false);
    setCameraError(null);
  }, []);

  const dataURLtoFile = useCallback((dataurl: string, filename: string): File | null => {
    try {
      const arr = dataurl.split(','); if (!arr[0] || !arr[1]) return null;
      const mimeMatch = arr[0].match(/:(.*?);/); if (!mimeMatch || !mimeMatch[1]) return null;
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) { u8arr[n] = bstr.charCodeAt(n); }
      return new File([u8arr], filename, { type: mime });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Error converting data URL to file:", errorMessage);
      setFeedbackMessage(`Gagal konversi foto: ${errorMessage}`); setFeedbackType('error');
      return null;
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!isCameraOpen || !videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
      setFeedbackMessage('Kamera tidak aktif atau belum siap.'); setFeedbackType('error'); return;
    }
    setFeedbackMessage('Mengambil foto...'); setFeedbackType('info');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreviewUrl(dataUrl);
      const photoFile = dataURLtoFile(dataUrl, `scan-${Date.now()}.jpg`);
      
      if (photoFile) {
        setUploadedImage(photoFile);
        performGeminiScanViaBackend(photoFile); // Langsung pindai setelah foto diambil
      } else {
        setFeedbackMessage('Gagal memproses foto.'); setFeedbackType('error');
      }
    } else {
      setFeedbackMessage('Gagal mengambil foto.'); setFeedbackType('error');
    }
    closeCamera();
  }, [isCameraOpen, closeCamera, dataURLtoFile, performGeminiScanViaBackend]);

  // Handler untuk popup hasil scan
  const handleCloseScanResultsPopup = () => {
    setShowScanResultsPopup(false);
    setScanResults('');
    setFeedbackMessage('Siap untuk memindai lagi.');
    setFeedbackType('info');
  };

  // Handler untuk tombol utama di popup scan
  const handleMainScanClick = () => {
    if (uploadedImage) {
      performGeminiScanViaBackend(uploadedImage);
    } else {
      openCamera();
    }
  };

  // Handler untuk upload gambar
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
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFeedbackMessage('Gambar diunggah. Siap untuk dipindai.'); setFeedbackType('info');
    }
  };

  const handleRemoveImage = () => {
    if (isCameraOpen) closeCamera();
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setUploadedImage(null); setImagePreviewUrl(null);
    setFeedbackMessage('Gambar dibuang.'); setFeedbackType('info');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Logika untuk styling feedback
  const getFeedbackStyles = () => {
    switch (feedbackType) {
      case 'success': return { borderColorClass: 'border-green-500', bgColorClass: 'bg-green-500/10', textColorClass: 'text-green-400', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> };
      case 'error': return { borderColorClass: 'border-red-500', bgColorClass: 'bg-red-500/10', textColorClass: 'text-red-400', icon: <AlertCircle className="h-5 w-5 text-red-500" /> };
      case 'warning': return { borderColorClass: 'border-yellow-500', bgColorClass: 'bg-yellow-500/10', textColorClass: 'text-yellow-400', icon: <ShieldAlert className="h-5 w-5 text-yellow-500" /> };
      default: return { borderColorClass: 'border-blue-500', bgColorClass: 'bg-blue-500/10', textColorClass: 'text-blue-400', icon: <AlertCircle className="h-5 w-5 text-blue-500" /> };
    }
  };
  const feedbackStyles = getFeedbackStyles();

  // Logika untuk teks tombol utama
  const mainButtonText = () => {
    if (isCameraOpen) return 'Kamera Aktif...';
    if (uploadedImage) return 'Pindai Gambar';
    return 'Buka Kamera';
  };
  const mainButtonDisabled = isScanningActive || usageCount <= 0;

  // Fungsi untuk mem-parsing hasil scan
  const parseScanResults = (results: string): Array<{ title: string; content: string; }> => {
    if (!results || typeof results !== 'string') return [{ title: "Error", content: "Hasil analisis tidak valid." }];
    if (results.toLowerCase().startsWith('error:')) return [{ title: "Kesalahan Analisis", content: results.substring(6).trim() }];

    const lines = results.split('\n').filter(line => line.trim() !== '');
    const parsed: Array<{ title: string; content: string; }> = [];
    let currentContent = '';
    let currentTitle = '';

    lines.forEach(line => {
        if (line.startsWith('- ')) {
            if (currentTitle) {
                parsed.push({ title: currentTitle, content: currentContent.trim() });
                currentContent = '';
            }
            const splitPoint = line.indexOf(':');
            if (splitPoint > -1) {
                currentTitle = line.substring(2, splitPoint).trim();
                currentContent += line.substring(splitPoint + 1).trim() + '\n';
            }
        } else if (line.startsWith('  - ')) { // Sub-item
            currentContent += line.trim() + '\n';
        } else if (currentTitle) {
            currentContent += line.trim() + '\n';
        }
    });

    if (currentTitle) {
        parsed.push({ title: currentTitle, content: currentContent.trim() });
    }

    return parsed.length > 0 ? parsed : [{ title: "Analisis", content: results }];
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto font-sans relative bg-background text-foreground">
      <header className="p-4 text-lg font-semibold sticky top-0 z-20 shadow-lg flex items-center justify-between bg-neutral-900 text-primary border-b border-border">
        <div className="flex items-center space-x-2">
          <BatteryIcon usageCount={usageCount} />
          <span>{usageCount} / 5</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="flex-grow text-center">Hands chat</span>
            <span className="text-xs text-neutral-400 font-normal">{wsStatus}</span>
        </div>
        <div className="flex items-center space-x-4">
            {stockData && (
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <span className="font-semibold">{stockData.symbol}:</span>
                <span className="font-bold text-foreground">${stockData.price.toFixed(2)}</span>
              </div>
            )}
            <button
              onClick={toggleSettingsPopup}
              className="p-2 rounded-full hover:bg-neutral-700/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors duration-150 text-primary"
              aria-label="Settings"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
        </div>
      </header>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-card text-foreground rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ease-out scale-100 border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-primary">Pengaturan</h2>
              <button onClick={toggleSettingsPopup} className="p-2 rounded-full text-muted-foreground hover:bg-neutral-700/60 hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Close settings">
                <CloseIcon className="w-6 h-6"/>
              </button>
            </div>
            <div className="mb-6">
              <label htmlFor="gemini-model" className="block text-sm font-medium mb-2 text-foreground">Pilih Model:</label>
              <select id="gemini-model" value={selectedModel} onChange={handleModelChange} className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 ease-in-out bg-background text-foreground">
                {availableModels.map(model => (
                  <option key={model} value={model} className="bg-background text-foreground">{model}</option>
                ))}
              </select>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3 text-foreground">Rekomendasi Prompt:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {recommendedPrompts.map((prompt, index) => (
                  <button key={index} onClick={() => handleRecommendedPromptClick(prompt)} className="w-full text-left p-3 border border-border rounded-lg hover:shadow-md transition-shadow duration-150 text-sm bg-neutral-800/70 hover:bg-neutral-700/90 text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {chatMessages.map((msg: ChatMessage) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-xl shadow-md ${ msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-foreground rounded-bl-none'} ${msg.isLoading ? 'animate-pulse opacity-80' : ''}`}>
              {msg.text.split('\n').map((line, index) => (
                <span key={index} className="block break-words whitespace-pre-wrap">{line}</span>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-border sticky bottom-0 z-20 bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center space-x-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={usageCount <= 0 ? "Batas penggunaan harian tercapai" : "Ketik pesan Anda..."} className="flex-grow p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 ease-in-out text-foreground placeholder:text-muted-foreground bg-card disabled:opacity-70" disabled={isLoading || usageCount <= 0} />
          <button type="button" onClick={toggleScanPopup} className="p-3 rounded-lg transition-all duration-200 ease-in-out shadow-md hover:shadow-lg active:shadow-sm bg-primary text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed" disabled={isLoading || usageCount <= 0}>
            <ScanIcon className="w-6 h-6" />
          </button>
          <button type="submit" className="p-3 rounded-lg transition-all duration-200 ease-in-out shadow-md hover:shadow-lg active:shadow-sm bg-primary text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed" disabled={isLoading || !input.trim() || usageCount <= 0}>
            {isLoading ? <LoadingSpinnerIcon className="w-6 h-6" /> : <SendIcon className="w-6 h-6" />}
          </button>
        </div>
      </form>

      {isScanPopupOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-card text-foreground rounded-xl shadow-2xl p-0 w-full max-w-md transform transition-all duration-300 ease-out scale-100 border border-border overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-2xl font-semibold text-primary">Pemindai Analisis</h2>
              <button onClick={toggleScanPopup} className="p-2 rounded-full text-muted-foreground hover:bg-neutral-700/60 hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Close scan options">
                <CloseIcon className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-6">
                <div className={`relative mx-auto w-full aspect-[4/3] rounded-xl border-2 flex items-center justify-center bg-background overflow-hidden transition-all duration-300 ${isCameraOpen ? 'border-primary' : 'border-dashed border-border'} ${imagePreviewUrl ? 'border-solid border-primary' : ''}`}>
                  {isCameraOpen ? (
                      <>
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                          <button onClick={takePhoto} disabled={!videoRef.current?.srcObject || isScanningActive} className="btn-primary btn-sm bg-opacity-80 backdrop-blur-sm hover:bg-opacity-100">
                            <Camera className="w-5 h-5 mr-2" />
                            {isScanningActive ? 'Memindai...' : 'Ambil & Pindai'}
                          </button>
                          <button onClick={closeCamera} disabled={isScanningActive} className="btn-icon bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm" aria-label="Tutup Kamera">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    ) : imagePreviewUrl ? (
                      <Image src={imagePreviewUrl} alt="Pratinjau Gambar" layout="fill" className="object-contain" />
                    ) : (
                      <div className="text-center p-4 select-none">
                        <Camera className="h-16 w-16 mb-3 text-muted-foreground opacity-70" />
                        <p className="text-sm text-muted-foreground">Klik tombol di bawah untuk memulai.</p>
                      </div>
                    )}
                  {imagePreviewUrl && !isCameraOpen && (
                    <button onClick={handleRemoveImage} className="absolute top-2 right-2 btn-icon bg-black/60 hover:bg-black/80 text-white z-20" aria-label="Buang gambar"><XCircle className="w-5 h-5" /></button>
                  )}
                  {isScanningActive && (<div className="absolute inset-0 bg-black/30 flex-center z-10 backdrop-blur-sm rounded-xl"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>)}
                  <canvas ref={canvasRef} className="hidden" aria-hidden="true"></canvas>
                </div>
            </div>
            <div className="px-6 pb-4 space-y-3">
              <button onClick={handleMainScanClick} disabled={mainButtonDisabled || isCameraOpen} className="w-full btn-primary text-base">
                {isScanningActive && !isCameraOpen ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {mainButtonText()}
              </button>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} id="imageUploadInputScannerPage" />
              <button onClick={() => fileInputRef.current?.click()} disabled={mainButtonDisabled || isCameraOpen} className="w-full btn-neutral text-sm">
                <UploadCloud className="w-5 h-5 mr-2" />
                {imagePreviewUrl ? 'Ganti Gambar' : 'Unggah dari Perangkat'}
              </button>
            </div>
            {feedbackMessage && (
              <div className={`m-6 mt-0 p-4 border-l-4 rounded-md shadow-md flex items-start space-x-3 ${feedbackStyles.bgColorClass} ${feedbackStyles.borderColorClass}`} role="alert">
                <div className="flex-shrink-0 pt-0.5">{feedbackStyles.icon}</div>
                <p className={`text-sm ${feedbackStyles.textColorClass}`}>{feedbackMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showScanResultsPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-6 text-center border-b border-border">
              {scanResults.toLowerCase().startsWith('error:') ? <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" /> : <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />}
              <h2 className="text-2xl font-semibold text-foreground">{scanResults.toLowerCase().startsWith('error:') ? "Gagal Menganalisis" : "Hasil Analisis AI"}</h2>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5 custom-scrollbar-dark">
              {parseScanResults(scanResults).map((result, index) => (
                <div key={index} className="p-4 rounded-lg border bg-background/50 shadow-sm border-border">
                  <h3 className={`font-semibold text-lg mb-2 ${result.title === "Kesalahan Analisis" ? 'text-destructive' : 'text-primary'}`}>{result.title}</h3>
                  <div className="whitespace-pre-wrap break-words text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: result.content.replace(/\n/g, '<br />') }}></div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-border">
              <button onClick={handleCloseScanResultsPopup} className="w-full btn-primary">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {showCameraErrorModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[102] p-4 backdrop-blur-md">
          <div className="bg-card border border-red-500 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <VideoOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Kesalahan Kamera</h2>
              <p className="text-sm text-muted-foreground mb-6 whitespace-pre-line">{cameraError ?? "Terjadi kesalahan."}</p>
              <button onClick={() => setShowCameraErrorModal(false)} className="w-full btn-danger text-sm">Mengerti</button>
            </div>
          </div>
        </div>
      )}
      
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
        }
        body { background-color: var(--background); color: var(--foreground); }
        .custom-scrollbar-dark::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: hsl(var(--card)/0.5); border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background-color: hsl(var(--muted-foreground)); border-radius: 10px; border: 2px solid hsl(var(--card)/0.5); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        .btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background-color: var(--primary); color: var(--primary-foreground); }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; }
        .btn-primary.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.875rem; }
        .btn-neutral { background-color: hsl(var(--muted-foreground) / 0.2); color: var(--foreground); border-color: hsl(var(--muted-foreground) / 0.3); }
        .btn-neutral:hover:not(:disabled) { background-color: hsl(var(--muted-foreground) / 0.3); }
        .btn-danger { background-color: var(--destructive); color: var(--primary-foreground); }
        .btn-danger:hover:not(:disabled) { opacity: 0.9; }
        .btn-icon { padding: 0.5rem; border-radius: 9999px; }
        .flex-center { display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}
