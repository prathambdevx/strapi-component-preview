import { useEffect, useState } from 'react';
import { Box, Button, Flex, Typography } from '@strapi/design-system';
import type { PanelComponent } from '@strapi/content-manager/strapi-admin';
import { unstable_useContentManagerContext } from '@strapi/content-manager/strapi-admin';
import { useForm, useFetchClient } from '@strapi/strapi/admin';
import { ExternalLink } from '@strapi/icons';
import {
  type SchemaAttribute,
  type SchemaDefinition,
  toAbsolute,
  resolveInstanceImageUrl,
  autoDetectImageUrl,
} from '../utils/preview';

type PreviewOption = { name: string; url?: string; sourceField?: string; isBanner?: boolean };

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

  const pushItem = (componentUid: string, instance?: unknown, tempKey?: string) => {
    const opts = optionsMap[componentUid];
    if (!opts) return;

    let instanceUrl: string | undefined;

    if (opts.sourceField) {
      // Explicit dot-path overrides everything
      instanceUrl = resolveInstanceImageUrl(instance, opts.sourceField);
    } else if (opts.isBanner) {
      instanceUrl = autoDetectImageUrl(instance, componentUid, componentSchemas);
    }

    const previewUrl = (instanceUrl ? toAbsolute(instanceUrl) : undefined) ?? opts.url;
    if (!previewUrl) return;

    const schema = componentSchemas[componentUid];
    items.push({
      uid: componentUid,
      displayName: schema?.info?.displayName ?? componentUid,
      previewUrl,
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
        if (componentUid) pushItem(componentUid, item, tempKey);
      }
      continue;
    }

    if (attribute.type === 'component' && attribute.component) {
      const componentUid = attribute.component;
      if (attribute.repeatable && Array.isArray(attributeValue)) {
        for (let i = 0; i < attributeValue.length; i++) {
          const item = attributeValue[i] as { __temp_key__?: string } | undefined;
          pushItem(componentUid, item, item?.__temp_key__);
        }
      } else {
        pushItem(componentUid, attributeValue);
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

  const rawItems = collectPreviewItems(
    values,
    contentType?.attributes,
    components as Record<string, SchemaDefinition>,
    optionsMap
  );

  const seen = new Map<string, PreviewItem>();
  for (const item of rawItems) {
    const key = `${item.uid}::${item.previewUrl}`;
    const existing = seen.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      seen.set(key, { ...item });
    }
  }
  const previewItems = Array.from(seen.values());

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
                  <Flex alignItems="center" gap={2}>
                    <Typography variant="sigma" textColor="neutral800">
                      {item.previewName || item.displayName}
                    </Typography>
                    {item.count > 1 && (
                      <Box
                        background="primary100"
                        hasRadius
                        padding={1}
                        style={{ minWidth: '20px', textAlign: 'center' }}
                      >
                        <Typography variant="sigma" textColor="primary600">
                          ×{item.count}
                        </Typography>
                      </Box>
                    )}
                  </Flex>
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
