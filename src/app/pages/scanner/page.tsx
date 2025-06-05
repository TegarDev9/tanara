'use client';

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { Camera, AlertCircle, CheckCircle2, Star, UploadCloud, XCircle, Loader2, Sparkles, Crown, ShieldAlert, VideoOff } from 'lucide-react';
import { createClient, SupabaseClient, User, Subscription as SupabaseSubscription, AuthError, Session } from '@supabase/supabase-js';
import Image from 'next/image';

// --- Environment Variables ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const REWARDED_INTERSTITIAL_ZONE_ID = process.env.NEXT_PUBLIC_REWARDED_INTERSTITIAL_ZONE_ID;

// --- Supabase Client Setup ---
let supabaseInstance: SupabaseClient;

interface MockSession extends Partial<Session> {
  access_token: string;
  token_type: string;
  user: User;
  expires_at?: number;
  refresh_token?: string;
}

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error('Supabase URL or Anon Key is missing. ScannerPage will use a fallback mock.');
  supabaseInstance = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error('Supabase mock: getSession error') as AuthError }),
      onAuthStateChange: (_callback: (event: string, session: User | null) => void) => {
        if (process.env.NODE_ENV === 'development') {
          // Using the _callback parameter to satisfy ESLint
          console.log("Supabase mock: onAuthStateChange invoked, callback argument type:", typeof _callback);
        }
        return ({
          data: { subscription: { unsubscribe: () => {} } as SupabaseSubscription },
          error: null
        } as { data: { subscription: SupabaseSubscription }; error: AuthError | null });
      },
      signInAnonymously: async () => {
        console.warn("Supabase mock: signInAnonymously");
        const mockUser = {
            id: 'mock-anon-user-id', aud: 'authenticated', role: 'anonymous', email: undefined,
            app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString(), is_anonymous: true,
        } as User;
        const mockSession: MockSession = { // Using the defined MockSession type
            access_token: 'mock-anon-token', token_type: 'bearer', user: mockUser,
            expires_at: Date.now() + 3600000, refresh_token: 'mock-refresh-token'
        };
        return { data: { user: mockUser, session: mockSession }, error: null };
      }
    },
    from: (tableName: string) => ({
      select: (_selectStatement?: string) => ({
        eq: (_column: string, _value: unknown) => ({
          single: async () => ({ data: null, error: new Error(`Supabase mock: from(${tableName}).select().eq().single() error`) }),
        }),
      }),
      update: (_values: object) => ({
        eq: (_column: string, _value: unknown) => Promise.resolve({ data: null, error: new Error(`Supabase mock: from(${tableName}).update().eq() error`) }),
      }),
    }),
    rpc: async (...args: unknown[]) => ({ data: null, error: new Error('Supabase mock: rpc error') }),
    storage: {
        from: (_bucketName: string) => ({
            upload: async (_path: string, _file: File) => ({ data: { path: _path }, error: null }),
            download: async (_path: string) => ({ data: null, error: new Error('Supabase mock: storage.download error') }),
        })
    }
  } as unknown as SupabaseClient;
}
const supabase = supabaseInstance;
// --- End Supabase Client Setup ---

// --- Monetag Ad Types (adjust based on actual Monetag SDK if available) ---
declare global {
  interface Window {
    // Replace 'znymDisplayRewardedAd' with the actual function Monetag provides
    // and add any other Monetag specific properties or methods.
    znymDisplayRewardedAd?: (options: { zoneid: string | number, callbacks?: MonetagAdCallbacks }) => void;
    // It's also common for ad SDKs to expose a global object:
    // monetag?: { showRewarded: (options: any) => void; /* ... other methods ... */ };
  }
}

interface MonetagAdCallbacks {
  onShow?: () => void;
  onClose?: (rewardGranted: boolean) => void; // rewardGranted might be part of onClose or a separate onReward
  onComplete?: () => void; // Or onReward
  onError?: (error: Error) => void;
}
// --- End Monetag Ad Types ---


