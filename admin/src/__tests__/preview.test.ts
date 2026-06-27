import { describe, it, expect } from 'bun:test';
import {
  extractImageUrl,
  resolveInstanceImageUrl,
  findBestMediaPath,
  autoDetectImageUrl,
  type SchemaDefinition,
} from '../utils/preview';

// ─── extractImageUrl ──────────────────────────────────────────────────────────

describe('extractImageUrl', () => {
  it('returns undefined for null/undefined', () => {
    expect(extractImageUrl(null)).toBeUndefined();
    expect(extractImageUrl(undefined)).toBeUndefined();
  });

  it('returns a plain string as-is', () => {
    expect(extractImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('extracts url from a media object', () => {
    expect(extractImageUrl({ url: '/uploads/img.jpg', mime: 'image/jpeg' })).toBe('/uploads/img.jpg');
  });

  it('skips video mime types', () => {
    expect(extractImageUrl({ url: '/uploads/vid.mp4', mime: 'video/mp4' })).toBeUndefined();
  });

  it('returns first image from an array, skipping videos', () => {
    const arr = [
      { url: '/uploads/vid.mp4', mime: 'video/mp4' },
      { url: '/uploads/img.jpg', mime: 'image/jpeg' },
    ];
    expect(extractImageUrl(arr)).toBe('/uploads/img.jpg');
  });

  it('returns undefined for empty array', () => {
    expect(extractImageUrl([])).toBeUndefined();
  });

  it('returns undefined for object with no url', () => {
    expect(extractImageUrl({ mime: 'image/jpeg' })).toBeUndefined();
  });
});

// ─── resolveInstanceImageUrl ──────────────────────────────────────────────────

describe('resolveInstanceImageUrl', () => {
  it('returns undefined when no sourceField', () => {
    expect(resolveInstanceImageUrl({ image: { url: '/img.jpg' } })).toBeUndefined();
  });

  it('resolves a flat path', () => {
    const instance = { image: { url: 'https://cdn.example.com/img.jpg', mime: 'image/jpeg' } };
    expect(resolveInstanceImageUrl(instance, 'image')).toBe('https://cdn.example.com/img.jpg');
  });

  it('resolves a nested path', () => {
    const instance = { media: { desktop: { url: 'https://cdn.example.com/desktop.jpg', mime: 'image/jpeg' } } };
    expect(resolveInstanceImageUrl(instance, 'media.desktop')).toBe('https://cdn.example.com/desktop.jpg');
  });

  it('resolves an array-indexed path (slides.0.media.desktop)', () => {
    const instance = {
      slides: [
        { media: { desktop: { url: 'https://cdn.example.com/slide1.jpg', mime: 'image/jpeg' } } },
        { media: { desktop: { url: 'https://cdn.example.com/slide2.jpg', mime: 'image/jpeg' } } },
      ],
    };
    expect(resolveInstanceImageUrl(instance, 'slides.0.media.desktop')).toBe('https://cdn.example.com/slide1.jpg');
  });

  it('returns undefined for a missing path', () => {
    expect(resolveInstanceImageUrl({ a: 1 }, 'b.c')).toBeUndefined();
  });

  it('returns undefined when path leads to a video', () => {
    const instance = { media: { url: '/vid.mp4', mime: 'video/mp4' } };
    expect(resolveInstanceImageUrl(instance, 'media')).toBeUndefined();
  });
});

// ─── findBestMediaPath ────────────────────────────────────────────────────────

describe('findBestMediaPath', () => {
  it('returns undefined for unknown component', () => {
    expect(findBestMediaPath('unknown.uid', {})).toBeUndefined();
  });

  it('finds a direct media attribute', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'sections.hero': {
        attributes: { image: { type: 'media', allowedTypes: ['images'] } },
      },
    };
    expect(findBestMediaPath('sections.hero', schemas)).toBe('image');
  });

  it('prefers desktop over other names', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'sections.banner': {
        attributes: {
          photo: { type: 'media', allowedTypes: ['images'] },
          desktop: { type: 'media', allowedTypes: ['images'] },
        },
      },
    };
    expect(findBestMediaPath('sections.banner', schemas)).toBe('desktop');
  });

  it('recurses into a non-repeatable sub-component', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'sections.banner': {
        attributes: { media: { type: 'component', component: 'elements.media' } },
      },
      'elements.media': {
        attributes: { desktop: { type: 'media', allowedTypes: ['images'] } },
      },
    };
    expect(findBestMediaPath('sections.banner', schemas)).toBe('media.desktop');
  });

  it('inserts .0 for repeatable sub-components', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'banner.carousel': {
        attributes: { slides: { type: 'component', component: 'banner.banner', repeatable: true } },
      },
      'banner.banner': {
        attributes: { media: { type: 'component', component: 'elements.media' } },
      },
      'elements.media': {
        attributes: { desktop: { type: 'media', allowedTypes: ['images'] } },
      },
    };
    expect(findBestMediaPath('banner.carousel', schemas)).toBe('slides.0.media.desktop');
  });

  it('skips media fields that only allow videos', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'sections.video': {
        attributes: {
          video: { type: 'media', allowedTypes: ['videos'] },
          thumbnail: { type: 'media', allowedTypes: ['images'] },
        },
      },
    };
    expect(findBestMediaPath('sections.video', schemas)).toBe('thumbnail');
  });

  it('returns undefined when all media fields are video-only', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'sections.video': {
        attributes: { clip: { type: 'media', allowedTypes: ['videos'] } },
      },
    };
    expect(findBestMediaPath('sections.video', schemas)).toBeUndefined();
  });

  it('respects depth limit to avoid infinite recursion', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'a.a': { attributes: { child: { type: 'component', component: 'b.b' } } },
      'b.b': { attributes: { child: { type: 'component', component: 'c.c' } } },
      'c.c': { attributes: { child: { type: 'component', component: 'd.d' } } },
      'd.d': { attributes: { child: { type: 'component', component: 'e.e' } } },
      'e.e': { attributes: { child: { type: 'component', component: 'f.f' } } },
      'f.f': { attributes: { image: { type: 'media', allowedTypes: ['images'] } } },
    };
    // depth limit of 4 should prevent reaching f.f
    expect(findBestMediaPath('a.a', schemas)).toBeUndefined();
  });
});

