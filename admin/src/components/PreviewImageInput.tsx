import { Flex, LinkButton } from '@strapi/design-system';
import { ExternalLink } from '@strapi/icons';

type PreviewImageInputProps = {
  attribute?: {
    options?: {
      url?: string;
    };
  };
};

export const PreviewImageInput = ({ attribute }: PreviewImageInputProps) => {
  const url = attribute?.options?.url;

  if (!url) return null;

  return (
    <Flex justifyContent="flex-end">
      <LinkButton
        href={url}
        target="_blank"
        rel="noreferrer"
        variant="tertiary"
        size="S"
        endIcon={<ExternalLink />}
      >
        Preview
      </LinkButton>
    </Flex>
  );
};
