# Task 003 - TV Remote Navigation

Run only after the TV UI is accepted.

Use the `$product-first-delivery` skill.

## Product outcome

A user can navigate the existing TV interface with a physical/emulated TV remote without a mouse or touch input.

## Initial behavior

- directional buttons move focus predictably;
- OK activates/selects the focused item;
- Back returns/closes the active overlay or navigation state;
- focused item is always visually obvious;
- channel Up/Down events may be mapped when exposed by the target platform.

Implement against the existing UI. Do not redesign the screen and do not build a generalized navigation engine unless the platform requires it.

## Acceptance criteria

Demonstrate one complete remote-only flow on Android TV/Google TV emulator or device.
