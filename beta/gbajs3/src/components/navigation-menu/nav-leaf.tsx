import { ReactNode } from 'react';
import { styled } from 'styled-components';

import { ButtonBase } from '../shared/custom-button-base.tsx';

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

const NavLeafButton = styled(ButtonBase)`
  background-color: unset;
  border: none;
  color: inherit;
  height: 100%;
  margin: 0;
  padding: 0;
  text-align: inherit;
  width: 100%;
`;

const NavTitle = styled.span`
  margin-left: 0.5rem;
`;

const NavLink = styled.a<NavLinkProps>`
  display: block;
  text-decoration: none;
  color: unset;

  padding: 0.5rem
    ${({ $withPadding = false }) => ($withPadding ? '1rem' : '0.5rem')};
`;

export const NavLeaf = ({
  title,
  icon,
  onClick = undefined,
  $link = undefined,
  $disabled = false,
  $withPadding = false
}: NavLeafProps) => {
  const commonChildren = (
    <>
      {icon}
      <NavTitle>{title}</NavTitle>
    </>
  );

  return (
    <NavLeafWrapper
      $disabled={$disabled}
      $withPadding={$withPadding}
      $hasLink={!!$link}
    >
      {$link ? (
        <NavLink href={$link} $withPadding={$withPadding} target="_blank">
          {commonChildren}
        </NavLink>
      ) : (
        <NavLeafButton onClick={onClick}>{commonChildren}</NavLeafButton>
      )}
    </NavLeafWrapper>
  );
};
