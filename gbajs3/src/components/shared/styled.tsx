import { styled } from '@mui/material/styles';
import { BiPlus } from 'react-icons/bi';

export const Copy = styled('p')`
  margin: 0;
  color: #a9b4c2;
`;

export const CenteredText = styled(Copy)`
  text-align: center;
`;

export const Header = styled('h3')`
  margin: 0;
  color: #e6edf3;
  font-weight: 600;
`;

export const HeaderWrapper = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #161e2a; /* elevated surface */
  border-bottom: 1px solid #1f2a3a;
  padding: 1rem 1rem;
`;

export const BodyWrapper = styled('div')`
  padding: 1rem;
  overflow-y: auto;
  touch-action: pan-x pan-y;
  color: #e6edf3; // maybe?
  background: #121821;
`;

export const FooterWrapper = styled('div')`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  background: #161e2a;
  border-top: 1px solid #1f2a3a;
  padding: 1rem 1rem;
`;

export const StyledBiPlus = styled(BiPlus)`
  width: 25px;
  height: 25px;
  color: #2f6feb; // dont think this is good -> is ugly?
`;
