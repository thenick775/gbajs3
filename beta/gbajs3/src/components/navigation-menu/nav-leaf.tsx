import { ReactNode } from 'react';
import styled from 'styled-components';

type NavLeafProps = {
  title: string;
  icon: ReactNode;
  $link?: string;
  $disabled?: boolean;
  $withPadding?: boolean;
  onClick?: () => void;
};

type LeafWrapperProps = {
  $disabled?: boolean;
  $withPadding?: boolean;
  $hasLink?: boolean;
};

type ConditionalWrapperProps = {
  condition: boolean;
  wrapper: (children: JSX.Element) => JSX.Element;
  children: JSX.Element;
};

type NavLinkProps = {
  $withPadding?: boolean;
};

const NavLeafWrapper = styled.li<LeafWrapperProps>`
  cursor: pointer;
  color: ${({ theme }) => theme.gbaThemeBlue};
  list-style-type: none;

  ${({ $withPadding = false, $hasLink = false }) =>
    $hasLink
      ? 'padding: 0;'
      : `padding: 0.5rem ${$withPadding ? '1rem' : '0.5rem'};
    `}

  ${({ $disabled = false, theme }) =>
    $disabled &&
    `color: ${theme.disabledGray};
     pointer-events: none;
     cursor: default;
    `}

  &:hover {
    color: ${({ theme }) => theme.menuHover};
    background-color: ${({ theme }) => theme.menuHighlight};
  }
`;

const NavTitle = styled.span`
  margin-left: 0.5rem;
  font-size: 15px;
`;

const NavLink = styled.a<NavLinkProps>`
  display: block;
  text-decoration: none;
  color: unset;

  padding: 0.5rem
    ${({ $withPadding = false }) => ($withPadding ? '1rem' : '0.5rem')};
`;

const ConditionalWrapper = ({
  condition,
  wrapper,
  children,
}: ConditionalWrapperProps) => (condition ? wrapper(children) : children);

export const NavLeaf = ({
  title,
  icon,
  onClick = () => undefined,
  $link = undefined,
  $disabled = false,
  $withPadding = false,
}: NavLeafProps) => {
  return (
    <NavLeafWrapper
      $disabled={$disabled}
      $withPadding={$withPadding}
      $hasLink={!!$link}
      onClick={onClick}
    >
      <ConditionalWrapper
        condition={!!$link}
        wrapper={(children) => (
          <NavLink href={$link} $withPadding={$withPadding} target="_blank">
            {children}
          </NavLink>
        )}
      >
        <>
          {icon}
          <NavTitle>{title}</NavTitle>
        </>
      </ConditionalWrapper>
    </NavLeafWrapper>
  );
};
