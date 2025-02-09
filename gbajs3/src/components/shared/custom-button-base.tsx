import { type ReactNode } from 'react';
import { styled } from 'styled-components';

type ButtonBaseProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const StyledButton = styled.button`
  font-size: inherit;
  font-family: inherit;
  line-height: inherit;
  padding: inherit;
`;

export const ButtonBase = ({ children, ...rest }: ButtonBaseProps) => (
  <StyledButton {...rest}>{children}</StyledButton>
);
