import { BodyWrapper } from '../shared/styled.tsx';

import type { ReactNode } from 'react';

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export const ModalBody = ({ children, className }: ModalBodyProps) => {
  return <BodyWrapper className={className}>{children}</BodyWrapper>;
};
