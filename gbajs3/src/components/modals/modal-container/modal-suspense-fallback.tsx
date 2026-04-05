import { styled, useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { BeatLoader } from 'react-spinners';

import {
  BodyWrapper,
  FooterWrapper,
  Header,
  HeaderWrapper
} from '../../shared/styled.tsx';

const modalLoaderDelayMs = 300;

const LoadingBody = styled(BodyWrapper)`
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingStack = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
`;

const LoadingStackShell = styled('div')`
  opacity: 1;
  transform: translateY(0);
`;

const LoadingFooter = styled(FooterWrapper)`
  height: calc(2rem + 36px);
  box-sizing: border-box;
`;

export const ModalSuspenseFallback = () => {
  const theme = useTheme();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShouldRender(true);
    }, modalLoaderDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <>
      <HeaderWrapper>
        <Header id="modalHeader">Loading</Header>
      </HeaderWrapper>
      <LoadingBody>
        <LoadingStackShell>
          <LoadingStack>
            <BeatLoader
              data-testid="modal-loading-indicator"
              color={theme.gbaThemeBlue}
              margin={4}
              size={10}
            />
          </LoadingStack>
        </LoadingStackShell>
      </LoadingBody>
      <LoadingFooter aria-hidden="true" />
    </>
  );
};
