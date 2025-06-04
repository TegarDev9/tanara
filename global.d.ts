// global.d.ts

// --- Definisi untuk TelegaIn SDK (REMOVED) ---
// interface TelegaAdInstance {
//   ad_show: (options: { adBlockUuid: string }) => void;
// }
// 
// interface TelegaInAdsController {
//   create_miniapp: (options: { token: string }) => TelegaAdInstance | null;
// }

// --- Definisi untuk Telegram WebApp ---
// Jika Anda menggunakan @twa-dev/sdk dan itu sudah menyediakan tipe global untuk window.Telegram.WebApp,
// Anda mungkin tidak memerlukan definisi WebAppUser, WebAppInitData, ThemeParams, dll., di bawah ini.
// Namun, jika error TypeScript masih muncul, definisi ini bisa membantu.

interface WebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface WebAppInitData {
  query_id?: string;
  user?: WebAppUser;
  receiver?: WebAppUser;
  chat?: {
    id: number;
    type: 'group' | 'supergroup' | 'channel';
    title: string;
    username?: string;
    photo_url?: string;
  };
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
}

interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string; // Ditambahkan berdasarkan dokumentasi umum
  accent_text_color?: string; // Ditambahkan berdasarkan dokumentasi umum
  section_bg_color?: string; // Ditambahkan berdasarkan dokumentasi umum
  section_header_text_color?: string; // Ditambahkan berdasarkan dokumentasi umum
  subtitle_text_color?: string; // Ditambahkan berdasarkan dokumentasi umum
  destructive_text_color?: string; // Ditambahkan berdasarkan dokumentasi umum
}

interface HapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

interface BackButton {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
}

interface MainButton {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (disable?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: {
        text?: string;
        color?: string;
        text_color?: string;
        is_active?: boolean;
        is_visible?: boolean;
    }) => void;
}

// Tipe status invoice berdasarkan penggunaan di scanner_page_code
type InvoiceStatus = 'paid' | 'failed' | 'pending' | 'cancelled' | string;

interface WebApp {
  initData: string;
  initDataUnsafe: WebAppInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: ThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: BackButton;
  MainButton: MainButton;
  HapticFeedback: HapticFeedback; // Sering digunakan, jadi disertakan

  // --- METODE YANG DIGUNAKAN DI SCANNER_PAGE_CODE ---
  showInvoice: (
    params: { payload: string },
    callback?: (status: InvoiceStatus) => void
  ) => void;

  // --- METODE UMUM LAINNYA (Tambahkan jika perlu) ---
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  sendData: (data: string) => void; // Biasanya string
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  // showAlert: (message: string, callback?: () => void) => void;
  // showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  // ... dan lainnya sesuai dokumentasi Telegram Web Apps
}

interface Telegram {
  WebApp?: WebApp; // WebApp bisa jadi undefined, sesuai penggunaan window.Telegram?.WebApp
}

// --- Augmentasi Global Window ---
declare global {
  interface Window {
    Telegram?: Telegram; // Telegram bisa jadi undefined
    // TelegaInController?: TelegaInAdsController; // REMOVED
    // TelegaIn?: { // REMOVED
    //   AdsController?: TelegaInAdsController;
    // };
  }
}

// Pastikan file ini diinterpretasikan sebagai module TypeScript
export {};
