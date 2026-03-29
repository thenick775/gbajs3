import { styled } from '@mui/material/styles';
import { BiPlus } from 'react-icons/bi';

export const Copy = styled('p')`
  margin: 0;
  color: ${({ theme }) => theme.modalIconMuted};
`;

export const CenteredText = styled(Copy)`
  text-align: center;
`;

export const Header = styled('h3')`
  margin: 0;
  color: ${({ theme }) => theme.surfaceTextPrimary};
  font-weight: 600;
`;

export const HeaderWrapper = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
  background: ${({ theme }) => theme.modalSectionSurface};
  border-bottom: 1px solid ${({ theme }) => theme.modalSectionBorder};
  padding: 1rem 1rem;
`;

export const BodyWrapper = styled('div')`
  padding: 1rem;
  overflow-y: auto;
  touch-action: pan-x pan-y;
  color: ${({ theme }) => theme.surfaceTextPrimary};
  background: ${({ theme }) => theme.modalContainerSurface};
`;

export const FooterWrapper = styled('div')`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  background: ${({ theme }) => theme.modalSectionSurface};
  border-top: 1px solid ${({ theme }) => theme.modalSectionBorder};
  padding: 1rem 1rem;
`;

export const StyledBiPlus = styled(BiPlus)`
  width: 25px;
  height: 25px;
  color: ${({ theme }) => theme.gbaThemeBlue};
`;
