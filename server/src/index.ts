import type { Core } from '@strapi/strapi';
import optionsController from './controllers/options';

const PLUGIN_NAME = 'component-preview-image';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.customFields.register({
      name: 'preview-image',
      plugin: PLUGIN_NAME,
      type: 'string',
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
