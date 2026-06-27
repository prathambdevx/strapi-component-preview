export type SchemaAttribute = {
  type?: string;
  component?: string;
  repeatable?: boolean;
  allowedTypes?: string[];
};

export type SchemaDefinition = {
  attributes?: Record<string, SchemaAttribute>;
  info?: { displayName?: string };
};

const BACKEND_URL =
  (typeof window !== 'undefined' && (window as { strapi?: { backendURL?: string } }).strapi?.backendURL) ||
  '';

export const toAbsolute = (url: string): string =>
  url.startsWith('/') ? `${BACKEND_URL}${url}` : url;

// Skip non-image mime types so we never pass a video URL to <img>.
export const extractImageUrl = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const url = extractImageUrl(entry);
      if (url) return url;
    }
    return undefined;
  }
  if (typeof value === 'object') {
    const obj = value as { url?: unknown; mime?: unknown };
    if (typeof obj.mime === 'string' && !obj.mime.startsWith('image/')) return undefined;
    if (typeof obj.url === 'string') return obj.url;
  }
  return undefined;
};

export const resolveInstanceImageUrl = (
  instance: unknown,
  sourceField?: string
): string | undefined => {
  if (!sourceField || !instance || typeof instance !== 'object') return undefined;

  let current: unknown = instance;
  for (const segment of sourceField.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  const url = extractImageUrl(current);
  return url ? toAbsolute(url) : undefined;
};

const IMAGE_PREFERRED_NAMES = ['desktop', 'image', 'img', 'photo', 'thumbnail', 'cover', 'hero'];

export const preferenceScore = (name: string): number => {
  const idx = IMAGE_PREFERRED_NAMES.indexOf(name.toLowerCase());
  return idx === -1 ? IMAGE_PREFERRED_NAMES.length : idx;
};

// Walks a component's attribute tree depth-first and returns the dot-path to
// the best image-compatible media field. Recurses into sub-components.
export const findBestMediaPath = (
  componentUid: string,
  componentSchemas: Record<string, SchemaDefinition>,
  depth = 0,
  prefix = ''
): string | undefined => {
  if (depth > 4) return undefined;

  const schema = componentSchemas[componentUid];
  if (!schema?.attributes) return undefined;

  const candidates: { path: string; score: number }[] = [];

  for (const [attrName, attr] of Object.entries(schema.attributes)) {
    const path = prefix ? `${prefix}.${attrName}` : attrName;

    if (attr.type === 'media') {
      const types = attr.allowedTypes;
      if (!types || types.includes('images')) {
        candidates.push({ path, score: preferenceScore(attrName) });
      }
      continue;
    }

    if (attr.type === 'component' && attr.component) {
      // Repeatable components are arrays at runtime — insert .0 so the resolved
      // path is valid (e.g. slides.0.media.desktop instead of slides.media.desktop)
      const recursePrefix = attr.repeatable ? `${path}.0` : path;
      const nested = findBestMediaPath(attr.component, componentSchemas, depth + 1, recursePrefix);
      if (nested) {
        const leafName = nested.split('.').pop() ?? nested;
        candidates.push({ path: nested, score: preferenceScore(leafName) + 10 });
      }
    }
  }

  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0].path;
};

export const autoDetectImageUrl = (
  instance: unknown,
  componentUid: string,
  componentSchemas: Record<string, SchemaDefinition>
): string | undefined => {
  const path = findBestMediaPath(componentUid, componentSchemas);
  if (!path) return undefined;
  return resolveInstanceImageUrl(instance, path);
};
