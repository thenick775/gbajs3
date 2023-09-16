import Joyride, { STATUS, type Step } from 'react-joyride';
import { useLocalStorage } from 'usehooks-ts';

const steps: Step[] = [
  {
    content: (
      <>
        <h2>Welcome to Gbajs3!</h2>
        <p>Would you like to take a product tour?</p>
      </>
    ),
    locale: { skip: <strong aria-label="skip">Skip</strong> },
    placement: 'center',
    target: 'body'
  },
  {
    content: (
      <p>
        Use the sidebar navigation menu to load games and interact with your
        profile
      </p>
    ),
    locale: { skip: <strong aria-label="skip">Skip</strong> },
    placement: 'auto',
    spotlightPadding: 40,
    offset: 30,
    target: '#menu-wrapper'
  },
  {
    content: <p>Use the hamburger button to show and hide the menu</p>,
    locale: { skip: <strong aria-label="skip">Skip</strong> },
    placement: 'auto',
    spotlightPadding: 10,
    target: '#menu-btn'
  }
];

export const ProductTour = () => {
  const [hasCompletedProductTour, setHasCompletedProductTour] = useLocalStorage(
    'completedProductTour',
    false
  );

  if (hasCompletedProductTour) return null;

  return (
    <Joyride
      continuous
      hideCloseButton
      disableScrolling
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 1000
        }
      }}
      callback={({ status }) => {
        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
          setHasCompletedProductTour(true);
        }
      }}
    />
  );
};