const paymentPlans = {
  trial: { id: 'trial', name: 'Scanner Pro - Trial', midtransPrice: 10000, telegramStars: 70, duration: '1 Minggu', features: ['Akses scanner dasar', 'Scan harian terbatas'], midtransPlanId: 'trial', telegramPlanId: 'scanner_pro_trial_tg' },
  monthly: { id: 'monthly', name: 'Scanner Pro - Bulanan', midtransPrice: 50000, telegramStars: 350, duration: 'Bulanan', features: ['Akses scanner penuh', 'Scan harian tanpa batas', 'Dukungan prioritas'], midtransPlanId: 'monthly', telegramPlanId: 'scanner_pro_monthly_tg' },
  yearly: { id: 'yearly', name: 'Scanner Pro - Tahunan', midtransPrice: 500000, telegramStars: 3500, duration: 'Tahunan', features: ['Akses scanner penuh', 'Scan harian tanpa batas', 'Dukungan prioritas', 'Akses awal fitur baru'], midtransPlanId: 'yearly', telegramPlanId: 'scanner_pro_yearly_tg' },
};
type PaymentPlanKey = keyof typeof paymentPlans;

interface Profile {
  id: string; 
  telegram_id?: number;
  telegram_username?: string;
  pro_plan_id_midtrans?: string;
  pro_expiry_midtrans?: string; 
  pro_plan_id_telegram?: string;
  pro_expiry_telegram?: string; 
  daily_scan_count?: number;
  last_scan_date?: string;
}

interface SnapWindow extends Window {
  snap?: {
    pay: (token: string, options?: SnapPayOptions) => void;
  };
}

interface SnapPayOptions {
    onSuccess?: (result: SnapSuccessResult) => void;
    onPending?: (result: SnapPendingResult) => void;
    onError?: (result: SnapErrorResult) => void;
    onClose?: () => void;
}

interface SnapSuccessResult {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status: string;
}
interface SnapPendingResult {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
}
interface SnapErrorResult {
    status_code: string;
    status_message: string[];
}

