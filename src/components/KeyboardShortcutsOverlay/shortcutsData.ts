export interface Shortcut {
  label: string;
  keys: string[];
}

export interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

export const KEYBOARD_SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { label: 'Go to Home', keys: ['mod', 'shift', 'h'] },
      { label: 'Go to Dashboard', keys: ['mod', 'shift', 'd'] },
      { label: 'Go to Investor Portal', keys: ['mod', 'shift', 'i'] },
      { label: 'Go to Report Revenue', keys: ['mod', 'shift', 'r'] },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { label: 'Toggle keyboard shortcuts', keys: ['?'] },
      { label: 'Toggle notifications', keys: ['n'] },
    ],
  },
  {
    title: 'Revenue Calendar',
    shortcuts: [
      { label: 'Move focus right', keys: ['ArrowRight'] },
      { label: 'Move focus left', keys: ['ArrowLeft'] },
      { label: 'Move focus up', keys: ['ArrowUp'] },
      { label: 'Move focus down', keys: ['ArrowDown'] },
      { label: 'Go to start of week row', keys: ['Home'] },
      { label: 'Go to end of week row', keys: ['End'] },
      { label: 'Previous month', keys: ['PageUp'] },
      { label: 'Next month', keys: ['PageDown'] },
      { label: 'Select focused day', keys: ['Enter'] },
      { label: 'Jump to today', keys: ['T'] },
      { label: 'Show/hide shortcuts', keys: ['?'] },
    ],
  },
];
