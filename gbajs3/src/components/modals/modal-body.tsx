import { BodyWrapper } from '../shared/styled.tsx';

import type { ReactNode, UIEventHandler } from 'react';

type ModalBodyProps = {
  children: ReactNode;
  className?: string;
  onScroll?: UIEventHandler<HTMLDivElement>;
};

export const ModalBody = ({
  children,
  className,
  onScroll
}: ModalBodyProps) => {
  return (
    <BodyWrapper className={className} onScroll={onScroll}>
      {children}
    </BodyWrapper>
  );
};
