'use client';

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Camera, AlertCircle, CheckCircle2, Star, ShieldOff, UploadCloud, XCircle, Loader2, Sparkles, ExternalLink, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { User, Subscription } from '@supabase/supabase-js';

// Define plan structures (can be shared or fetched)
const paymentPlans = {
  trial: { id: 'trial', name: 'Scanner Pro - Trial', midtransPrice: 10000, telegramStars: 70, duration: '1 Week', features: ['Basic scanner access', 'Limited daily scans'], midtransPlanId: 'trial', telegramPlanId: 'scanner_pro_trial_tg' },
  monthly: { id: 'monthly', name: 'Scanner Pro - Monthly', midtransPrice: 50000, telegramStars: 350, duration: 'Monthly', features: ['Full scanner access', 'Unlimited daily scans', 'Priority support'], midtransPlanId: 'monthly', telegramPlanId: 'scanner_pro_monthly_tg' },
  yearly: { id: 'yearly', name: 'Scanner Pro - Yearly', midtransPrice: 500000, telegramStars: 3500, duration: 'Yearly', features: ['Full scanner access', 'Unlimited daily scans', 'Priority support', 'Early access to new features'], midtransPlanId: 'yearly', telegramPlanId: 'scanner_pro_yearly_tg' },
};
type PaymentPlanKey = keyof typeof paymentPlans;

interface Profile {
  id: string; // Supabase auth.users.id
  telegram_id?: number;
  telegram_username?: string;
  pro_plan_id_midtrans?: string;
  pro_expiry_midtrans?: string; // ISO Date string
  pro_plan_id_telegram?: string;
  pro_expiry_telegram?: string; // ISO Date string
  // Add other profile fields as needed
}

interface SnapWindow extends Window {
  snap?: {
    pay: (token: string, options?: unknown) => void;
  };
}

