import { styled, useTheme } from '@mui/material/styles';
import { useEffect, useState, type ReactNode } from 'react';
import { BeatLoader } from 'react-spinners';

import {
  BodyWrapper,
  FooterWrapper,
  Header,
  HeaderWrapper
} from '../shared/styled.tsx';

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

const LoadingStackShell = styled('div', {
  shouldForwardProp: (propName) => propName !== '$visible'
})<{ $visible: boolean }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $visible }) =>
    $visible ? 'translateY(0)' : 'translateY(4px)'};
  transition:
    opacity 140ms ease,
    transform 140ms ease;
`;

const LoadingFooter = styled(FooterWrapper)`
  height: calc(2rem + 36px);
  box-sizing: border-box;
`;

const FadeInWrapper = styled('div', {
  shouldForwardProp: (propName) => propName !== '$visible'
})<{ $visible: boolean }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $visible }) =>
    $visible ? 'translateY(0)' : 'translateY(6px)'};
  transition:
    opacity 160ms ease,
    transform 160ms ease;
`;

export const ModalSuspenseFallback = ({ delayMs = 300 }) => {
  const theme = useTheme();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowLoader(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs]);

  return (
    <>
      <HeaderWrapper>
        <Header id="modalHeader">Loading</Header>
      </HeaderWrapper>
      <LoadingBody>
        <LoadingStackShell $visible={showLoader}>
          <LoadingStack aria-live="polite" aria-busy="true">
            <BeatLoader color={theme.gbaThemeBlue} margin={4} size={10} />
          </LoadingStack>
        </LoadingStackShell>
      </LoadingBody>
      <LoadingFooter aria-hidden="true" />
    </>
  );
};

export const ModalContentFadeIn = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return <FadeInWrapper $visible={isVisible}>{children}</FadeInWrapper>;
};
