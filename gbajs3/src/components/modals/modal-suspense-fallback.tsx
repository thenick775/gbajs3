import { keyframes } from '@emotion/react';
import { styled, useTheme } from '@mui/material/styles';
import { BeatLoader } from 'react-spinners';

import {
  BodyWrapper,
  FooterWrapper,
  Header,
  HeaderWrapper
} from '../shared/styled.tsx';

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

const revealLoader = keyframes`
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const LoadingStackShell = styled('div', {
  shouldForwardProp: (propName) => propName !== '$delayMs'
})<{ $delayMs: number }>`
  opacity: 0;
  transform: translateY(4px);
  animation: ${revealLoader} 140ms ease forwards;
  animation-delay: ${({ $delayMs }) => `${$delayMs}ms`};
`;

const LoadingFooter = styled(FooterWrapper)`
  height: calc(2rem + 36px);
  box-sizing: border-box;
`;

export const ModalSuspenseFallback = () => {
  const theme = useTheme();

  return (
    <>
      <HeaderWrapper>
        <Header id="modalHeader">Loading</Header>
      </HeaderWrapper>
      <LoadingBody>
        <LoadingStackShell $delayMs={modalLoaderDelayMs}>
          <LoadingStack aria-live="polite" aria-busy="true">
            <BeatLoader color={theme.gbaThemeBlue} margin={4} size={10} />
          </LoadingStack>
        </LoadingStackShell>
      </LoadingBody>
      <LoadingFooter aria-hidden="true" />
    </>
  );
};
