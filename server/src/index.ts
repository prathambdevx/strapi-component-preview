import type { Core } from '@strapi/strapi';
import optionsController from './controllers/options';

const PLUGIN_NAME = 'component-preview-image';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.customFields.register({
      name: 'preview-image',
      plugin: PLUGIN_NAME,
      type: 'string',
      // Force a full-width, non-resizable edit-view cell so the Preview button
      // always sits on its own row (bottom-right). The string default is a
      // resizable half-width cell, which floats the button to mid-row.
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
          config: {
            auth: false,
          },
        },
      ],
    },
  },

  controllers: {
    options: optionsController,
  },

  services: {},
  policies: {},
  middlewares: {},
};