// ─── autoDetectImageUrl ───────────────────────────────────────────────────────

describe('autoDetectImageUrl', () => {
  it('auto-detects a flat image field', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'sections.hero': {
        attributes: { image: { type: 'media', allowedTypes: ['images'] } },
      },
    };
    const instance = { image: { url: 'https://cdn.example.com/hero.jpg', mime: 'image/jpeg' } };
    expect(autoDetectImageUrl(instance, 'sections.hero', schemas)).toBe('https://cdn.example.com/hero.jpg');
  });

  it('auto-detects nested media.desktop path', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'banner.banner': {
        attributes: { media: { type: 'component', component: 'elements.media' } },
      },
      'elements.media': {
        attributes: { desktop: { type: 'media', allowedTypes: ['images'] } },
      },
    };
    const instance = {
      media: { desktop: { url: 'https://cdn.example.com/banner.jpg', mime: 'image/jpeg' } },
    };
    expect(autoDetectImageUrl(instance, 'banner.banner', schemas)).toBe('https://cdn.example.com/banner.jpg');
  });

  it('auto-detects slides.0.media.desktop for a banner carousel', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'banner.carousel': {
        attributes: { slides: { type: 'component', component: 'banner.banner', repeatable: true } },
      },
      'banner.banner': {
        attributes: { media: { type: 'component', component: 'elements.media' } },
      },
      'elements.media': {
        attributes: { desktop: { type: 'media', allowedTypes: ['images'] } },
      },
    };
    const instance = {
      slides: [
        { media: { desktop: { url: 'https://cdn.example.com/slide1.jpg', mime: 'image/jpeg' } } },
      ],
    };
    expect(autoDetectImageUrl(instance, 'banner.carousel', schemas)).toBe('https://cdn.example.com/slide1.jpg');
  });

  it('returns undefined when no image found in instance', () => {
    const schemas: Record<string, SchemaDefinition> = {
      'sections.hero': {
        attributes: { image: { type: 'media', allowedTypes: ['images'] } },
      },
    };
    expect(autoDetectImageUrl({ image: null }, 'sections.hero', schemas)).toBeUndefined();
  });
});
