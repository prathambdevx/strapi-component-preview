# @devx-labs/strapi-preview

A Strapi 5 plugin that adds a **preview image URL** field to any component and renders all component previews as a side panel in the edit view.

Component authors set the image URL once in the Content-Type Builder (no Media Library required — any HTTPS URL works), and the panel displays the matching image live for every component on the entry. Dynamic-zone reorders are reflected immediately, and components without a configured preview are simply skipped.

## Install

```bash
npm install @devx-labs/strapi-preview
# or
yarn add @devx-labs/strapi-preview
# or
bun add @devx-labs/strapi-preview
```

Strapi auto-discovers the plugin from `node_modules` on next boot — no `config/plugins.ts` entry required.

> If you want to disable it or pass options later, the plugin's internal id is `component-preview-image` (set via `strapi.name`). Use that as the key in `config/plugins.ts`, e.g. `'component-preview-image': { enabled: false }`.

Rebuild the admin:

```bash
npm run build
```

## Add the preview field to your components

In Strapi's Content-Type Builder, edit a component → **Add another field** → **Custom** → pick **"Preview Image"**. Name the field exactly `preview` (any name works, but `preview` is the convention).

In the field's **Base settings**, fill in **Preview Image URL** with a direct image URL (Shopify CDN, S3, Cloudinary, picsum, anything reachable by the browser).

## Usage

1. Configure the `preview` field on each component you want to preview (URL is set once per component schema in CTB).
2. Open any entry that uses your components — for example a Page with a dynamic zone of blocks.
3. The **Component previews** side panel on the right shows every component on the entry, with its preview image, in the current dynamic-zone order.
4. The custom field itself renders a small **Preview ↗** button inside each component instance so editors can quickly open the full image in a new tab.

### Behavior

- Dynamic zone: panel items appear in the current order. Reorder components → panel reorders live (no save required).
- Components without a configured `preview` URL are silently skipped.
- Regular (non-dynamic-zone) component fields are also rendered, including repeatable components.
- No Media Library coupling: URLs are plain strings, so previews can live on any CDN — useful when your component thumbnails live separately from your production media (e.g. a private design-system bucket).

## CSP note

If your preview URLs point to external hosts (Shopify CDN, etc.), make sure your CSP `img-src` permits them. The simplest broad allow is `"https:"` in `config/middlewares.ts`:

```ts
'img-src': ["'self'", 'data:', 'blob:', 'https:', 'market-assets.strapi.io'],
```

## What the plugin registers

- Custom field type: `plugin::component-preview-image.preview-image` (stored as `string`)
- Custom field UI: a compact **Preview ↗** link button rendered inside each component instance
- Content-Manager edit-view side panel: **Component previews**
- Content-API route: `GET /api/component-preview-image/options` returning a `{ [componentUid]: { name, url } }` map (used internally by the side panel)

## Supported Strapi versions

Strapi 5.x

## License

MIT
