/**
 * Central color tokens for the OOP Exam Grading System frontend.
 * Use these constants instead of hardcoding hex values in CSS/JS.
 *
 * Usage:
 *   import { COLORS } from '../constants/colors';
 *   style={{ backgroundColor: COLORS.primary }}
 *
 * In CSS (via CSS variables or by referencing in JS):
 *   Use the same values from this file when defining --color-* in :root or component styles.
 *
 * @see docs/color-usage-report.md for where each color is used in the project.
 */

/** Brand orange — primary actions, links, highlights */
export const COLORS = {
  // --- Brand ---
  /** Primary orange — buttons, links, accents. Used in Login, Register, Reset Password, AuthLayout */
  primary: '#f27125',
  /** Darker orange — hover/active states for primary buttons */
  primaryHover: '#d75608',
  /** Orange for selected menu item text (MainLayout sidebar) */
  primarySelected: '#F37021',
  /** Light orange background for selected menu item (MainLayout sidebar) */
  primarySelectedBg: '#FFF4EE',
  /** Legacy sider orange (currently unused; sider is white). Keep for reference. */
  siderOrange: '#f37924',

  // --- Neutrals (text & surfaces) ---
  /** Pure white — page/section backgrounds, header, sider */
  white: '#ffffff',
  /** Pure black — main content area background in MainLayout */
  black: '#000000',
  /** Darkest text — headings, primary content (e.g. auth titles) */
  textPrimary: '#1a1a1a',
  /** Secondary heading/label text */
  textSecondary: '#2d2d2d',
  /** Muted text — descriptions, captions */
  textMuted: '#5c5c5c',
  /** Placeholder and disabled text */
  textPlaceholder: '#8c8c8c',
  /** Default icon/menu color (Ant Design menu items, sidebar icons) */
  iconDefault: '#64748B',

  // --- Borders & dividers ---
  /** Default input/border */
  border: '#e0e0e0',
  /** Focused or darker border */
  borderFocus: '#d0d0d0',
  /** Layout divider (e.g. AuthLayout right panel border) */
  borderDivider: '#e8e8e8',

  // --- Semantic (optional) ---
  /** Use for text on primary background (e.g. button label) */
  onPrimary: '#ffffff',
};

/**
 * Convenience groups for documentation and theming.
 * Not meant to replace COLORS; use COLORS for actual values.
 */
export const COLOR_GROUPS = {
  brand: ['primary', 'primaryHover', 'primarySelected', 'primarySelectedBg', 'siderOrange'],
  text: ['textPrimary', 'textSecondary', 'textMuted', 'textPlaceholder', 'iconDefault'],
  surfaces: ['white', 'black'],
  borders: ['border', 'borderFocus', 'borderDivider'],
};

export default COLORS;
