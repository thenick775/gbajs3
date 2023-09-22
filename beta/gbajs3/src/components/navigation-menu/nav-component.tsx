import { ReactNode, useEffect, useState } from 'react';
import AnimateHeight, { type Height } from 'react-animate-height';
import { styled } from 'styled-components';

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

const NavComponentWrapper = styled.li<ComponentWrapperProps>`
  color: ${({ theme }) => theme.gbaThemeBlue};

  ${({ $disabled = false, theme }) =>
    $disabled &&
    `color: ${theme.disabledGray};
     pointer-events: none;
     cursor: default;
    `}
`;

const HoverWrapper = styled.div`
  cursor: pointer;
  padding: 0.5rem 1rem;

  &:hover {
    color: ${({ theme }) => theme.menuHover};
    background-color: ${({ theme }) => theme.menuHighlight};
  }
`;

const NavTitle = styled.span`
  margin-left: 0.5rem;
  font-size: 15px;
`;

const ChildrenWrapper = styled.ul`
  padding-left: 2rem;
  overflow-y: hidden;
`;

export const NavComponent = ({
  title,
  icon,
  children,
  $isExpanded = false,
  $disabled = false
}: NavComponentProps) => {
  const [height, setHeight] = useState<Height>($isExpanded ? 'auto' : 0);

  useEffect(() => {
    setHeight($isExpanded ? 'auto' : 0);
  }, [$isExpanded]);

  return (
    <NavComponentWrapper $disabled={$disabled}>
      <HoverWrapper
        onClick={() => {
          setHeight(height === 0 ? 'auto' : 0);
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
