  /**
   * Initializes the application and configures its dependencies.
   */
  export async function init(
    options = {
      debug: false,
      eruda: false,
    },
  ): Promise<void> {
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
  }
