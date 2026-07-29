export function formatKeyLabels(keys: string[], isMac: boolean): string[] {
  return keys.map((key) => {
    const lower = key.toLowerCase();
    if (lower === 'mod') return isMac ? '\u2318' : 'Ctrl';
    if (lower === 'shift') return isMac ? '\u21E7' : 'Shift';
    if (lower === 'alt') return isMac ? '\u2325' : 'Alt';
    if (lower === 'escape') return isMac ? '\u238B' : 'Esc';
    if (lower === 'enter') return '\u21B5';
    return key.length === 1 ? key.toUpperCase() : key;
  }); 
}

export function shortcutAriaLabel(keys: string[], isMac: boolean): string {
  return keys
    .map((key) => {
      const lower = key.toLowerCase();
      if (lower === 'mod') return isMac ? 'Command' : 'Control';
      if (lower === 'shift') return 'Shift';
      if (lower === 'alt') return isMac ? 'Option' : 'Alt';
      if (lower === 'escape') return 'Escape';
      if (lower === 'enter') return 'Enter';
      return key.toUpperCase();
    })
    .join(' ');
}
