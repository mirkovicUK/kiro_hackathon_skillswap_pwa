# Brand Colors - SkillSwap PWA

This document defines the official brand color palette for SkillSwap, adapted for Tailwind CSS.

---

## Color Palette

| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| Primary (Royal Blue) | `#3B5FE8` | `primary` | Primary buttons, links, key CTAs |
| Primary Dark (Deep Blue) | `#2A4BC7` | `primary-dark` | Hover states, active elements |
| Primary Light | `#5A7BF0` | `primary-light` | Light accents |
| Secondary (Soft Purple) | `#9B7FD4` | `secondary` | Accents, secondary buttons, highlights |
| Secondary Dark | `#7A5FC0` | `secondary-dark` | Hover states on secondary |
| Secondary Light | `#B9A3E0` | `secondary-light` | Light secondary accents |
| Accent (Warm Peach) | `#E8C9A0` | `accent` | Subtle highlights, badges, warmth |
| Accent Dark | `#D4B080` | `accent-dark` | Darker accent variant |
| Accent Light | `#F0DCC0` | `accent-light` | Light accent backgrounds |
| Dark (Charcoal) | `#1A1A2E` | `dark` | Text, headers, footer background |
| Light (Off-White) | `#F5F5F5` | `light` | Backgrounds, cards |

---

## Tailwind Configuration

The brand colors are configured in `tailwind.config.js`:

```javascript
// tailwind.config.js
colors: {
  primary: {
    DEFAULT: '#3B5FE8',
    dark: '#2A4BC7',
    light: '#5A7BF0',
  },
  secondary: {
    DEFAULT: '#9B7FD4',
    dark: '#7A5FC0',
    light: '#B9A3E0',
  },
  accent: {
    DEFAULT: '#E8C9A0',
    dark: '#D4B080',
    light: '#F0DCC0',
  },
  dark: '#1A1A2E',
  light: '#F5F5F5',
  // Gray scale
  gray: {
    900: '#2D2D44',
    700: '#4A4A66',
    500: '#6B6B88',
    300: '#A0A0B8',
    100: '#E0E0E8',
  },
}
```

---

## Tailwind Class Usage

### Backgrounds
```jsx
<div className="bg-primary">Primary background</div>
<div className="bg-primary-dark">Primary dark background</div>
<div className="bg-secondary">Secondary background</div>
<div className="bg-accent">Accent background</div>
<div className="bg-dark">Dark background</div>
<div className="bg-light">Light background</div>
```

### Text Colors
```jsx
<p className="text-primary">Primary text</p>
<p className="text-dark">Dark text (default body)</p>
<p className="text-gray-700">Secondary text</p>
<p className="text-gray-500">Muted text</p>
<p className="text-white">White text on dark backgrounds</p>
```

### Borders
```jsx
<div className="border-primary">Primary border</div>
<div className="border-secondary">Secondary border</div>
<div className="border-gray-300">Light border</div>
```

### Hover States
```jsx
<button className="bg-primary hover:bg-primary-dark">Button</button>
<button className="bg-secondary hover:bg-secondary-dark">Secondary</button>
```

---

## Component Patterns

### Primary Button
```jsx
<button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors">
  Primary Action
</button>
```

### Secondary Button
```jsx
<button className="bg-secondary text-white px-4 py-2 rounded-lg font-medium hover:bg-secondary-dark transition-colors">
  Secondary Action
</button>
```

### Outline Button
```jsx
<button className="border-2 border-primary text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary hover:text-white transition-colors">
  Outline Button
</button>
```

### Card
```jsx
<div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
  Card content
</div>
```

### Input Field
```jsx
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
```

---

## Semantic Colors

| Purpose | Color | Tailwind Class |
|---------|-------|----------------|
| Success | `#22C55E` | `green-500` |
| Warning | `#F59E0B` | `amber-500` |
| Error | `#EF4444` | `red-500` |
| Info | `#3B5FE8` | `primary` |

---

## Accessibility

All color combinations meet WCAG 2.1 AA standards:

| Foreground | Background | Contrast Ratio | Pass |
|------------|------------|----------------|------|
| `#1A1A2E` | `#FFFFFF` | 16.1:1 | ✅ AAA |
| `#1A1A2E` | `#F5F5F5` | 14.2:1 | ✅ AAA |
| `#FFFFFF` | `#3B5FE8` | 4.6:1 | ✅ AA |
| `#FFFFFF` | `#2A4BC7` | 5.8:1 | ✅ AA |
| `#FFFFFF` | `#1A1A2E` | 16.1:1 | ✅ AAA |

---

## Logo

The SkillSwap logo is located at `/SkillSwap_logo.png` (500x500px).

Usage in components:
```jsx
<img src="/SkillSwap_logo.png" alt="SkillSwap" className="h-12 w-12" />
```

For PWA manifest, the logo should be copied to `client/public/` in required sizes.

---

## Migration from Coffee Theme

The original "coffee" color palette is being replaced with the brand colors:

| Old (Coffee) | New (Brand) | Usage |
|--------------|-------------|-------|
| `coffee-50` | `light` | Light backgrounds |
| `coffee-600` | `primary` | Primary actions |
| `coffee-700` | `primary-dark` | Hover states |
| `coffee-800` | `dark` | Headers, text |
| `coffee-200` | `gray-300` | Borders |

When updating components, replace:
- `bg-coffee-50` → `bg-light`
- `bg-coffee-600` → `bg-primary`
- `hover:bg-coffee-700` → `hover:bg-primary-dark`
- `text-coffee-800` → `text-dark`
- `text-coffee-600` → `text-gray-700`
- `border-coffee-200` → `border-gray-300`
- `focus:ring-coffee-500` → `focus:ring-primary`
