import { BodyWrapper } from '../shared/styled.tsx';

import type { ReactNode, UIEventHandler } from 'react';

type ModalBodyProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  onScroll?: UIEventHandler<HTMLDivElement>;
};

export const ModalBody = ({
  ariaLabel,
  children,
  className,
  onScroll
}: ModalBodyProps) => {
  return (
    <BodyWrapper
      aria-label={ariaLabel}
      className={className}
      onScroll={onScroll}
      role={ariaLabel ? 'region' : undefined}
    >
      {children}
    </BodyWrapper>
  );
};
