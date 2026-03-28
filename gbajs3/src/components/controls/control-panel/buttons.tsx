import {
  PanelControlWrapper,
  PanelControlButton,
  PanelSliderButton
} from './styled.tsx';

import type {
  ComponentProps,
  MouseEventHandler,
  PointerEventHandler,
  ReactNode
} from 'react';

type PanelButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  controlled: boolean;
  id: string;
  $gridArea?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
};

type SliderButtonProps = {
  icon: ReactNode;
} & Omit<ComponentProps<typeof PanelSliderButton>, 'children'>;

export const PanelButton = ({
  ariaLabel,
  children,
  className,
  controlled,
  id,
  $gridArea,
  onClick,
  onPointerDown,
  onPointerUp
}: PanelButtonProps) => (
  <PanelControlWrapper>
    <PanelControlButton
      aria-label={ariaLabel}
      id={id}
      className={className}
      onClick={onClick}
      $controlled={controlled}
      $gridArea={$gridArea}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {children}
    </PanelControlButton>
  </PanelControlWrapper>
);

export const SliderButton = ({ icon, ...rest }: SliderButtonProps) => (
  <PanelSliderButton {...rest}>{icon}</PanelSliderButton>
);
