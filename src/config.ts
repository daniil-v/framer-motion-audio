/**
 * Feature Flag Configuration
 * -------------------------
 * Simple configuration to manage availability of different equalizer modes
 */

export interface FeatureFlags {
  elementMode: boolean;
  micMode: boolean;
  // Visualization modes
  equalizerViz: boolean;
  ripplesViz: boolean;
}

export const featureFlags: FeatureFlags = {
  // Enable/disable audio element mode
  elementMode: false,

  // Enable/disable microphone mode
  micMode: true,

  // Enable/disable visualization modes
  equalizerViz: true,
  ripplesViz: true,
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
 * Get available visualization modes based on feature flags
 */
export function getAvailableVizModes(): Array<'equalizer' | 'ripples'> {
  const modes: Array<'equalizer' | 'ripples'> = [];

  if (featureFlags.ripplesViz) {
    modes.push('ripples');
  }

  if (featureFlags.equalizerViz) {
    modes.push('equalizer');
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
 * Check if a specific visualization mode is enabled
 */
export function isVizModeEnabled(mode: 'equalizer' | 'ripples'): boolean {
  return mode === 'equalizer' ? featureFlags.equalizerViz : featureFlags.ripplesViz;
}

/**
 * Get the default mode (first available mode)
 */
export function getDefaultMode(): 'element' | 'mic' | null {
  const availableModes = getAvailableModes();
  return availableModes.length > 0 ? availableModes[0] : null;
}

/**
 * Get the default visualization mode (first available viz mode)
 */
export function getDefaultVizMode(): 'equalizer' | 'ripples' | null {
  const availableVizModes = getAvailableVizModes();
  return availableVizModes.length > 0 ? availableVizModes[0] : null;
}
