import type { Core } from '@strapi/strapi';

const CUSTOM_FIELD_KEY = 'plugin::component-preview-image.preview-image';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getOptions(ctx: any) {
    const result: Record<string, { name: string; url?: string; sourceField?: string }> = {};

    for (const [uid, schema] of Object.entries(strapi.components as Record<string, any>)) {
      for (const attr of Object.values(schema.attributes as Record<string, any>)) {
        if (attr.customField === CUSTOM_FIELD_KEY && (attr.options?.url || attr.options?.sourceField)) {
          result[uid] = {
            name: schema.info?.displayName || uid,
            url: attr.options.url,
            sourceField: attr.options.sourceField,
          };
          break;
        }
      }
    }

    ctx.body = result;
  },
});
