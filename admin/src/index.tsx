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
              defaultMessage:
                'Fallback image shown in the preview panel when no instance image is found',
            },
          },
          {
            name: 'options.sourceField',
            type: 'text',
            intlLabel: {
              id: 'component-preview-image.options.sourceField.label',
              defaultMessage: 'Instance image path (optional)',
            },
            description: {
              id: 'component-preview-image.options.sourceField.description',
              defaultMessage:
                "Dot-path to the entry's own image, e.g. media.desktop or slides.0.media.desktop. When set, each instance previews its uploaded image and falls back to the URL above.",
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
