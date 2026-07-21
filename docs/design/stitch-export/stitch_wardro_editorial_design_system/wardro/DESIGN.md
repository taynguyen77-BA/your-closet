---
name: Wardro
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4d463e'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7e766d'
  outline-variant: '#cfc5bb'
  surface-tint: '#695c4f'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#231a0f'
  on-primary-container: '#908273'
  inverse-primary: '#d4c4b3'
  secondary: '#705b3e'
  on-secondary: '#ffffff'
  secondary-container: '#f9dbb7'
  on-secondary-container: '#755f42'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1c1a'
  on-tertiary-container: '#858480'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f1e0ce'
  primary-fixed-dim: '#d4c4b3'
  on-primary-fixed: '#231a0f'
  on-primary-fixed-variant: '#504538'
  secondary-fixed: '#fcdeba'
  secondary-fixed-dim: '#dfc29f'
  on-secondary-fixed: '#281903'
  on-secondary-fixed-variant: '#574329'
  tertiary-fixed: '#e5e2de'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1c1c1a'
  on-tertiary-fixed-variant: '#474744'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: DM Serif Display
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: DM Serif Display
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: DM Serif Display
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-sm:
    fontFamily: DM Serif Display
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system embodies a **Soft-luxury Editorial** aesthetic, positioning the product as a sophisticated personal fashion operating system. It balances the warmth of high-end Vietnamese lifestyle curation with the precision of AI-driven technology.

The visual direction is **photography-forward**, treating user-uploaded wardrobe items and AI outfit generations as editorial spreads. The style is characterized by:
- **Minimalism:** Massive white space and "Linen" negative space to allow clothing colors to breathe.
- **Modern Editorial:** High-contrast serif typography paired with utilitarian sans-serif UI chrome.
- **Refinement:** A rejection of digital-native trends like gradients or heavy shadows in favor of tactile, paper-like layouts.

The target audience is the fashion-conscious Vietnamese youth who appreciate premium, "slow-fashion" aesthetics but require high-speed digital utility.

## Colors
This design system utilizes a palette inspired by natural fibers and classic tailoring to evoke a sense of timelessness.

- **Espresso (#1A1208):** Used for primary typography, icons, and high-emphasis interaction states (Primary Buttons). It acts as the "ink" of the system.
- **Sand (#D4B896):** An accent reserved for highlighting background areas, selected states, or subtle iconography. It should never be used for long-form text to ensure accessibility.
- **Linen (#F7F4F0):** The foundational canvas color. It provides a softer, more premium feel than pure white, reducing eye strain and mimicking luxury stationery.
- **White (#FFFFFF):** Reserved specifically for card surfaces and floating modals to create a subtle lift from the Linen background.

## Typography
The typography strategy creates a clear distinction between **Editorial Content** (DM Serif Display) and **Functional Interface** (DM Sans).

- **Serif Usage:** Titles, section headers, and "Fashion Stories" use DM Serif Display. This captures the Vietnamese literary and editorial spirit.
- **Sans-Serif Usage:** Body text, button labels, and system navigation use DM Sans for maximum legibility and a contemporary technical feel.
- **Hierarchy:** Use uppercase `label-md` for category headers and navigation items to provide a structured, "catalog" feel.
- **Language Support:** Ensure all weights are optimized for Vietnamese diacritics, preventing clipping in tight line heights.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to maintain the "magazine" structure, and a fluid 4-column system on mobile.

- **Generous Whitespace:** Spacing should feel intentional and "expensive." Use `stack-lg` (48px) between major sections to prevent a cluttered appearance.
- **The Photography Grid:** Wardrobe items should be displayed in a rhythmic grid with consistent `gutter` widths. Avoid masonry layouts; stick to structured, justified rows to maintain a premium feel.
- **Mobile Reflow:** On mobile, margins remain at `20px` to maximize the impact of clothing photography while keeping the Espresso-colored text away from screen edges.

## Elevation & Depth
In line with the minimalist-luxury aesthetic, this design system avoids the appearance of floating "software" layers. Depth is communicated through color and micro-borders rather than shadows.

- **Tonal Layering:** The primary method of elevation is placing White (#FFFFFF) cards on top of the Linen (#F7F4F0) background. This provides a clear but soft hierarchy.
- **Shadows:** Use only for high-priority floating elements (e.g., a "Create Outfit" FAB). Shadows must be limited to a 1-2px blur, Espresso color at 5-10% opacity. 
- **Outlines:** Use subtle 1px Espresso or Sand borders for input fields and non-filled buttons. This reinforces the "line-art" aesthetic of the icons.

## Shapes
Shapes are **Soft (0.25rem)** to maintain a balance between the structure of a high-end fashion catalog and the approachability of a modern app.

- **Standard Elements:** Buttons, inputs, and small cards use a 4px corner radius.
- **Large Containers:** Full-screen cards or "Lookbook" covers may use `rounded-lg` (8px) for a slightly gentler appearance.
- **Image Treatment:** Fashion photography should always have a matching 4px radius to feel integrated into the UI.

## Components
Consistent component styling ensures the interface remains a quiet background to the user's fashion content.

- **Buttons:** 
  - *Primary:* Espresso background, White text. No border.
  - *Secondary:* Transparent background, Espresso 1px border.
  - *Accent:* Sand background, Espresso text (for limited "new feature" or "sale" highlights).
- **Icons:** Use simple, light-weight line icons (1.5px stroke) in Espresso. Never use filled icons unless indicating a "selected" state.
- **Cards:** White background, 4px radius, 1px Espresso border at 5% opacity or no border at all if contrast with Linen is sufficient.
- **Inputs:** Underline-only or thin 1px border. Use DM Sans for input text. Label text should use `label-sm` in Espresso.
- **Chips/Tags:** Used for clothing attributes (e.g., "Lụa", "Mùa hè"). Use Sand background with Espresso text, pill-shaped.
- **Navigation:** A clean bottom bar on mobile with Espresso icons and no labels, or thin Espresso labels in `label-sm`.