export default function ScannerPage() {
  const [feedbackMessage, setFeedbackMessage] = useState('Sedang memuat fitur, mohon tunggu...');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [isScanningActive, setIsScanningActive] = useState(false);

  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isProMode, setIsProMode] = useState(false);
  const [proExpiryDate, setProExpiryDate] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState<PaymentPlanKey | null>(null);

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showScanResultsPopup, setShowScanResultsPopup] = useState(false);
  const [scanResults, setScanResults] = useState('');

  const [dailyScanCount, setDailyScanCount] = useState(0);
  // const [showMonetagAdModal, setShowMonetagAdModal] = useState(false); // Removed, as rewarded ads are typically overlays
  const FREE_SCAN_LIMIT = 10;
  const [isAdLoadingOrShowing, setIsAdLoadingOrShowing] = useState(false);


  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevImagePreviewUrlBlobRef = useRef<string | null>(null);
  const authSubscriptionRef = useRef<SupabaseSubscription | { unsubscribe: () => void } | null>(null);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCameraErrorModal, setShowCameraErrorModal] = useState(false);

  // --- Monetag Ad Script Loading ---
  useEffect(() => {
    if (REWARDED_INTERSTITIAL_ZONE_ID && typeof window !== 'undefined' && !window.znymDisplayRewardedAd) {
      console.log('Attempting to load Monetag Rewarded Ad script for zone:', REWARDED_INTERSTITIAL_ZONE_ID);
      const scriptId = 'monetag-rewarded-script';
      if (document.getElementById(scriptId)) {
        console.log('Monetag script already exists.');
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      // IMPORTANT: Replace this URL with the correct one from Monetag documentation for rewarded interstitial ads
      script.src = `https://ads.monetag.com/site/script/rewarded_interstitial.js?zoneid=${REWARDED_INTERSTITIAL_ZONE_ID}`; // Example URL
      script.async = true;
      script.onload = () => {
        console.log('Monetag Rewarded Ad script loaded successfully.');
        if (typeof window.znymDisplayRewardedAd !== 'function') {
            console.warn('Monetag SDK loaded, but window.znymDisplayRewardedAd is not a function. Check Monetag integration.');
        }
      };
      script.onerror = () => {
        console.error('Failed to load Monetag Rewarded Ad script.');
        setFeedbackMessage('Gagal memuat komponen iklan. Fungsi iklan mungkin tidak tersedia.');
        setFeedbackType('error');
      };
      document.head.appendChild(script);

      return () => {
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
          // document.head.removeChild(existingScript); // Some ad SDKs don't like being removed
          console.log('Monetag script cleanup (if any) would happen here.');
        }
      };
    } else if (!REWARDED_INTERSTITIAL_ZONE_ID) {
        console.warn('NEXT_PUBLIC_REWARDED_INTERSTITIAL_ZONE_ID is not set. Rewarded ads will be disabled.');
    }
  }, []);

  const handleShowRewardedAd = useCallback(() => {
    if (isAdLoadingOrShowing) {
        console.log("Ad already loading or showing.");
        return;
    }
    if (!REWARDED_INTERSTITIAL_ZONE_ID) {
        setFeedbackMessage('Fitur iklan tidak tersedia (ID Zona tidak diatur).');
        setFeedbackType('warning');
        return;
    }
    if (typeof window.znymDisplayRewardedAd !== 'function') {
        setFeedbackMessage('Komponen iklan belum siap. Coba lagi nanti.');
        setFeedbackType('error');
        console.error('Monetag function window.znymDisplayRewardedAd not found.');
        return;
    }

    console.log('Attempting to show Monetag Rewarded Ad for zone:', REWARDED_INTERSTITIAL_ZONE_ID);
    setFeedbackMessage('Memuat iklan...');
    setFeedbackType('info');
    setIsAdLoadingOrShowing(true);

    try {
        window.znymDisplayRewardedAd({
            zoneid: parseInt(REWARDED_INTERSTITIAL_ZONE_ID, 10), // Ensure zoneid is a number if required
            callbacks: {
                onShow: () => {
                    console.log('Monetag Rewarded Ad: Shown');
                    setFeedbackMessage('Iklan sedang ditampilkan...');
                },
                onClose: (rewardGranted) => { // Check Monetag docs for exact signature
                    console.log('Monetag Rewarded Ad: Closed. Reward granted:', rewardGranted);
                    setIsAdLoadingOrShowing(false);
                    if (rewardGranted) {
                        setFeedbackMessage('Terima kasih telah menonton iklan!');
                        setFeedbackType('success');
                        // Optional: Grant a specific reward here, e.g., an extra scan.
                        // For now, the user can just proceed.
                    } else {
                        setFeedbackMessage('Iklan ditutup sebelum selesai.');
                        setFeedbackType('info');
                    }
                },
                onComplete: () => { // Or onReward
                    console.log('Monetag Rewarded Ad: Completed/Reward');
                    // This might be redundant if onClose handles rewardGranted, check Monetag docs.
                    // setIsAdLoadingOrShowing(false); // onClose should handle this
                    // setFeedbackMessage('Terima kasih! Reward diberikan.');
                    // setFeedbackType('success');
                },
                onError: (error: Error) => {
                    console.error('Monetag Rewarded Ad: Error', error);
                    setFeedbackMessage(`Gagal memuat iklan: ${error.message}`);
                    setFeedbackType('error');
                    setIsAdLoadingOrShowing(false);
                }
            }
        });
    } catch (e) {
        console.error("Error calling Monetag ad function:", e);
        setFeedbackMessage('Gagal menampilkan iklan.');
        setFeedbackType('error');
        setIsAdLoadingOrShowing(false);
    }
  }, [isAdLoadingOrShowing]);


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
    if (!supabaseUrl || !supabaseAnonKey) {
        setFeedbackMessage('Konfigurasi Supabase tidak lengkap. Tidak dapat mengambil profil.');
        setFeedbackType('error');
        setIsLoadingAuth(false);
        return; 
    }
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
        const profileData = data as Profile;
        setUserProfile(profileData);
        checkProStatus(profileData);
        const today = new Date().toISOString().split('T')[0];
        let currentScans = profileData.daily_scan_count || 0;
        if (profileData.last_scan_date !== today) {
          currentScans = 0;
          supabase.from('profiles').update({ daily_scan_count: 0, last_scan_date: today }).eq('id', userId)
          .then(({ error: updateError }) => {
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

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
        setFeedbackMessage('Konfigurasi Supabase tidak lengkap. Fitur autentikasi dinonaktifkan.');
        setFeedbackType('error');
        setIsLoadingAuth(false);
        return;
    }

    const getInitialSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setFeedbackMessage('Gagal mendapatkan sesi autentikasi.');
        setFeedbackType('error');
        setIsLoadingAuth(false);
        return;
      }
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setIsLoadingAuth(false);
        if(!feedbackMessage.startsWith('Gagal') && !feedbackMessage.startsWith('Silakan login')) {
          setFeedbackMessage('Silakan login untuk menggunakan fitur Scanner Pro.');
          setFeedbackType('warning');
        }
      }
    };
    getInitialSession();

    const authResponse = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          try {
            await fetchUserProfile(session.user.id);
          } catch (profileError) {
            console.error("Error fetching profile on auth state change:", profileError);
            setFeedbackMessage('Gagal memuat profil setelah perubahan status login.');
            setFeedbackType('error');
            setUserProfile(null);
            setIsProMode(false);
            setProExpiryDate(null);
          }
        } else {
          setUserProfile(null);
          setIsProMode(false);
          setProExpiryDate(null);
          setIsLoadingAuth(false);
        }
      }
    ) as { data: { subscription: SupabaseSubscription | null }; error: AuthError | null };

    const { data: listenerSubscriptionData, error: authListenerSetupError } = authResponse;

    if (authListenerSetupError) {
      console.error("Error setting up onAuthStateChange listener:", authListenerSetupError);
      setFeedbackMessage('Gagal memantau status autentikasi.');
      setFeedbackType('error');
      setIsLoadingAuth(false);
    }

    authSubscriptionRef.current = listenerSubscriptionData?.subscription ?? null;

    return () => {
      authSubscriptionRef.current?.unsubscribe();
    };
  }, [fetchUserProfile, feedbackMessage]);

  useEffect(() => {
    const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-xxxxxxxxxxxxxxx";
    if (!midtransClientKey || midtransClientKey === 'YOUR_MIDTRANS_CLIENT_KEY_PLACEHOLDER' || midtransClientKey === "SB-Mid-client-xxxxxxxxxxxxxxx") {
      console.warn('Midtrans client key not set or is placeholder. Midtrans payments will not work.');
      return;
    }
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute('data-client-key', midtransClientKey);
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => {};
    script.onerror = () => {
        console.error("Failed to load Midtrans Snap.js.");
        setFeedbackMessage('Gagal memuat skrip pembayaran. Fitur pembayaran mungkin tidak tersedia.');
        setFeedbackType('error');
    };
    return () => {
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
          try {
            document.head.removeChild(existingScript);
          } catch (e) {
            console.warn("Could not remove Midtrans script on cleanup:", e);
          }
      }
    };
  }, []);

   useEffect(() => {
     if( !supabaseUrl || !supabaseAnonKey) return;

     if (isLoadingAuth) {
         setFeedbackMessage('Memeriksa status autentikasi');
         setFeedbackType('info');
     } else if (supabaseUser) {
         if (isProMode) {
             setFeedbackMessage(`Akses Pro aktif hingga ${proExpiryDate}. Fitur siap digunakan.`);
             setFeedbackType('success');
         } else if (feedbackMessage.includes('memuat fitur') || feedbackMessage.includes('Memeriksa status') || feedbackMessage.startsWith('Sedang memuat')) {
             setFeedbackMessage('Anda menggunakan mode gratis');
             setFeedbackType('info');
         }
     } else if (!supabaseUser && !isLoadingAuth){
       if (!feedbackMessage.startsWith('Gagal') && !feedbackMessage.startsWith('Silakan login')) {
         setFeedbackMessage('Silakan login untuk menggunakan scanner atau upgrade ke Pro.');
         setFeedbackType('warning');
       }
     }
   }, [isProMode, proExpiryDate, supabaseUser, isLoadingAuth, feedbackMessage]); 


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
    let mimeType: string = imageFile.type;

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
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
          console.error('Error getting Supabase session or token:', sessionError);
          setFeedbackMessage('Gagal mendapatkan token otorisasi. Silakan login ulang.');
          setFeedbackType('error');
          setIsScanningActive(false);
          return;
      }
      const authToken = sessionData.session.access_token;

      const response = await fetch('/api/llm/gemini/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
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
        if (!isProMode && supabaseUser && supabaseUrl && supabaseAnonKey) {
          const newCount = dailyScanCount + 1;
          setDailyScanCount(newCount);
          const today = new Date().toISOString().split('T')[0];
          supabase.from('profiles')
            .update({ daily_scan_count: newCount, last_scan_date: today })
            .eq('id', supabaseUser.id)
            .then(({ error: updateError }) => {
              if (updateError) console.error('Error incrementing scan count:', updateError);
            });
        }
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
  }, [dailyScanCount, isProMode, supabaseUser, convertFileToBase64]); 

  const closeCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  }, []);

  const openCamera = useCallback(async () => {
    if (!videoRef.current) {
      const msg = 'Komponen video belum siap. Coba lagi sesaat.';
      setFeedbackMessage(msg); setCameraError(msg); setShowCameraErrorModal(true); setIsCameraOpen(false); return;
    }
    if (isScanningActive || isCameraOpen) return;
    setIsScanningActive(true);
    setFeedbackMessage('Mengakses kamera...'); setFeedbackType('info');
    setCameraError(null); setShowCameraErrorModal(false);
    if (imagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null); setUploadedImage(null);

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
                setIsCameraOpen(true); setIsScanningActive(false);
                setFeedbackMessage('Kamera aktif. Arahkan & ambil foto.');
            }).catch(err => {
                const errorMessage = err instanceof Error ? err.message : String(err);
                const finalMessage = `Gagal memulai stream video: ${errorMessage}`;
                setCameraError(finalMessage); setFeedbackMessage(finalMessage); setFeedbackType('error');
                setShowCameraErrorModal(true); stream.getTracks().forEach(track => track.stop());
                setIsCameraOpen(false); setIsScanningActive(false);
            });
          };
        } else {
            stream.getTracks().forEach(track => track.stop()); setIsScanningActive(false);
            const msg = 'Gagal menginisialisasi video. Ref tidak ditemukan.';
            setFeedbackMessage(msg); setCameraError(msg); setShowCameraErrorModal(true); setFeedbackType('error');
        }
      } catch (err: unknown) {
        let message = 'Gagal akses kamera.';
        const errorName = err instanceof Error ? err.name : undefined;
        const errorMessageText = err instanceof Error ? err.message : String(err);
        if (errorName === "NotAllowedError") message = 'Akses kamera ditolak. Mohon izinkan di pengaturan browser Anda.';
        else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") message = 'Kamera tidak ditemukan. Pastikan kamera terhubung.';
        else if (errorName === "NotReadableError" || errorName === "TrackStartError") message = 'Kamera sedang digunakan atau bermasalah. Coba tutup aplikasi lain yang mungkin menggunakan kamera.';
        else message = `Gagal kamera: ${errorName || errorMessageText}`;
        setCameraError(message); setFeedbackMessage(message); setFeedbackType('error');
        setShowCameraErrorModal(true); setIsCameraOpen(false); setIsScanningActive(false);
      }
    } else {
      const msg = 'Fitur kamera tidak didukung di browser atau perangkat ini.';
      setFeedbackMessage(msg); setFeedbackType('error');
      setCameraError(msg); setShowCameraErrorModal(true);
      setIsCameraOpen(false); setIsScanningActive(false);
    }
  }, [isScanningActive, isCameraOpen, imagePreviewUrl]);

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
    
    setScanResults(''); // Clear previous results
    
    if (!isProMode && supabaseUser && supabaseUrl && supabaseAnonKey && !isErrorResult) {
        // Only show ad if it was a successful scan and user is free
        if (REWARDED_INTERSTITIAL_ZONE_ID) {
            handleShowRewardedAd();
        } else {
            setFeedbackMessage('Hasil analisis ditutup.'); 
            setFeedbackType('info');
        }
    } else if (isErrorResult) {
        setFeedbackMessage('Analisis gagal. Silakan coba lagi atau unggah gambar lain.');
        setFeedbackType('warning');
    } else {
        setFeedbackMessage('Hasil analisis ditutup.'); 
        setFeedbackType('info');
    }
  };

  const handleActualScanOrOpenCamera = async () => {
    if (!supabaseUser && (supabaseUrl && supabaseAnonKey)) {
        setFeedbackMessage('Anda harus login untuk menggunakan fitur ini.');
        setFeedbackType('warning');
        return;
    }
    if (uploadedImage) await performGeminiScanViaBackend(uploadedImage);
    else await openCamera();
  };

  const handleMainScanClick = async () => {
    if (isScanningActive || isCameraOpen) return;
    if (!supabaseUser && supabaseUrl && supabaseAnonKey) { 
      setFeedbackMessage('Silakan login untuk menggunakan fitur ini.'); setFeedbackType('warning'); return;
    } else if (!supabaseUrl || !supabaseAnonKey) { 
      setFeedbackMessage('Layanan tidak tersedia (konfigurasi backend hilang).'); setFeedbackType('error'); return;
    }

    if (isProMode) {
      await handleActualScanOrOpenCamera();
    } else {
      if (dailyScanCount < FREE_SCAN_LIMIT) {
         setShowUpgradeModal(true); 
      } else {
        setFeedbackMessage(`Limit scan harian gratis (${FREE_SCAN_LIMIT}) telah tercapai. Silakan upgrade ke Pro.`);
        setFeedbackType('warning');
        setShowUpgradeModal(true); 
      }
    }
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
    if (uploadedImage) return isProMode ? 'Pindai Gambar (Pro)' : 'Pindai Gambar';
    return isProMode ? 'Buka Kamera (Pro)' : 'Buka Kamera';
  };
  
  const mainButtonDisabled = isScanningActive || isAdLoadingOrShowing; 

  const handlePurchase = async (planKey: PaymentPlanKey) => {
    if (!supabaseUser && supabaseUrl && supabaseAnonKey) { 
      setFeedbackMessage('Silakan login untuk melakukan pembelian.'); setFeedbackType('warning'); return;
    } else if (!supabaseUrl || !supabaseAnonKey) { 
        setFeedbackMessage('Layanan pembayaran tidak tersedia (konfigurasi backend hilang).'); setFeedbackType('error'); return;
    }

    const snap = (window as SnapWindow).snap;
    if (!snap) {
      setFeedbackMessage('Layanan pembayaran belum siap. Mohon tunggu atau coba muat ulang halaman.'); setFeedbackType('error'); return;
    }
    const selectedPlan = paymentPlans[planKey];
    setIsLoadingPurchase(planKey);
    setFeedbackMessage(`Memproses ${selectedPlan.name}...`); setFeedbackType('info');

    try {
      console.log("Attempting to call /api/payment/midtrans/charge (currently mocked) for plan:", selectedPlan.midtransPlanId, "User:", supabaseUser?.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      const mockMidtransToken = `mock-token-${selectedPlan.midtransPlanId}-${Date.now()}`;
      const data = { token: mockMidtransToken, order_id: `mock-order-${Date.now()}` }; 

      snap.pay(data.token, {
        onSuccess: function (result: SnapSuccessResult) {
          setFeedbackMessage(`Pembayaran ${selectedPlan.name} berhasil! ID Pesanan: ${result.order_id}`); setFeedbackType('success');
          if (supabaseUser && supabaseUrl && supabaseAnonKey) { 
            const expiry = new Date();
            if (selectedPlan.id === 'trial') expiry.setDate(expiry.getDate() + 7);
            else if (selectedPlan.id === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
            else if (selectedPlan.id === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
            
            const updatedProfileData = {
                id: userProfile?.id || supabaseUser.id, 
                telegram_id: userProfile?.telegram_id,
                telegram_username: userProfile?.telegram_username,
                pro_plan_id_midtrans: selectedPlan.midtransPlanId, 
                pro_expiry_midtrans: expiry.toISOString(),
                pro_plan_id_telegram: userProfile?.pro_plan_id_telegram, 
                pro_expiry_telegram: userProfile?.pro_expiry_telegram,
                daily_scan_count: userProfile?.daily_scan_count || 0,
                last_scan_date: userProfile?.last_scan_date || new Date().toISOString().split('T')[0],
            } as Profile; 
            
            setUserProfile(updatedProfileData); 
            checkProStatus(updatedProfileData); 

             if (supabaseUrl && supabaseAnonKey) { 
                supabase.from('profiles')
                    .update({ 
                        pro_plan_id_midtrans: selectedPlan.midtransPlanId, 
                        pro_expiry_midtrans: expiry.toISOString() 
                    })
                    .eq('id', supabaseUser.id)
                    .then(({ error: updateError }) => {
                        if (updateError) {
                            console.error('Gagal update profil setelah pembayaran (Midtrans):', updateError);
                            setFeedbackMessage('Pembayaran berhasil, namun gagal update status Pro di server. Mohon kontak dukungan.');
                                setFeedbackType('warning'); 
                        } else {
                            console.log("Profil Supabase diupdate setelah pembayaran Midtrans.");
                        }
                    });
            }
          }
          setShowUpgradeModal(false); setIsLoadingPurchase(null);
        },
        onPending: function (result: SnapPendingResult) {
          setFeedbackMessage(`Pembayaran ${selectedPlan.name} tertunda. ID Pesanan: ${result.order_id}`); setFeedbackType('warning');
          setIsLoadingPurchase(null); 
        },
        onError: function (result: SnapErrorResult) {
          const errorMessages = Array.isArray(result.status_message) ? result.status_message.join(", ") : String(result.status_message);
          setFeedbackMessage(`Pembayaran ${selectedPlan.name} gagal: ${errorMessages}.`); setFeedbackType('error');
          setIsLoadingPurchase(null); 
        },
        onClose: function () {
          if (isLoadingPurchase === planKey){ 
            if (feedbackType !== 'success' && feedbackType !== 'warning' && feedbackType !== 'error') {
                 setFeedbackMessage('Popup pembayaran ditutup sebelum selesai.'); setFeedbackType('info');
            }
            setIsLoadingPurchase(null); 
          }
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setFeedbackMessage(`Gagal memulai pembayaran: ${message}`); setFeedbackType('error');
      setIsLoadingPurchase(null); 
    }
  };
  
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
                        // Skip
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

        {/* Upgrade Modal */}
        {showUpgradeModal && supabaseUser && !isProMode && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[102] p-4 backdrop-blur-md">
                <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
                    <div className="p-6 text-center border-b border-border">
                        <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
                        <h2 className="text-2xl font-semibold text-foreground">Upgrade ke Scanner Pro+</h2>
                        <p className="text-sm text-muted-foreground mt-1">Nikmati fitur penuh, tanpa batas scan harian, dan bebas iklan!</p>
                    </div>
                    <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar-dark">
                        {(Object.keys(paymentPlans) as PaymentPlanKey[]).map((planKey) => {
                            const plan = paymentPlans[planKey];
                            const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "YOUR_BOT_USERNAME";
                            const telegramDeepLink = `https://t.me/${botUsername}?start=subscribe_${plan.telegramPlanId}`;
                            const isLoadingThisPlan = isLoadingPurchase === planKey;
                            return (
                                <div key={plan.id} className="p-4 border border-border rounded-lg bg-background/40 shadow-sm hover:border-primary/50 transition-colors">
                                    <h3 className="text-lg font-semibold text-primary">{plan.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-1">{plan.duration} - {plan.features.join(', ')}</p>
                                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                                        <button onClick={() => handlePurchase(planKey)} disabled={isLoadingThisPlan || (isLoadingPurchase !== null && isLoadingPurchase !== planKey)} className={`btn-primary flex-1 text-sm ${isLoadingThisPlan ? 'opacity-70 cursor-wait' : ''}`}>
                                            {isLoadingThisPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                                            Bayar Rp {plan.midtransPrice.toLocaleString('id-ID')} (Web)
                                        </button>
                                        <a href={telegramDeepLink} target="_blank" rel="noopener noreferrer" className={`btn-secondary flex-1 text-sm bg-sky-500 hover:bg-sky-600 text-white ${(isLoadingPurchase !== null) ? 'opacity-70 pointer-events-none cursor-not-allowed' : ''}`} onClick={(e) => { if(isLoadingPurchase !== null) e.preventDefault(); }}>
                                            <Star className="mr-2 h-4 w-4" /> Bayar {plan.telegramStars} Stars (TG)
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="p-6 border-t border-border space-y-3">
                        {dailyScanCount < FREE_SCAN_LIMIT && (
                             <button onClick={async () => { setShowUpgradeModal(false); if (dailyScanCount < FREE_SCAN_LIMIT) await handleActualScanOrOpenCamera(); else { setFeedbackMessage(`Limit scan harian (${FREE_SCAN_LIMIT}) tercapai.`); setFeedbackType('warning');}}}
                                className="w-full btn-neutral text-sm" disabled={isLoadingPurchase !== null || isScanningActive || isAdLoadingOrShowing}>
                                Lanjutkan Gratis ({FREE_SCAN_LIMIT - dailyScanCount} scan tersisa)
                            </button>
                        )}
                        {dailyScanCount >= FREE_SCAN_LIMIT && (
                             <p className="text-xs text-yellow-500 text-center">Limit scan harian gratis Anda telah habis.</p>
                        )}
                        <button onClick={() => setShowUpgradeModal(false)} className="w-full btn-outline text-sm" disabled={isLoadingPurchase !== null || isAdLoadingOrShowing }>
                            Tutup
                        </button>
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
                      <button onClick={takePhoto} disabled={!videoRef.current?.srcObject || isScanningActive || isAdLoadingOrShowing} className="btn-primary btn-sm bg-opacity-80 backdrop-blur-sm hover:bg-opacity-100">
                        <Camera className="w-5 h-5 mr-2" />Ambil Foto
                      </button>
                      <button onClick={closeCamera} disabled={isScanningActive || isAdLoadingOrShowing} className="btn-icon bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm" aria-label="Tutup Kamera">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </>
              ) : imagePreviewUrl ? (
                  <Image
                    src={imagePreviewUrl}
                    alt="Pratinjau Gambar"
                    fill
                    style={{ objectFit: 'contain' }}
                    className="rounded-xl" 
                    unoptimized={true} 
                  />
              ) : (
                <div className="text-center p-4 select-none">
                  <Camera className={`h-16 w-16 mb-3 transition-colors ${isScanningActive || isAdLoadingOrShowing ? 'text-primary opacity-40' : 'text-muted-foreground opacity-70'}`} />
                  <p className="text-sm text-muted-foreground">Klik &quot;{mainButtonText()}&quot; di bawah, atau unggah gambar.</p>
                </div>
              )}
              {!isCameraOpen && !imagePreviewUrl && !isScanningActive && (
                  <> <div className={`corner top-left ${isProMode ? 'border-primary/70' : 'border-border/70'}`}></div> <div className={`corner top-right ${isProMode ? 'border-primary/70' : 'border-border/70'}`}></div> <div className={`corner bottom-left ${isProMode ? 'border-primary/70' : 'border-border/70'}`}></div> <div className={`corner bottom-right ${isProMode ? 'border-primary/70' : 'border-border/70'}`}></div> </>
              )}
              {imagePreviewUrl && !isScanningActive && !isCameraOpen && (
                <button onClick={handleRemoveImage} disabled={isAdLoadingOrShowing} className="absolute top-2 right-2 btn-icon bg-black/60 hover:bg-black/80 text-white z-20" aria-label="Buang gambar"><XCircle className="w-5 h-5" /></button>
              )}
              {(isScanningActive || isAdLoadingOrShowing) && (<div className="absolute inset-0 bg-black/30 flex-center z-10 backdrop-blur-sm rounded-xl"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>)}
              <canvas ref={canvasRef} className="hidden" aria-hidden="true"></canvas>
            </div>
          </div>
          <div className="px-5 sm:px-6 pb-3 sm:pb-4 space-y-3 bg-card">
            <button onClick={handleMainScanClick} disabled={mainButtonDisabled || isCameraOpen || isAdLoadingOrShowing} className={`w-full btn-primary text-base sm:text-lg ${(mainButtonDisabled || isCameraOpen || isAdLoadingOrShowing) ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {(isScanningActive && !isCameraOpen) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} {mainButtonText()}
            </button>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} id="imageUploadInputScannerPage" aria-label="Unggah gambar"/>
            <button onClick={() => { if (isCameraOpen) closeCamera(); fileInputRef.current?.click(); }} disabled={mainButtonDisabled || isCameraOpen || isAdLoadingOrShowing} className={`w-full btn-neutral text-sm sm:text-base ${(mainButtonDisabled || isCameraOpen || isAdLoadingOrShowing) ? 'opacity-60 cursor-not-allowed' : ''}`}>
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
        
        {/* Footer remains unchanged */}
        <footer className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            {(!supabaseUrl || !supabaseAnonKey) ? "Layanan Supabase tidak terkonfigurasi." :
              (isProMode && proExpiryDate ? `Mode Pro aktif hingga ${proExpiryDate}.` :
                (supabaseUser ? `Mode Gratis: ${dailyScanCount}/${FREE_SCAN_LIMIT} scan hari ini. ${dailyScanCount >= FREE_SCAN_LIMIT ? 'Limit tercapai.' : ''}` :
                  (isLoadingAuth ? 'Memuat status...' : 'Silakan login untuk memulai.')
                ))
            }
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
          .btn-outline:hover:not(:disabled) { background-color: hsl(var(--muted-foreground) / 0.1); border-color: hsl(var(--muted-foreground) / 0.3); }

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
