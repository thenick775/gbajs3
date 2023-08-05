import { ReactNode, useEffect, useState } from 'react';
import styled from 'styled-components';

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

type ChildrenWrapperProps = {
  $isExpanded: boolean;
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

const ChildrenWrapper = styled.ul<ChildrenWrapperProps>`
  padding-left: 2rem;
  overflow-y: hidden;
  max-height: 0;
  transition: max-height 0.35s ease-in-out;

  ${({ $isExpanded = false }) =>
    $isExpanded &&
    `max-height: 15em;
     visibility: visible;
    `}
`;

export const NavComponent = ({
  title,
  icon,
  children,
  $isExpanded = false,
  $disabled = false,
}: NavComponentProps) => {
  const [isExpanded, setIsExpanded] = useState($isExpanded);

  useEffect(() => {
    setIsExpanded($isExpanded);
  }, [$isExpanded]);

  return (
    <NavComponentWrapper $disabled={$disabled}>
      <HoverWrapper
        onClick={() => {
          setIsExpanded((prevState: boolean) => !prevState);
        }}
      >
        {icon}
        <NavTitle>{title}</NavTitle>
      </HoverWrapper>

      <ChildrenWrapper $isExpanded={isExpanded}>{children}</ChildrenWrapper>
    </NavComponentWrapper>
  );
};
