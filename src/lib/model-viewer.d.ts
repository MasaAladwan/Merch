// Minimal JSX typing for the <model-viewer> custom element.
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string
          'ios-src'?: string
          alt?: string
          ar?: boolean | ''
          'ar-modes'?: string
          'ar-scale'?: 'auto' | 'fixed'
          'ar-placement'?: 'floor' | 'wall'
          'camera-controls'?: boolean | ''
          'touch-action'?: string
          'auto-rotate'?: boolean | ''
          'auto-rotate-delay'?: string | number
          'rotation-per-second'?: string
          'shadow-intensity'?: string | number
          'shadow-softness'?: string | number
          'environment-image'?: string
          'skybox-image'?: string
          exposure?: string | number
          'tone-mapping'?: string
          'disable-zoom'?: boolean | ''
          'camera-orbit'?: string
          'field-of-view'?: string
          poster?: string
          loading?: 'eager' | 'lazy' | 'auto'
          reveal?: 'auto' | 'interaction' | 'manual'
          'interaction-prompt'?: 'auto' | 'when-focused' | 'none'
        },
        HTMLElement
      >
    }
  }
}

export {}
