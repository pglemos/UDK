# UDK Cyan Brand Theme

## Objective

Align the unified UDK website with the cyan used across current uniforms, karting materials and campaign assets, replacing the retired lime-green digital accent without weakening accessibility or semantic status colors.

## Approved palette

- Graphite base: `#1C191F`
- Electric cyan accent: `#00D9FF`
- Cyan hover: `#32E5FF`
- Deep cyan for text and borders on light surfaces: `#00687A`
- Dark cyan glow: `#004653`
- White: `#FFFFFF`
- Alert red remains semantic and is not recolored.
- Success green remains semantic and is not used as a brand accent.

## Application rules

The cyan accent is applied to primary actions, active navigation, loading indicators, highlights, focus rings, decorative gradients and interactive icons. Deep cyan is used where bright cyan would fail contrast on white. Graphite remains the dominant structural color so the interface stays premium rather than becoming a fluorescent aquarium.

## Accessibility

Primary cyan against graphite exceeds WCAG AA contrast for normal text. Deep cyan against white also exceeds WCAG AA. Keyboard focus receives a visible three-pixel cyan outline with offset.

## Regression protection

Automated tests reject the retired `--lime` tokens, the old lime hexadecimal values and their hard-coded RGB derivatives. The same tests verify the approved tokens and contrast ratios.
