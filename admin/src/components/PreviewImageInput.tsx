import { Box, Button, Flex, LinkButton, Modal } from '@strapi/design-system';
import { ExternalLink } from '@strapi/icons';
import styled from 'styled-components';

const ModalContent = styled(Modal.Content)`
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100% !important;
  max-height: 100% !important;
`;

type PreviewImageInputProps = {
  attribute?: {
    options?: {
      url?: string;
      disableIframe?: boolean;
    };
  };
};

export const PreviewImageInput = ({ attribute }: PreviewImageInputProps) => {
  const url = attribute?.options?.url;
  const disableIframe = attribute?.options?.disableIframe;

  if (!url) return null;

  if (disableIframe) {
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
  }

  return (
    <Flex justifyContent="flex-end">
      <Modal.Root>
        <Modal.Trigger>
          <Button variant="tertiary" size="S" endIcon={<ExternalLink />}>
            Preview
          </Button>
        </Modal.Trigger>
        <ModalContent>
          <Modal.Header>
            <Modal.Title>Component Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Box
              padding={4}
              background="neutral100"
              hasRadius
              style={{ height: '80vh' }}
            >
              <iframe
                src={url}
                title="Component Preview"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            </Box>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="tertiary">Close</Button>
            </Modal.Close>
          </Modal.Footer>
        </ModalContent>
      </Modal.Root>
    </Flex>
  );
};
