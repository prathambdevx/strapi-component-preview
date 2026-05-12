import { ComponentPreviewPanel } from './components/ComponentPreviewPanel';

export default {
  register(app: any) {
    app.customFields.register({
      name: 'preview-image',
      pluginId: 'component-preview-image',
      type: 'string',
      inputSize: { default: 12, isResizable: false },
      intlLabel: {
        id: 'component-preview-image.preview-image.label',
        defaultMessage: 'Preview Image',
      },
      intlDescription: {
        id: 'component-preview-image.preview-image.description',
        defaultMessage:
          'Schema-level preview image — set the image URL once in the Content-Type Builder, shown in the edit-view side panel',
      },
      components: {
        Input: async () =>
          import('./components/PreviewImageInput').then((mod) => ({
            default: mod.PreviewImageInput,
          })),
      },
      options: {
        base: [
          {
            name: 'options.url',
            type: 'text',
            intlLabel: {
              id: 'component-preview-image.options.url.label',
              defaultMessage: 'Preview Image URL',
            },
            description: {
              id: 'component-preview-image.options.url.description',
              defaultMessage: 'Direct URL of the image to display in the preview panel',
            },
          },
          {
            name: 'options.disableIframe',
            type: 'checkbox',
            intlLabel: {
              id: 'component-preview-image.options.disableIframe.label',
              defaultMessage: 'Disable Iframe?',
            },
            description: {
              id: 'component-preview-image.options.disableIframe.description',
              defaultMessage: 'Disables iframe modal and opens the image in a new tab',
            },
          },
        ],
      },
    });
  },

  bootstrap(app: any) {
    app.getPlugin('content-manager').apis.addEditViewSidePanel([ComponentPreviewPanel]);
  },
};
