# Design Tokens

This directory stores the project's design token definitions for reference by all agents.

## Token Categories

### Colors
- Primary, Secondary, Accent, Muted, Destructive, Success, Warning, Info
- Background, Foreground, Border, Input, Ring
- Card, Popover

### Typography
- Font families
- Font sizes (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl, 9xl)
- Font weights (normal, medium, semibold, bold)
- Line heights (tight, normal, relaxed)

### Spacing
- Scale: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96

### Border Radius
- none, sm, default, md, lg, xl, 2xl, 3xl, full

### Shadows
- sm, default, md, lg, xl, 2xl, inner, none

## Token File Format

```json
{
  "token-name": {
    "value": "token-value",
    "type": "color|spacing|typography|border-radius|shadow",
    "description": "When to use this token"
  }
}
```
