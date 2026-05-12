'use strict';

const CUSTOM_FIELD_KEY = 'plugin::component-preview-image.preview-image';

module.exports = {
  register({ strapi }) {
    strapi.customFields.register({
      name: 'preview-image',
      plugin: 'component-preview-image',
      type: 'string',
      inputSize: { default: 12, isResizable: false },
    });
  },

  bootstrap() {},
  destroy() {},
  config: {},

  routes: {
    'content-api': {
      type: 'content-api',
      routes: [
        {
          method: 'GET',
          path: '/options',
          handler: 'options.getOptions',
          config: { auth: false },
        },
      ],
    },
  },

  controllers: {
    options: ({ strapi }) => ({
      async getOptions(ctx) {
        const result = {};

        for (const [uid, schema] of Object.entries(strapi.components || {})) {
          for (const attr of Object.values(schema.attributes || {})) {
            if (
              attr.customField === CUSTOM_FIELD_KEY &&
              attr.options?.url
            ) {
              result[uid] = {
                name: schema.info?.displayName || uid,
                url: attr.options.url,
              };
              break;
            }
          }
        }

        ctx.body = result;
      },
    }),
  },

  services: {},
  policies: {},
  middlewares: {},
};
