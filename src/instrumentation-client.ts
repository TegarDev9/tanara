import { init } from './core/init';
import { mockEnv } from './mocEnv';

mockEnv().then(() => {
  try {
    const debug = process.env.NODE_ENV === 'development';

    // Configure all application dependencies.
    init({
      debug,
      eruda: false, // No longer relevant without Telegram environment
    });
  } catch (e) {
    console.log(e);
  }
});
