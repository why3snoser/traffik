import type { CSSProperties } from 'react'

/**
 * Shared layout rules for goal artwork.
 *
 * Goals come in two kinds. Cutout artwork (products on transparent
 * backgrounds) sits inside a round frame; photos of people or places get no
 * frame at all and are handled by `goalPhotoStyle` below.
 *
 * For the round frame, `overflow-hidden` means the largest area that can never
 * be clipped is the circle's inscribed square:
 *
 *   side = D / √2 ≈ 0.7071·D   →   inset = (1 − 0.7071) / 2 ≈ 14.65%
 *
 * Padding the frame down to that square and letting the image `object-contain`
 * inside it guarantees the whole image fits, for *any* aspect ratio — the tall
 * iPhone cutout, the wide MacBook render and the portrait photo alike.
 */

/** Inset that keeps a contained image inside the round mask (14.65% + margin). */
export const GOAL_SAFE_INSET = 'p-[15%]'

/**
 * Same idea, plus headroom for the showcase's vertical bob. Worst case for any
 * aspect ratio, with s = 1 − 2·0.17 and the float amplitude a:
 *   √((s/2 + a)² + (s/2)²) ≈ 0.485 ≤ 0.5 ✓
 */
export const GOAL_SAFE_INSET_FLOATING = 'p-[17%]'

/** Bob amplitude as a fraction of the frame, so it scales with the frame. */
export const GOAL_FLOAT_AMPLITUDE = '2.5%'

/**
 * One fluid sizing idiom for both frames: `aspect-square` derives the height
 * from the width, so each frame has a single source of truth and there is no
 * per-breakpoint height to keep in sync.
 */
export const GOAL_FRAME_CARD = 'w-[clamp(7rem,28vw,12rem)] aspect-square'
/**
 * The showcase frame is orbited by a ring at `inset-[-20%]`, so the circle it
 * actually occupies is 1.4× this width — in both axes. Sizing off `vmin` alone
 * pinned a phone to the 20rem floor and pushed that ring 100px past the screen
 * edge; capping on `vh` too keeps it inside a short desktop window.
 */
export const GOAL_FRAME_SHOWCASE = 'w-[min(28.125rem,max(42vmin,62vw),46vh)] aspect-square'

/** Portrait photo frames for `imageFit: 'cover'` goals (memories, people). */
export const GOAL_FRAME_PHOTO_CARD = 'w-[clamp(7.5rem,28vw,12.5rem)] aspect-[4/5]'
/** Taller than it is wide, so the height cap does the work on short screens. */
export const GOAL_FRAME_PHOTO_SHOWCASE = 'w-[min(22rem,max(36vmin,56vw),38vh)] aspect-[4/5]'

/**
 * Default scale per frame. A goal that sets its own `imageScale` keeps it; the
 * default only decides how much of the circle *untuned* artwork claims. The
 * showcase leans large so a plain cutout owns the frame the way the reference
 * product does, instead of floating in the middle of it.
 */
const DEFAULT_SCALE = { card: 1, showcase: 1.3 }

/**
 * Photo goals get no frame at all. A border or a gradient ring competes with
 * the shot, and a round crop cuts whatever isn't dead-centre — which is why
 * some photos survive it and others lose half a face. So instead of framing
 * the photo we dissolve its outer edge into the backdrop: solid through the
 * middle and along the top/bottom edges, softening at the sides, corners gone.
 * Nothing is cropped, and there is no hard rectangle to look at.
 */
export const GOAL_PHOTO_EDGE_FADE =
  'radial-gradient(ellipse 74% 76% at 50% 46%, #000 66%, rgba(0,0,0,0.45) 88%, transparent 100%)'

/** Style for a photo goal's `<img>`: keeps the framing, drops the frame. */
export function goalPhotoStyle(objectPosition?: string): CSSProperties {
  return {
    objectPosition: objectPosition ?? 'center',
    maskImage: GOAL_PHOTO_EDGE_FADE,
    WebkitMaskImage: GOAL_PHOTO_EDGE_FADE,
  }
}

/** Structural subset of `Goal` (and of the showcase's ProductData). */
export interface GoalImageSource {
  imageFit?: 'contain' | 'cover'
  imageScale?: number
  imagePosition?: string
}

export interface GoalImageLayout {
  /** Padding on the frame that carves out the never-clipped safe box. */
  padClass: string
  /** `object-fit` class for the <img>. */
  fitClass: string
  /**
   * Scale transform for the safe box. Put this on the *wrapper*, never on a
   * `motion.img` that animates `scale` — framer-motion composes `transform`
   * from its own motion values and would drop an inline one.
   */
  style: CSSProperties
}

/**
 * Resolve how a goal's image should be laid out.
 *
 * Defaults to `object-contain` inside the round frame, so nothing is ever
 * cropped. `imageFit: 'cover'` marks a photo goal: it fills its portrait frame
 * edge to edge, and callers pair it with `goalPhotoStyle` instead of a frame.
 */
export function resolveGoalImage(source: GoalImageSource, floating = false): GoalImageLayout {
  if (source.imageFit === 'cover') {
    return {
      padClass: '',
      fitClass: 'object-cover',
      style: { objectPosition: source.imagePosition ?? 'center' },
    }
  }

  // Cutout artwork sits on a transparent background, so dialing it *up* past
  // the safe inscribed box is safe — anything that slips under the round mask
  // is just transparent pixels. Cap it high enough to make tall cutouts (the
  // iPhone) occupy the circle without ever reaching physical clipping.
  const fallback = floating ? DEFAULT_SCALE.showcase : DEFAULT_SCALE.card
  const scale = Math.min(1.8, Math.max(0.2, source.imageScale ?? fallback))

  return {
    padClass: floating ? GOAL_SAFE_INSET_FLOATING : GOAL_SAFE_INSET,
    fitClass: 'object-contain',
    style: scale === 1 ? {} : { transform: `scale(${scale})` },
  }
}
