/**
 * HapticButton — <button> wrapper that fires a haptic tick on activation.
 *
 * Why use it: every interactive element in the Whering shell ("Shuffle",
 * snap-to-skip, lock toggle, "Save Fit") should fire its impact style
 * inside an event-handler. Wrapping the button keeps the call-site at one
 * line and ensures `event.preventDefault()` runs before the haptic, which
 * matters when the underlying click would otherwise trigger an extra
 * synthetic event (Radix presence + native click).
 *
 * Design choices:
 * - Renders as <button type="button"> by default — form safe.
 * - All extra props pass through (className, aria-*, data-*, etc.).
 * - Disabled buttons don't fire haptics (consistency with web convention).
 * - Component name is `HapticButton` (HT-prefixed to match the lib
 *   naming convention; an alternate `HapticPress` aliased at the bottom
 *   keeps the Whering docs verbatim).
 */

import * as React from "react";
import { type Impact, tap } from "@/lib/haptics";

export interface HapticButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Impact style fired on activation. Defaults to "light". */
  haptic?: Impact;
  /**
   * If true, suppress haptic even on click. Useful when the parent is
   * staggering many taps and lays the haptic itself.
   */
  silent?: boolean;
}

export const HapticButton = React.forwardRef<HTMLButtonElement, HapticButtonProps>(
  function HapticButton(
    { onClick, haptic = "light", silent, type = "button", disabled, ...rest },
    ref
  ) {
    const handleClick: React.MouseEventHandler<HTMLButtonElement> =
      React.useCallback(
        (event) => {
          if (!silent && !disabled) tap(haptic);
          onClick?.(event);
        },
        [onClick, haptic, silent, disabled]
      );

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={handleClick}
        {...rest}
      />
    );
  }
);

/** Alias matching the Whering IMPLEMENTATION.MD naming: <HapticPress />. */
export const HapticPress = HapticButton;