// --- KOMPONEN UTAMA ScannerPage ---
export default function ScannerPage() {
  const [feedbackMessage, setFeedbackMessage] = useState('Sedang memuat fitur, mohon tunggu...');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [isScanningActive, setIsScanningActive] = useState(false); 

  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isProMode, setIsProMode] = useState(false);
  const [proExpiryDate, setProExpiryDate] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState<PaymentPlanKey | null>(null); 

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showScanResultsPopup, setShowScanResultsPopup] = useState(false);
  const [scanResults, setScanResults] = useState('');

  const [dailyScanCount, setDailyScanCount] = useState(0);
  const [showMonetagAdModal, setShowMonetagAdModal] = useState(false);
  const FREE_SCAN_LIMIT = 10;

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevImagePreviewUrlBlobRef = useRef<string | null>(null);
  const authSubscriptionRef = useRef<Subscription | null>(null);

  const isValidDate = (d: unknown): d is Date => d instanceof Date && !isNaN(d.getTime());

  const checkProStatus = useCallback((profile: Profile | null) => {
    if (!profile) {
      setIsProMode(false);
      setProExpiryDate(null);
      return;
    }

    const currentDate = new Date();
    const validExpiries: Date[] = [];

    if (profile.pro_expiry_midtrans) {
      const midtransExpiry = new Date(profile.pro_expiry_midtrans);
      if (isValidDate(midtransExpiry) && midtransExpiry > currentDate) {
        validExpiries.push(midtransExpiry);
      }
    }

    if (profile.pro_expiry_telegram) {
      const telegramExpiry = new Date(profile.pro_expiry_telegram);
      if (isValidDate(telegramExpiry) && telegramExpiry > currentDate) {
        validExpiries.push(telegramExpiry);
      }
    }

    if (validExpiries.length > 0) {
      const maxTimestamp = Math.max(...validExpiries.map(date => date.getTime()));
      const latest = new Date(maxTimestamp);
      
      setIsProMode(true);
      setProExpiryDate(latest.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }));
    } else {
      setIsProMode(false);
      setProExpiryDate(null);
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    setIsLoadingAuth(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, daily_scan_count, last_scan_date')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { 
        throw error;
      }
      
      if (data) {
        const profileData = data as Profile & { daily_scan_count?: number; last_scan_date?: string };
        setUserProfile(profileData);
        checkProStatus(profileData);

        const today = new Date().toISOString().split('T')[0];
        let currentScans = profileData.daily_scan_count || 0;

        if (profileData.last_scan_date !== today) {
          currentScans = 0;
          supabase.from('profiles').update({ daily_scan_count: 0, last_scan_date: today }).eq('id', userId).then(({ error: updateError }) => {
            if (updateError) console.error('Error resetting daily scan count:', updateError);
          });
        }
        setDailyScanCount(currentScans);

      } else {
        setUserProfile(null); 
        setIsProMode(false);
        setProExpiryDate(null);
        setDailyScanCount(0);
      }
    } catch (error: unknown) {
      console.error('Error fetching user profile:', error);
      const message = error instanceof Error ? error.message : String(error);
      setFeedbackMessage(`Gagal memuat profil: ${message}`);
      setFeedbackType('error');
      setUserProfile(null);
      setIsProMode(false);
      setProExpiryDate(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [checkProStatus]);

  // Supabase Auth and Profile Fetching useEffect
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setIsLoadingAuth(false);
        setFeedbackMessage('Silakan login untuk menggunakan fitur Scanner Pro.');
        setFeedbackType('warning');
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setIsProMode(false);
        setProExpiryDate(null);
        setIsLoadingAuth(false);
      }
    });
    
    authSubscriptionRef.current = authListener.subscription;

    return () => {
      authSubscriptionRef.current?.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Load Midtrans Snap.js script
  useEffect(() => {
    const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!midtransClientKey || midtransClientKey === 'YOUR_MIDTRANS_CLIENT_KEY_PLACEHOLDER') {
      console.warn('Midtrans client key not set. Midtrans payments will not work.');
      return;
    }
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute('data-client-key', midtransClientKey);
    script.async = true;
    document.head.appendChild(script);
    return () => {
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // --- Feedback Siap Pakai (Adjusted) ---
  useEffect(() => {
    if (isLoadingAuth) {
        setFeedbackMessage('Memeriksa status autentikasi dan langganan...');
        setFeedbackType('info');
    } else if (supabaseUser && !feedbackMessage.startsWith('Gagal')) {
        if (isProMode) {
            setFeedbackMessage(`Akses Pro aktif hingga ${proExpiryDate}. Fitur siap digunakan.`);
            setFeedbackType('success');
        } else if (feedbackMessage.includes('memuat fitur') || feedbackMessage.includes('Memeriksa status')){
            setFeedbackMessage('Anda menggunakan mode gratis. Upgrade ke Pro untuk fitur penuh.');
            setFeedbackType('info');
        }
    } else if (!supabaseUser && !isLoadingAuth && !feedbackMessage.startsWith('Gagal')){
        setFeedbackMessage('Silakan login untuk menggunakan scanner atau upgrade ke Pro.');
        setFeedbackType('warning');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProMode, proExpiryDate, supabaseUser, isLoadingAuth]); // Removed feedbackMessage from deps to avoid loops

  // --- Cleanup Blob URL & Timeouts ---
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
    const videoElement = videoRef.current; // Capture videoRef.current
    return () => {
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        if (videoElement) videoElement.srcObject = null; // Use captured element
      }
    };
  }, []); 

  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64ImageData = reader.result?.toString().split(',')[1];
        if (base64ImageData) resolve(base64ImageData);
        else reject(new Error('Gagal konversi base64.'));
      };
      reader.onerror = (error) => reject(new Error('Gagal baca file: ' + (error instanceof ProgressEvent ? 'ProgressEvent' : String(error)) ) );
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
    setFeedbackMessage('Menganalisis gambar dengan AI...');
    setFeedbackType('info');
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
      const base64ImageData = await convertFileToBase64(imageFile);
      const response = await fetch('/api/llm/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: tradingPrompt, imageData: base64ImageData, mimeType: imageFile.type }),
      });

      if (!response.ok) {
        let errorResponseMessage = `Error backend (${response.status})`;
        try {
          const errorData = await response.json();
          errorResponseMessage = errorData.error || JSON.stringify(errorData) || `Error backend (${response.status}) - Respons tidak dikenal`;
        } catch { // Anonymous catch for jsonError
          // Jika parsing JSON gagal, coba baca sebagai teks
          try {
            const errorText = await response.text();
            errorResponseMessage = `Error backend (${response.status}): ${errorText || 'Tidak ada detail tambahan.'}`;
          } catch { // Anonymous catch for textError
            // Jika membaca sebagai teks juga gagal
            errorResponseMessage = `Error backend (${response.status}) - Gagal membaca respons error.`;
          }
        }
        throw new Error(errorResponseMessage);
      }

      const result = await response.json();
      if (result.text) {
        setScanResults(result.text);
        setShowScanResultsPopup(true);
        setFeedbackMessage('Analisis AI berhasil!');
        setFeedbackType('success');

        // If free user, increment scan count
        if (!isProMode && supabaseUser) {
          const newCount = dailyScanCount + 1;
          setDailyScanCount(newCount);
          const today = new Date().toISOString().split('T')[0];
          // Update Supabase in the background
          supabase.from('profiles')
            .update({ daily_scan_count: newCount, last_scan_date: today })
            .eq('id', supabaseUser.id)
            .then(({ error: updateError }) => {
              if (updateError) console.error('Error incrementing scan count:', updateError);
            });
        }
      } else {
        throw new Error('Respon backend tidak valid.');
      }
    } catch (error: unknown) { 
      console.error('Error during Gemini scan:', error);
      setFeedbackMessage(`Analisis AI gagal: ${error instanceof Error ? error.message : String(error)}`);
      setFeedbackType('error');
    } finally {
      setIsScanningActive(false); 
    }
  }, [convertFileToBase64, dailyScanCount, isProMode, supabaseUser]);

  const closeCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
    setIsScanningActive(false); 
  }, []);

  // Pindahkan definisi openCamera ke sini, SEBELUM useEffect yang menggunakannya
  const openCamera = useCallback(async () => {
    if (!videoRef.current) {
      setFeedbackMessage('Komponen video belum siap. Coba lagi sesaat.');
      setIsCameraOpen(false);
      return;
    }

    if (isScanningActive || isCameraOpen) return;
    setIsScanningActive(true); 
    setFeedbackMessage('Mengakses kamera...');
    setFeedbackType('info');
    setCameraError(null);
    if (imagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null); 
    setUploadedImage(null); 
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
                setIsCameraOpen(true);
                setIsScanningActive(false); 
                setFeedbackMessage('Kamera aktif. Arahkan & ambil foto.');
            }).catch(err => { 
                console.error("Error playing video stream:", err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setCameraError(`Gagal stream video: ${errorMessage}`);
                setFeedbackMessage(`Gagal stream video: ${errorMessage}`);
                setFeedbackType('error');
                stream.getTracks().forEach(track => track.stop()); 
                setIsCameraOpen(false); setIsScanningActive(false); 
            });
          };
        } else {
            stream.getTracks().forEach(track => track.stop()); setIsScanningActive(false);
            setFeedbackMessage('Gagal menginisialisasi video. Ref tidak ditemukan setelah stream didapatkan.'); 
            setFeedbackType('error');
        }
      } catch (err: unknown) { 
        let message = 'Gagal akses kamera.';
        const errorName = err instanceof Error ? err.name : undefined;
        const errorMessageText = err instanceof Error ? err.message : String(err);

        if (errorName === "NotAllowedError") message = 'Akses kamera ditolak.';
        else if (errorName === "NotFoundError") message = 'Kamera tidak ada.';
        else if (errorName === "NotReadableError") message = 'Kamera bermasalah.';
        else message = `Gagal kamera: ${errorName || errorMessageText}`;
        setCameraError(message); setFeedbackMessage(message); setFeedbackType('error');
        setIsCameraOpen(false); setIsScanningActive(false);
      }
    } else {
      setFeedbackMessage('Fitur kamera tidak didukung.'); setFeedbackType('error');
      setIsCameraOpen(false); setIsScanningActive(false);
    }
  }, [isScanningActive, isCameraOpen, imagePreviewUrl, setFeedbackMessage, setIsCameraOpen, setFeedbackType, setCameraError, setImagePreviewUrl, setUploadedImage]); // Pastikan semua dependensi state setter juga dimasukkan jika ESLint menyarankannya

  useEffect(() => {
    if (isCameraOpen && !isScanningActive) {
      const timeoutId = setTimeout(() => {
        if (videoRef.current) {
          openCamera(); // Sekarang openCamera sudah didefinisikan
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isCameraOpen, isScanningActive, openCamera]);

  useEffect(() => {
    console.log('Video ref in useEffect:', videoRef.current);
    // Logika lain yang mungkin ada di sini
  }, []); // Atau dengan dependensi yang sesuai

  // Hapus fungsi ini jika tidak ada tombol atau event yang memanggilnya
  // const handleOpenCameraClick = () => {
  //   console.log('Video ref before openCamera call:', videoRef.current);
  //   openCamera();
  // }; 

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
      return null; 
    } 
  }, []);

  const takePhoto = useCallback(() => {
    if (!isCameraOpen || !videoRef.current || !canvasRef.current) {
        setFeedbackMessage('Kamera tidak aktif.'); setFeedbackType('error'); return;
    }
    if (videoRef.current.readyState >= videoRef.current.HAVE_METADATA && videoRef.current.videoWidth > 0) {
      setFeedbackMessage('Mengambil foto...');
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
          setUploadedImage(photoFile); setFeedbackMessage('Foto diambil.'); setFeedbackType('success');
        } else {
          setFeedbackMessage('Gagal proses foto.'); setFeedbackType('error');
          if (imagePreviewUrl === dataUrl) setImagePreviewUrl(null); 
        }
      } else {
        setFeedbackMessage('Gagal konteks canvas.'); setFeedbackType('error');
      }
      closeCamera(); 
    } else {
        setFeedbackMessage('Kamera belum siap.'); setFeedbackType('error');
    }
  }, [isCameraOpen, closeCamera, dataURLtoFile, imagePreviewUrl]); 

  const handleCloseScanResultsPopup = async () => {
    setShowScanResultsPopup(false);
    setFeedbackMessage('Hasil analisis ditutup.');
    setFeedbackType('info');
    if (!isProMode && supabaseUser) {
      setShowMonetagAdModal(true);
      // You might want to update feedback message here too
      // setFeedbackMessage('Terima kasih telah menggunakan versi gratis! Lihat penawaran sponsor kami.');
    }
  };

  const handleMainScanClick = async () => {
    if (isScanningActive || isCameraOpen) return;

    if (uploadedImage) { 
      if (isProMode) { 
        setShowScanResultsPopup(true); 
      } else { 
          if (dailyScanCount >= FREE_SCAN_LIMIT) {
            setFeedbackMessage(`Limit scan harian (${FREE_SCAN_LIMIT}) tercapai. Upgrade ke Pro untuk scan tanpa batas atau coba lagi besok.`);
            setFeedbackType('warning');
            return;
          }
          performGeminiScanViaBackend(uploadedImage);
      }
    } else { 
      openCamera();
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (isCameraOpen) closeCamera(); 
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFeedbackMessage('Format file tidak disokong.');
        setFeedbackType('error');
        if (fileInputRef.current) fileInputRef.current.value = ""; 
        return;
      }
      setUploadedImage(file);
      if (imagePreviewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(URL.createObjectURL(file));
      setFeedbackMessage('Gambar diunggah. Klik tombol pindai.');
      setFeedbackType('info'); 
    }
  };

  const handleRemoveImage = () => {
    if (isCameraOpen) closeCamera(); 
    if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
    }
    setUploadedImage(null);
    setImagePreviewUrl(null);
    setFeedbackMessage('Gambar dibuang. Ambil foto atau unggah baru.');
    setFeedbackType('info');
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  // Updated feedback styles to use Tailwind theme classes
  const getFeedbackStyles = () => {
    switch (feedbackType) {
      case 'success': 
        return { 
          borderColorClass: 'border-primary', 
          bgColorClass: 'bg-primary/10', // Subtle background using primary color with low opacity
          textColorClass: 'text-foreground', // Use main foreground for success text on dark bg
          icon: <CheckCircle2 className="h-5 w-5 text-primary" /> 
        };
      case 'error': 
        return { 
          borderColorClass: 'border-red-500', // Keep red for error indication
          bgColorClass: 'bg-red-500/10', 
          textColorClass: 'text-red-400', // Lighter red for text
          icon: <AlertCircle className="h-5 w-5 text-red-500" /> 
        };
      case 'warning':
        return {
          borderColorClass: 'border-yellow-500',
          bgColorClass: 'bg-yellow-500/10',
          textColorClass: 'text-yellow-400',
          icon: <ExternalLink className="h-5 w-5 text-yellow-500" />
        };
      default: // info
        return { 
          borderColorClass: 'border-muted-foreground', 
          bgColorClass: 'bg-muted-foreground/10', 
          textColorClass: 'text-muted-foreground', 
          icon: <AlertCircle className="h-5 w-5 text-muted-foreground" /> 
        };
    }
  };
  const feedbackStyles = getFeedbackStyles();

  const mainButtonText = () => {
    if (isCameraOpen) return 'Kamera Aktif...'; 
    if (uploadedImage) return isProMode ? 'Pindai (Pro)' : 'Pindai (Gratis)';
    return isProMode ? 'Buka Kamera (Pro)' : 'Buka Kamera (Gratis)';
  };
  
  const mainButtonDisabled = isScanningActive || isCameraOpen;

  const handlePurchase = async (plan: PaymentPlanKey) => {
    if (!supabaseUser) {
      setFeedbackMessage('Silakan login untuk melakukan pembelian.');
      setFeedbackType('warning');
      return;
    }
    if (!(window as SnapWindow).snap) {
      setFeedbackMessage('Layanan pembayaran belum siap. Coba lagi nanti.');
      setFeedbackType('error');
      return;
    }

    setIsLoadingPurchase(plan);
    setFeedbackMessage(`Memproses langganan ${paymentPlans[plan].name}...`);
    setFeedbackType('info');

    try {
      const response = await fetch('/api/payment/midtrans/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: paymentPlans[plan].midtransPlanId,
          userId: supabaseUser.id,
          userEmail: supabaseUser.email,
          userName: supabaseUser.user_metadata?.full_name || supabaseUser.email, // Or any other name field
          amount: paymentPlans[plan].midtransPrice,
          planName: paymentPlans[plan].name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat transaksi Midtrans.');
      }

      (window as SnapWindow).snap?.pay(data.token, {
        onSuccess: function () {
          setFeedbackMessage('Pembayaran berhasil! Status Pro akan segera aktif.');
          setFeedbackType('success');
          if (supabaseUser) fetchUserProfile(supabaseUser.id);
        },
        onPending: function () {
          setFeedbackMessage('Pembayaran Anda tertunda. Cek email atau akun Midtrans Anda.');
          setFeedbackType('warning');
        },
        onError: function () {
          setFeedbackMessage('Pembayaran gagal. Silakan coba lagi.');
          setFeedbackType('error');
        },
        onClose: function () {
          if (feedbackType !== 'success' && feedbackType !== 'warning' && feedbackType !== 'error'){
            setFeedbackMessage('Anda menutup popup pembayaran.');
            setFeedbackType('info');
          }
        },
      });
    } catch (error: unknown) {
      console.error('Error during Midtrans purchase:', error);
      const message = error instanceof Error ? error.message : String(error);
      setFeedbackMessage(`Gagal memulai pembayaran: ${message}`);
      setFeedbackType('error');
    } finally {
      setIsLoadingPurchase(null);
    }
  };

  // --- Helper function to parse scan results ---
  const parseScanResults = (results: string): Array<{ title: string; content: string; isSubItem?: boolean }> => {
    if (!results || typeof results !== 'string') return [{ title: "Error", content: "Hasil analisis tidak valid atau kosong." }];
    const lines = results.split('\n');
    const parsed: Array<{ title: string; content: string; isSubItem?: boolean }> = [];
    let currentTitle = "Informasi Umum"; // Default title for lines before the first proper title
    let currentContent = "";
    let inRekomendasiTrading = false;
    const rekomendasiSubItems = ["Time Frame", "Gaya Trading", "Resiko", "Rekomendasi Aksi"];
  
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
  
      const titleMatch = trimmedLine.match(/^([\w\s-]+):(.*)$/);
  
      if (titleMatch && titleMatch[1]) {
        const newTitle = titleMatch[1].trim();
        const newContent = titleMatch[2] ? titleMatch[2].trim() : "";
  
        if (currentContent) { // Push previous item if content exists
          parsed.push({ title: currentTitle, content: currentContent.trim() });
          currentContent = ""; // Reset content for the new item
        }
        
        currentTitle = newTitle;
        currentContent = newContent; // Start new content with what's on the title line
  
        if (newTitle.toLowerCase() === "rekomendasi trading") {
          inRekomendasiTrading = true;
        } else if (inRekomendasiTrading && !rekomendasiSubItems.some(sub => newTitle.startsWith(sub))) {
          // If we encounter a new main title after Rekomendasi Trading, end the section
          inRekomendasiTrading = false; 
        }
  
      } else if (trimmedLine.startsWith("- ") && currentTitle) { 
        // Handles list items within a section, typically under Rekomendasi Trading
        if (currentContent) currentContent += '\n'; // Add newline if there's existing content for this title
        currentContent += trimmedLine;
      } else if (currentTitle) { // Line is part of the content of the current item
        if (currentContent) currentContent += '\n';
        currentContent += trimmedLine;
      }
    }
  
    // Push the last item
    if (currentTitle && currentContent.trim()) {
      parsed.push({ title: currentTitle, content: currentContent.trim() });
    } else if (currentTitle && !currentContent.trim() && parsed.length > 0 && parsed[parsed.length-1].title === currentTitle){
      // If the last item had a title but no new content line, its content might be in parsed already.
    } else if (currentTitle) {
       // If there was a title but no content followed (e.g. "Rekomendasi Trading:" then sub-items)
       // It might already be handled, or it indicates a section without direct content.
       // For now, we ensure it doesn't create an empty content item if it's the last thing.
    }

    if (parsed.length === 0 && results.trim()) {
      return [{ title: "Analisis Detail", content: results.trim() }];
    }
    if (parsed.length === 0 && !results.trim()) {
        return [{ title: "Info", content: "Tidak ada hasil untuk ditampilkan." }];
    }
  
    // Post-process to group Rekomendasi Trading sub-items
    const finalParsed: Array<{ title: string; content: string; isSubItem?: boolean }> = [];
    let rekomendasiBuffer: { title: string; content: string; isSubItem?: boolean } | null = null;
  
    for (const item of parsed) {
      if (item.title.toLowerCase() === "rekomendasi trading") {
        if (rekomendasiBuffer) finalParsed.push(rekomendasiBuffer); // Push previous if any
        rekomendasiBuffer = { title: "Rekomendasi Trading", content: item.content, isSubItem: false };
      } else if (rekomendasiBuffer && rekomendasiSubItems.some(sub => item.title.startsWith(sub))) {
        rekomendasiBuffer.content += `\n\n**${item.title}:**\n${item.content}`;
      } else {
        if (rekomendasiBuffer) {
          finalParsed.push(rekomendasiBuffer);
          rekomendasiBuffer = null;
        }
        finalParsed.push(item);
      }
    }
    if (rekomendasiBuffer) finalParsed.push(rekomendasiBuffer);
  
    return finalParsed.length > 0 ? finalParsed : [{ title: "Analisis", content: "Tidak ada detail analisis." }];
  };

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 font-sans relative">
        {showScanResultsPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-md transition-opacity duration-300 ease-in-out">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 opacity-100">
              <div className="p-6 text-center border-b border-border">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-semibold text-foreground">Hasil Analisis AI Trading</h2>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5 custom-scrollbar-dark">
                {parseScanResults(scanResults).map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${result.isSubItem ? 'ml-4 border-neutral-700 bg-neutral-800/30' : 'border-border bg-background/50 shadow-sm'}`}>
                    <h3 className={`font-semibold text-lg mb-2 ${result.isSubItem ? 'text-primary/90' : 'text-primary'}`}>{result.title}</h3>
                    <div className="whitespace-pre-wrap break-words text-sm text-muted-foreground leading-relaxed">
                      {result.content.split('\n').map((line, lineIndex) => {
                        const boldMatch = line.match(/\*\*(.*?)\*\*/);
                        if (boldMatch && boldMatch[1]) {
                          const parts = line.split(/\*\*(.*?)\*\*/);
                          return (
                            <React.Fragment key={lineIndex}>
                              {parts.map((part, i) => 
                                i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
                              )}
                              <br/>
                            </React.Fragment>
                          );
                        }
                        if (line.startsWith('- ')) {
                          return (
                            <span key={lineIndex} className="flex items-start">
                              <span className="mr-2 mt-1 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                              <span>{line.substring(2)}</span>
                              <br/>
                            </span>
                          );
                        }
                        return <React.Fragment key={lineIndex}>{line}<br/></React.Fragment>;
                      })}
                    </div>
                  </div>
                ))}
                {parseScanResults(scanResults).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Tidak ada hasil analisis untuk ditampilkan.</p>
                )}
              </div>

              <div className="p-6 border-t border-border">
                <button 
                  onClick={handleCloseScanResultsPopup} 
                  className="w-full font-semibold py-3 px-6 rounded-lg text-base transition-opacity hover:opacity-90 bg-primary text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card"
                >
                  Tutup & Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Monetag Ad Modal */}
        {showMonetagAdModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[101] p-4 backdrop-blur-md">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100 opacity-100">
              <div className="p-6 text-center border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Penawaran Sponsor</h2>
                 <button 
                    onClick={() => setShowMonetagAdModal(false)} 
                    className="absolute top-3 right-3 p-1.5 bg-transparent rounded-full text-muted-foreground hover:bg-neutral-700/50 transition-colors z-30" 
                    aria-label="Tutup iklan">
                    <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 min-h-[250px] flex items-center justify-center">
                {/* 
                  !!!! PASTE YOUR MONETAG AD SCRIPT/CODE HERE !!!!
                  For example, if it's a script tag:
                  <div dangerouslySetInnerHTML={{ __html: \`
                    <script type="text/javascript">
                      // Your Monetag ad zone script
                    </script>
                  \`}} />
                  Or if it's an iframe or other embed code.
                  Make sure it's responsive or fits within this modal.
                */}
                <p className="text-muted-foreground">Monetag Ad Placeholder - Anda perlu mengganti ini dengan kode iklan Monetag Anda.</p>
              </div>
              <div className="p-4 border-t border-border text-center">
                <button 
                  onClick={() => setShowMonetagAdModal(false)} 
                  className="font-semibold py-2 px-5 rounded-lg text-sm transition-opacity hover:opacity-90 bg-primary text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card"
                >
                  Tutup Iklan
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-neutral-800/70">
          <div className="bg-neutral-800/50 p-5 sm:p-6 text-center border-b border-border">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Pemindai Analisis Trading</h1>
            <p className="text-xs sm:text-sm mt-1 text-muted-foreground">Gunakan kamera atau unggah gambar chart untuk analisis AI.</p>
          </div>

          <div className="p-4 sm:p-5 bg-card">
            <div className="flex items-center justify-center space-x-2 bg-background p-1 rounded-lg shadow-inner border border-border">
              <button 
                onClick={() => setIsProMode(false)} 
                className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-semibold transition-all duration-300 ease-out flex items-center justify-center space-x-1.5 
                            ${!isProMode ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-neutral-700/60'}`}>
                <ShieldOff className={`w-4 h-4 ${!isProMode ? 'text-primary-foreground' : 'text-primary'}`} />
                <span>free & ads</span>
              </button>
              <button 
                onClick={() => setIsProMode(true)} 
                className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-semibold transition-all duration-300 ease-out flex items-center justify-center space-x-1.5 
                            ${isProMode ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-neutral-700/60'}`}>
                <Star className={`w-4 h-4 ${isProMode ? 'text-primary' : 'text-primary'}`} />
                <span>Pro & No ads</span>
              </button>
            </div>
          </div>
          
          <div className="p-5 sm:p-6 bg-card">
            <div
              className={`relative mx-auto w-full aspect-[4/3] sm:aspect-square max-w-[320px] sm:max-w-[280px] rounded-xl overflow-hidden border-2 flex items-center justify-center transition-all duration-300 bg-background 
              ${(isScanningActive) && !isCameraOpen ? 'border-primary shadow-xl shadow-primary/20' : 'border-border'} 
              ${isCameraOpen ? 'border-primary border-solid' : 'border-dashed'} 
              ${isProMode && !isScanningActive && !isCameraOpen ? 'border-primary border-solid shadow-lg shadow-primary/10' : ''} 
              ${imagePreviewUrl ? 'border-solid border-primary' : (isCameraOpen ? 'border-solid border-primary' : 'border-dashed border-border')}`}
            >
              {isCameraOpen ? (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover rounded-xl" playsInline muted autoPlay />
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                      <button 
                        onClick={takePhoto} 
                        disabled={!videoRef.current?.srcObject || !videoRef.current?.videoWidth || videoRef.current.readyState < videoRef.current.HAVE_METADATA}
                        className="font-semibold py-2.5 px-5 rounded-full text-sm shadow-md flex items-center backdrop-blur-sm bg-primary/80 text-primary-foreground hover:bg-primary/90 border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed">
                        <Camera className="w-5 h-5 mr-2" />Ambil Foto
                      </button>
                      <button 
                        onClick={closeCamera} 
                        className="font-semibold p-2.5 rounded-full text-sm shadow-md flex items-center backdrop-blur-sm bg-black/50 text-white hover:bg-black/70 border-2 border-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Tutup Kamera">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </>
              ) : imagePreviewUrl ? (
                <Image src={imagePreviewUrl} alt="Pratinjau Unggahan" layout="fill" objectFit="contain" className="rounded-xl" unoptimized={true} />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <Camera className={`h-16 w-16 sm:h-20 sm:w-20 transition-opacity duration-300 mb-3 ${(isScanningActive) ? 'text-primary opacity-40' : 'text-muted-foreground opacity-70'}`} />
                  <p className="text-sm text-muted-foreground">Klik &quot;{mainButtonText()}&quot;<br/>atau unggah gambar.</p>
                </div>
              )}
              {!isCameraOpen && !imagePreviewUrl && !isScanningActive && (
                  <>
                    <div className={`absolute top-2 left-2 w-6 h-6 sm:w-8 sm:h-8 border-t-[3px] border-l-[3px] rounded-tl-lg ${isProMode ? 'border-primary' : 'border-border'}`}></div>
                    <div className={`absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 border-t-[3px] border-r-[3px] rounded-tr-lg ${isProMode ? 'border-primary' : 'border-border'}`}></div>
                    <div className={`absolute bottom-2 left-2 w-6 h-6 sm:w-8 sm:h-8 border-b-[3px] border-l-[3px] rounded-bl-lg ${isProMode ? 'border-primary' : 'border-border'}`}></div>
                    <div className={`absolute bottom-2 right-2 w-6 h-6 sm:w-8 sm:h-8 border-b-[3px] border-r-[3px] rounded-br-lg ${isProMode ? 'border-primary' : 'border-border'}`}></div>
                  </>
              )}
              {imagePreviewUrl && !isScanningActive && !isCameraOpen && (
                <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Buang gambar"><XCircle className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              )}
              {(isScanningActive) && (
                  <div className="absolute inset-0 w-full h-full overflow-hidden rounded-xl bg-black/30 flex items-center justify-center z-10 backdrop-blur-sm"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
              )}
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          </div>
          
          <div className="px-5 sm:px-6 pb-3 sm:pb-4 space-y-3 bg-card">
            <button 
                onClick={handleMainScanClick} 
                disabled={mainButtonDisabled}
                className={`w-full font-semibold py-3 px-6 rounded-xl text-base sm:text-lg transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-4 focus:ring-opacity-50 flex items-center justify-center 
                            ${mainButtonDisabled ? 'bg-neutral-700 text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:opacity-90 hover:shadow-lg focus:ring-primary/50'}`}>
              { (isScanningActive) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {mainButtonText()}
            </button>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} id="imageUploadInputScannerPage" />
            <button 
                onClick={() => { if (isCameraOpen) closeCamera(); fileInputRef.current?.click(); }} 
                disabled={mainButtonDisabled}
                className={`w-full font-semibold py-2.5 px-6 rounded-xl text-sm sm:text-base transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-4 focus:ring-opacity-50 flex items-center justify-center space-x-2 
                            ${mainButtonDisabled ? 'bg-neutral-800 text-muted-foreground cursor-not-allowed' : 'bg-neutral-700 text-foreground hover:bg-neutral-600 hover:shadow-md focus:ring-neutral-500'}`}>
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" /><span>{imagePreviewUrl ? 'Ganti Gambar' : (isCameraOpen ? 'Tutup Kamera & Unggah' : 'Unggah Gambar Chart')}</span>
            </button>
          </div>

          {/* Feedback Message Section - Themed */}
          {feedbackMessage && (
            <div className={`mx-5 sm:mx-6 mb-5 sm:mb-6 p-3.5 sm:p-4 border-l-4 rounded-md shadow-md flex items-start space-x-3 ${feedbackStyles.bgColorClass} ${feedbackStyles.borderColorClass}`}>
              <div className="flex-shrink-0 pt-0.5">{feedbackStyles.icon}</div>
              <p className={`text-sm ${feedbackStyles.textColorClass}`}>{feedbackMessage}{cameraError && <span className="block mt-1 text-xs">{cameraError}</span>}</p>
            </div>
          )}
        </div>
        
        {/* Payment Plans Section */}
        {!isLoadingAuth && supabaseUser && !isProMode && (
          <div className="mt-8 w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-center text-foreground mb-2 flex items-center justify-center">
              <Sparkles className="w-7 h-7 mr-2 text-primary" /> Upgrade ke Scanner Pro
            </h2>
            <p className="text-center text-muted-foreground mb-6 text-sm">Nikmati semua fitur tanpa batas dan tanpa iklan.</p>
            
            <div className="space-y-4">
              {(Object.keys(paymentPlans) as PaymentPlanKey[]).map((planKey) => {
                const plan = paymentPlans[planKey];
                const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "YOUR_BOT_USERNAME";
                const telegramDeepLink = `https://t.me/${botUsername}?start=subscribe_${plan.telegramPlanId}`;
                const isLoadingThisPlan = isLoadingPurchase === planKey;

                return (
                  <div key={plan.id} className="p-4 border border-border rounded-lg bg-background/30 shadow-sm">
                    <h3 className="text-lg font-semibold text-primary">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-1">{plan.duration} - {plan.features.join(', ')}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => handlePurchase(planKey)}
                        disabled={isLoadingThisPlan || isLoadingPurchase !== null}
                        className={`w-full sm:w-auto flex-1 font-semibold py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center
                                    ${isLoadingThisPlan ? 'bg-neutral-600 text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                                    disabled:opacity-70 disabled:cursor-not-allowed`}
                      >
                        {isLoadingThisPlan ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Crown className="mr-2 h-4 w-4" />
                        )}
                        Bayar Rp {plan.midtransPrice.toLocaleString('id-ID')} (Web)
                      </button>
                      <a 
                        href={telegramDeepLink}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`w-full sm:w-auto flex-1 font-semibold py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center text-center
                                    bg-sky-500 text-white hover:bg-sky-600
                                    ${isLoadingPurchase !== null ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}
                        onClick={(e) => { if(isLoadingPurchase !== null) e.preventDefault(); }}
                      >
                        <Star className="mr-2 h-4 w-4" /> Bayar {plan.telegramStars} Stars (Telegram)
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <footer className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">{isProMode ? "Anda menggunakan Mode Pro." : 
            `Mode Gratis: ${dailyScanCount}/${FREE_SCAN_LIMIT} scan hari ini. ${dailyScanCount >= FREE_SCAN_LIMIT ? 'Limit tercapai.' : ''}`
          }</p>
        </footer>

        <style jsx global>{`
          .custom-scrollbar-dark::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scrollbar-dark::-webkit-scrollbar-track {
            background: var(--color-card, #1E1E1E); /* Fallback */
            border-radius: 10px;
          }
          .custom-scrollbar-dark::-webkit-scrollbar-thumb {
            background-color: var(--color-muted-foreground, #A0A0A0); /* Fallback */
            border-radius: 10px;
            border: 2px solid var(--color-card, #1E1E1E); /* Fallback */
          }
          .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
            background-color: var(--color-primary, #FFFFFF); /* Fallback */
          }
          @keyframes scan-line-animation {0% { transform: translateY(-10%); opacity: 0.6; } 50% { transform: translateY(calc(100% + 5px)); opacity: 1; } 100% { transform: translateY(-10%); opacity: 0.6;}}
        `}</style>
      </main>
    </>
  );
}
