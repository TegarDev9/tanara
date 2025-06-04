import {
    setDebug,
    mountBackButton,
    restoreInitData,
    init as initSDK,
    mountMiniAppSync,
    bindThemeParamsCssVars,
    mountViewport,
    bindViewportCssVars,
    mockTelegramEnv,
    type ThemeParams,
    themeParamsState,
    retrieveLaunchParams,
    emitEvent,
  } from '@telegram-apps/sdk-react';
  
  /**
   * Initializes the application and configures its dependencies.
   */
  export async function init(
    options = {
      debug: false,
      eruda: false,
      mockForMacOS: false,
    },
  ): Promise<void> {
    // Set @telegram-apps/sdk-react debug mode and initialize it.
    setDebug(options.debug);
    initSDK();
  
    // Add Eruda if needed.
    if (options.eruda) {
      void import('eruda').then(({ default: eruda }) => {
        eruda.init();
        // Pastikan window tersedia (kode ini biasanya untuk client-side)
        if (typeof window !== 'undefined') {
          eruda.position({ x: window.innerWidth - 50, y: 0 });
        }
      });
    }
    // Alternatif lain jika ingin tetap dengan short-circuit evaluation dan menonaktifkan rule:
    // // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    // options.eruda &&
    //   void import('eruda').then(({ default: eruda }) => {
    //     eruda.init();
    //     if (typeof window !== 'undefined') {
    //       eruda.position({ x: window.innerWidth - 50, y: 0 });
    //     }
    //   });
  
    // Telegram for macOS has a ton of bugs, including cases, when the client doesn't
    // even response to the "web_app_request_theme" method. It also generates an incorrect
    // event for the "web_app_request_safe_area" method.
    if (options.mockForMacOS) {
      let firstThemeSent = false;
      mockTelegramEnv({
        onEvent(event, next) {
          if (event[0] === 'web_app_request_theme') {
            let tp: ThemeParams = {};
            if (firstThemeSent) {
              tp = themeParamsState();
            } else {
              firstThemeSent = true;
              tp ||= retrieveLaunchParams().tgWebAppThemeParams;
            }
            return emitEvent('theme_changed', { theme_params: tp });
          }
  
          if (event[0] === 'web_app_request_safe_area') {
            return emitEvent('safe_area_changed', {
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            });
          }
  
          next();
        },
      });
    }
  
    // Mount all components used in the project.
    mountBackButton.ifAvailable();
    restoreInitData();
  
    if (mountMiniAppSync.isAvailable()) {
      mountMiniAppSync();
      bindThemeParamsCssVars();
    }
  
    if (mountViewport.isAvailable()) {
      mountViewport().then(() => {
        bindViewportCssVars();
      });
    }
  }