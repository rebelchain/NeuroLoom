/**
 * Where the mark is on screen, in CSS pixels.
 *
 * The field writes it each frame; the hero reads it to light the text the mark
 * passes behind. A shared record rather than a prop because the field lives in
 * a lazily loaded chunk and may never arrive at all.
 */
export const markPosition = {
  x: -1e4,
  y: -1e4,
  /** Roughly the mark's radius on screen, used as the reach of its light. */
  radius: 0,
  visible: false,
};
