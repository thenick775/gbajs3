import { Slider } from '@mui/material';
import { styled, css } from '@mui/material/styles';

import { ButtonBase } from '../../shared/custom-button-base.tsx';

import type { Theme } from '@mui/material/styles';

type ControlledProps = {
  $controlled: boolean;
};

type PanelControlSliderProps = {
  $gridArea: string;
} & ControlledProps;

const interactivePanelControlStyle = ({
  $controlled,
  theme
}: ControlledProps & { theme: Theme }) => css`
  cursor: pointer;
  background-color: ${theme.panelControlGray};
  border-radius: 0.25rem;
  min-width: 40px;
  min-height: 40px;
  width: fit-content;
  height: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.panelControlText};
  width: ${$controlled ? 'auto' : '100%'};

  ${!$controlled &&
  `@media ${theme.isLargerThanPhone} {
        width: auto;
    }
  `}
`;

export const PanelControlWrapper = styled('li')`
  display: contents;
`;

export const ContentSpan = styled('span')`
  display: contents;
`;

export const PanelControlSlider = styled('div')<PanelControlSliderProps>`
  ${(props) =>
    interactivePanelControlStyle({
      $controlled: props.$controlled,
      theme: props.theme
    })}
  grid-area: ${({ $gridArea }) => $gridArea};
  max-height: 40px;
`;

export const MutedMarkSlider = styled(Slider)`
  flex-grow: 1;
  color: ${({ theme }) => theme.gbaThemeBlue};
  padding: 0;

  > .MuiSlider-rail {
    opacity: 0.28;
  }

  > .MuiSlider-track {
    background-color: ${({ theme }) => theme.panelSliderAccent};
    border-color: ${({ theme }) => theme.panelSliderAccent};
  }

  > .MuiSlider-thumb {
    background-color: ${({ theme }) => theme.panelSliderAccent};
  }

  > .MuiSlider-markActive {
    opacity: 1;
    background-color: currentColor;
  }

  @media (pointer: coarse) {
    padding: 0;
  }
`;

export const PanelControlButton = styled(ButtonBase)<
  ControlledProps & { $gridArea?: string }
>`
  ${({ $controlled, theme }) =>
    interactivePanelControlStyle({
      $controlled: $controlled,
      theme: theme
    })}

  ${({ $gridArea }) => $gridArea && `grid-area: ${$gridArea};`} 

  border: none;
  flex-grow: 1;
  margin: 0;
  padding: 0;

  &:focus {
    box-shadow: 0 0 0 0.25rem ${({ theme }) => theme.menuToggleFocusRing};
  }

  &:active {
    color: ${({ theme }) => theme.gbaThemeBlue};
  }

  @media ${({ theme }) => theme.isMobileLandscape} {
    flex-shrink: 1;
    min-width: unset;
  }
`;

export const PanelSliderButton = styled(ButtonBase)`
  ${({ theme }) =>
    interactivePanelControlStyle({
      $controlled: true,
      theme: theme
    })}

  border: none;

  & svg {
    width: 2em;
    height: 2em;
  }

  &:active {
    color: ${({ theme }) => theme.gbaThemeBlue};
  }

  @media ${({ theme }) => theme.isMobileLandscape} {
    flex-shrink: 1;
    min-width: unset;
  }
`;
