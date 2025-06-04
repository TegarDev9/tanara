import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { init } from './core/init';
import { mockEnv } from './mocEnv';

mockEnv().then(() => {
  try {
    const launchParams = retrieveLaunchParams();
    const { tgWebAppPlatform: platform } = launchParams;
    const debug =
      (launchParams.tgWebAppStartParam || '').includes('debug') ||
      process.env.NODE_ENV === 'development';

    // Configure all application dependencies.
    init({
      debug,
      eruda: debug && ['ios', 'android'].includes(platform),
      mockForMacOS: platform === 'macos',
    });
  } catch (e) {
    console.log(e);
  }
});