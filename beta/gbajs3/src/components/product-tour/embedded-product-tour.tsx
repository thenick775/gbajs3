import { useState } from 'react';
import Joyride, { STATUS, type Step } from 'react-joyride';
import { useInterval, useLocalStorage } from 'usehooks-ts';

import type { CompletedProductTourSteps } from './product-tour-intro.tsx';

type EmbeddedProductTourProps = {
  allowScrolling?: boolean;
  completedProductTourStepName: string;
  renderWithoutDelay?: boolean;
  millisecondDelay?: number;
  skipIfIntroSkipped?: boolean;
  zIndex?: number;
  steps: TourSteps;
};

export type TourSteps = Step[];

export const EmbeddedProductTour = ({
  completedProductTourStepName,
  steps,
  zIndex = 500, // note, value here is +100 in react joyride/floater
  allowScrolling = true,
  renderWithoutDelay = false,
  millisecondDelay = 800,
  skipIfIntroSkipped = true
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
        STATUS.SKIPPED)
  )
    return null;

  return (
    <Joyride
      continuous
      disableScrollParentFix={allowScrolling}
      hideCloseButton
      showProgress
      showSkipButton
      steps={steps}
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
