import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';

// Native touches that make the app feel native. Each one is a no-op where unsupported
// (e.g. haptics on desktop browsers), so callers never need to check the platform.

const ignoreUnsupported = () => undefined;

/** A light tap, for buttons that navigate or open something */
export const tapFeedback = () => Haptics.impact({ style: ImpactStyle.Light }).catch(ignoreUnsupported);

/** A success pattern, after a write the server confirmed */
export const successFeedback = () => Haptics.notification({ type: NotificationType.Success }).catch(ignoreUnsupported);

/** Native app: light status bar text on the app's blue, matching the toolbars */
export const setUpStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await StatusBar.setStyle({ style: Style.Dark }).catch(ignoreUnsupported);
  if (Capacitor.getPlatform() === 'android') {
    await StatusBar.setBackgroundColor({ color: '#2f6fd0' }).catch(ignoreUnsupported);
  }
};

export type ShareResult = 'shared' | 'copied' | 'cancelled';

/**
 * Opens the system share sheet (native app, or browsers with the Web Share API).
 * Elsewhere, copies the text to the clipboard so the action still does something useful.
 */
export const shareText = async (title: string, text: string): Promise<ShareResult> => {
  const { value: canShare } = await Share.canShare().catch(() => ({ value: false }));
  if (canShare) {
    try {
      await Share.share({ title, text, dialogTitle: title });
      return 'shared';
    } catch {
      // The user closed the share sheet
      return 'cancelled';
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
};
