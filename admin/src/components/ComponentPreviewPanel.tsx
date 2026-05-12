import { useEffect, useState } from 'react';
import { Box, Button, Flex, Typography } from '@strapi/design-system';
import type { PanelComponent } from '@strapi/content-manager/strapi-admin';
import { unstable_useContentManagerContext } from '@strapi/content-manager/strapi-admin';
import { useForm, useFetchClient } from '@strapi/strapi/admin';
import { ExternalLink } from '@strapi/icons';

type SchemaAttribute = {
  type?: string;
  component?: string;
  repeatable?: boolean;
};

type SchemaDefinition = {
  attributes?: Record<string, SchemaAttribute>;
  info?: { displayName?: string };
};

type PreviewOption = { name: string; url: string };

type PreviewItem = {
  uid: string;
  displayName: string;
  previewUrl: string;
  previewName: string;
  count: number;
  tempKey?: string;
};

const collectPreviewItems = (
  value: unknown,
  attributes: Record<string, SchemaAttribute> | undefined,
  componentSchemas: Record<string, SchemaDefinition>,
  optionsMap: Record<string, PreviewOption>
): PreviewItem[] => {
  const items: PreviewItem[] = [];

  if (!value || !attributes || typeof value !== 'object') return items;

  const pushItem = (componentUid: string, tempKey?: string) => {
    const opts = optionsMap[componentUid];
    if (!opts) return;
    const schema = componentSchemas[componentUid];
    items.push({
      uid: componentUid,
      displayName: schema?.info?.displayName ?? componentUid,
      previewUrl: opts.url,
      previewName: opts.name,
      count: 1,
      tempKey,
    });
  };

  for (const [attributeName, attribute] of Object.entries(attributes)) {
    const attributeValue = (value as Record<string, unknown>)[attributeName];
    if (!attributeValue) continue;

    if (attribute.type === 'dynamiczone' && Array.isArray(attributeValue)) {
      for (const item of attributeValue) {
        if (!item || typeof item !== 'object') continue;
        const componentUid = (item as { __component?: string }).__component;
        const tempKey = (item as { __temp_key__?: string }).__temp_key__;
        if (componentUid) pushItem(componentUid, tempKey);
      }
      continue;
    }

    if (attribute.type === 'component' && attribute.component) {
      const componentUid = attribute.component;
      if (attribute.repeatable && Array.isArray(attributeValue)) {
        for (let i = 0; i < attributeValue.length; i++) {
          const item = attributeValue[i] as { __temp_key__?: string } | undefined;
          pushItem(componentUid, item?.__temp_key__);
        }
      } else {
        pushItem(componentUid);
      }
    }
  }

  return items;
};

export const ComponentPreviewPanel: PanelComponent = () => {
  const { components, contentType, isCreatingEntry } = unstable_useContentManagerContext();
  const values = useForm('ComponentPreviewPanel', (state) => state.values);
  const { get } = useFetchClient();
  const [optionsMap, setOptionsMap] = useState<Record<string, PreviewOption>>({});

  useEffect(() => {
    let cancelled = false;

    get('/api/component-preview-image/options')
      .then(({ data }: { data: Record<string, PreviewOption> }) => {
        if (!cancelled) setOptionsMap(data ?? {});
      })
      .catch(() => {
        if (!cancelled) setOptionsMap({});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const previewItems = collectPreviewItems(
    values,
    contentType?.attributes,
    components as Record<string, SchemaDefinition>,
    optionsMap
  );

  if (isCreatingEntry) {
    return {
      title: 'Component previews',
      content: (
        <Typography variant="omega" textColor="neutral600">
          Save this entry once to load component previews.
        </Typography>
      ),
    };
  }

  if (previewItems.length === 0) {
    return {
      title: 'Component previews',
      content: (
        <Typography variant="omega" textColor="neutral600">
          No component previews are available for this entry yet.
        </Typography>
      ),
    };
  }

  return {
    title: 'Component previews',
    content: (
      <Flex direction="column" gap={4} alignItems="stretch">
        {previewItems.map((item, index) => (
          <Box
            key={item.tempKey ?? `${index}-${item.uid}`}
            borderColor="neutral200"
            background="neutral0"
            hasRadius
            padding={3}
            shadow="tableShadow"
            width="100%"
            overflow="hidden"
            style={{ boxSizing: 'border-box' }}
          >
            <Flex direction="column" gap={3} alignItems="stretch">
              <img
                src={item.previewUrl}
                alt={item.previewName || item.displayName}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  display: 'block',
                  borderRadius: '8px',
                  border: '1px solid #dcdce4',
                  objectFit: 'cover',
                  boxSizing: 'border-box',
                }}
              />
              <Flex
                justifyContent="space-between"
                alignItems="flex-start"
                gap={2}
                width="100%"
              >
                <Box style={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="sigma" textColor="neutral800">
                    {item.previewName || item.displayName}
                  </Typography>
                  <Typography
                    variant="pi"
                    textColor="neutral600"
                    style={{
                      display: 'block',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.uid}
                  </Typography>
                </Box>
                <Button
                  variant="tertiary"
                  size="S"
                  tag="a"
                  href={item.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  endIcon={<ExternalLink />}
                  style={{ flexShrink: 0 }}
                >
                  Open
                </Button>
              </Flex>
            </Flex>
          </Box>
        ))}
      </Flex>
    ),
  };
};
