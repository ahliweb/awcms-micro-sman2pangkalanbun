# Wave 1 Visual Identity Plan (#3)

## Objective

Establish a school-specific visual baseline that is consistent, responsive, and ready for content migration phases.

## Design Direction

- Identity tone: formal-academic, warm, trustworthy
- Primary palette direction:
  - Deep green for institutional anchors
  - Gold accents for highlights and calls-to-action
  - Neutral surfaces optimized for readability
- Typography:
  - Keep current system functional baseline for now
  - Introduce explicit heading/body hierarchy and spacing rhythm

## Baseline UI Surfaces (Phase 1)

- Global layout shell (`Base.astro`): header, navigation, footer, spacing rhythm
- Primary page templates:
  - Home
  - Listing/archive
  - Single content page
- States:
  - Hover/focus/active for navigation and buttons
  - Loading/skeleton direction for future data-heavy modules

## Responsive Targets

- Mobile: 360px to 767px
- Tablet: 768px to 1023px
- Desktop: 1024px+

## Accessibility Baseline

- Maintain color contrast suitable for text and action controls
- Keep focus-visible treatment clear on keyboard navigation
- Avoid visual patterns that rely only on color differences

## Dependencies

- Blocked by: #1 and #2 (completed)
- Parallel with: #22 (menu parity implementation)
- Unblocks: #17 frontend parity verification

## Planned Atomic Steps

1. Define CSS variable token set for school identity colors and spacing.
2. Apply tokens to header/footer/nav and key typography layers.
3. Validate desktop/mobile behavior in local run.
4. Record before/after verification notes and screenshots.
