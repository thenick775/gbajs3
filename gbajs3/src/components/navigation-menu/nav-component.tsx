import { styled } from '@mui/material/styles';
import { useState, type ReactNode } from 'react';
import AnimateHeight, { type Height } from 'react-animate-height';

import { ButtonBase } from '../shared/custom-button-base.tsx';

type NavComponentProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  $isExpanded?: boolean;
  $disabled?: boolean;
};

type ComponentWrapperProps = {
  $disabled: boolean;
};

const NavComponentWrapper = styled('li')<ComponentWrapperProps>`
  color: ${({ theme }) => theme.gbaThemeBlue};
  padding: 0 2px;

  ${({ $disabled, theme }) =>
    $disabled &&
    `color: ${theme.disabledGray};
     pointer-events: none;
     cursor: default;
    `}
`;

const HoverWrapper = styled(ButtonBase)`
  background-color: unset;
  border: none;
  color: inherit;
  cursor: pointer;
  height: 100%;
  padding: 0.5rem 1rem;
  text-align: inherit;
  width: 100%;

  &:hover {
    color: ${({ theme }) => theme.menuHover};
    background-color: ${({ theme }) => theme.menuHighlight};
  }
`;

const NavTitle = styled('span')`
  margin-left: 0.5rem;
`;

const ChildrenWrapper = styled('ul')`
  padding-left: 2rem;
`;

export const NavComponent = ({
  title,
  icon,
  children,
  $isExpanded = false,
  $disabled = false
}: NavComponentProps) => {
  const [isExpanded, setIsExpanded] = useState($isExpanded);
  const [previousIsExpanded, setPreviousIsExpanded] = useState($isExpanded);

  if ($isExpanded !== previousIsExpanded) {
    setPreviousIsExpanded($isExpanded);
    setIsExpanded($isExpanded);
  }

  const height: Height = isExpanded ? 'auto' : 0;

  return (
    <NavComponentWrapper $disabled={$disabled}>
      <HoverWrapper
        disabled={$disabled}
        onClick={() => {
          setIsExpanded((currentIsExpanded) => !currentIsExpanded);
        }}
      >
        {icon}
        <NavTitle>{title}</NavTitle>
      </HoverWrapper>

      <AnimateHeight duration={350} easing="ease-in-out" height={height}>
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </AnimateHeight>
    </NavComponentWrapper>
  );
};
