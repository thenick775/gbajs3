import { BiPlus } from 'react-icons/bi';
import { styled } from 'styled-components';

export const Copy = styled.p`
  margin: 0;
`;

export const CenteredText = styled(Copy)`
  text-align: center;
`;

export const Header = styled.h3`
  margin: 0;
`;

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.pattensBlue};
  padding: 1rem 1rem;
`;

export const BodyWrapper = styled.div`
  padding: 1rem;
  overflow-y: auto;
  touch-action: pan-x pan-y;
`;

export const FooterWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid ${({ theme }) => theme.pattensBlue};
  padding: 1rem 1rem;
`;

export const StyledBiPlus = styled(BiPlus)`
  width: 25px;
  height: 25px;
`;
