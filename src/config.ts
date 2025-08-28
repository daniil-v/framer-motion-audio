/**
 * Feature Flag Configuration
 * -------------------------
 * Simple configuration to manage availability of different equalizer modes
 */

export interface FeatureFlags {
  elementMode: boolean;
  micMode: boolean;
}

export const featureFlags: FeatureFlags = {
  // Enable/disable audio element mode
  elementMode: false,

  // Enable/disable microphone mode
  micMode: true,
};

/**
 * Get available modes based on feature flags
 */
export function getAvailableModes(): Array<'element' | 'mic'> {
  const modes: Array<'element' | 'mic'> = [];

  if (featureFlags.elementMode) {
    modes.push('element');
  }

  if (featureFlags.micMode) {
    modes.push('mic');
  }

  return modes;
}

/**
 * Check if a specific mode is enabled
 */
export function isModeEnabled(mode: 'element' | 'mic'): boolean {
  return mode === 'element' ? featureFlags.elementMode : featureFlags.micMode;
}

/**
 * Get the default mode (first available mode)
 */
export function getDefaultMode(): 'element' | 'mic' | null {
  const availableModes = getAvailableModes();
  return availableModes.length > 0 ? availableModes[0] : null;
}
