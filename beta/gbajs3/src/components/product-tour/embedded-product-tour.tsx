import { useState } from 'react';
import Joyride, { STATUS, type Step } from 'react-joyride';
import { useInterval, useLocalStorage } from 'usehooks-ts';

import type { CompletedProductTourSteps } from './product-tour-intro.tsx';

type EmbeddedProductTourProps = {
  allowScrolling?: boolean;
  completedProductTourStepName: string;
  millisecondDelay?: number;
  renderWithoutDelay?: boolean;
  skipIfIntroSkipped?: boolean;
  skipRenderCondition?: boolean;
  steps: TourSteps;
  zIndex?: number;
};

const defaultStepOptions = {
  locale: { skip: <strong aria-label="Skip">Skip</strong> },
  placement: 'auto' as const,
  placementBeacon: 'right-end' as const,
  spotlightPadding: 10
};

export type TourSteps = Step[];

export const EmbeddedProductTour = ({
  completedProductTourStepName,
  skipRenderCondition,
  steps,
  allowScrolling = true,
  millisecondDelay = 800,
  renderWithoutDelay = false,
  skipIfIntroSkipped = true,
  zIndex = 500 // note, value here is +100 in react joyride/floater
}: EmbeddedProductTourProps) => {
  const [hasCompletedProductTourSteps, setHasCompletedProductTourSteps] =
    useLocalStorage<CompletedProductTourSteps>('completedProductTour', {
      [completedProductTourStepName]: false
    });
  const [shouldRender, setShouldRender] = useState(renderWithoutDelay);

  useInterval(
    () => {
      setShouldRender(true);
    },
    renderWithoutDelay ? null : millisecondDelay
  );

  if (
    !shouldRender ||
    hasCompletedProductTourSteps?.[completedProductTourStepName] ||
    (skipIfIntroSkipped &&
      hasCompletedProductTourSteps?.hasCompletedProductTourIntro ===
        STATUS.SKIPPED) ||
    skipRenderCondition
  )
    return null;

  const stepsWithDefault = steps.map((step) => ({
    ...defaultStepOptions,
    ...step
  }));

  return (
    <Joyride
      continuous
      disableScrollParentFix={allowScrolling}
      hideCloseButton
      showProgress
      showSkipButton
      steps={stepsWithDefault}
      styles={{
        options: {
          zIndex: zIndex
        }
      }}
      callback={({ status }) => {
        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
          setHasCompletedProductTourSteps((prevState) => ({
            ...prevState,
            [completedProductTourStepName]: status
          }));
        }
      }}
    />
  );
};
