import { styled } from '@mui/material/styles';

import { useModalContext } from '../../hooks/context.tsx';
import { HeaderWrapper, Header } from '../shared/styled.tsx';

type ModalHeaderProps = {
  title: string;
  showExitIndicator?: boolean;
  onClose?: () => void;
};

const CloseButton = styled('button')`
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  margin: 0 0 0 auto;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background-color: transparent;
  opacity: 1;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease,
    opacity 120ms ease;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3e%3cpath d='M3.227 3.227a.75.75 0 011.06 0L8 6.94l3.713-3.713a.75.75 0 111.06 1.06L9.06 8l3.713 3.713a.75.75 0 11-1.06 1.06L8 9.06l-3.713 3.713a.75.75 0 11-1.06-1.06L6.94 8 3.227 4.287a.75.75 0 010-1.06z' fill='%23a9b4c2'/%3e%3c/svg%3e");
  background-position: center;
  background-repeat: no-repeat;
  background-size: 1.1rem 1.1rem;

  &:hover {
    background-color: ${({ theme }) => theme.modalCloseButtonHoverSurface};
    border-color: ${({ theme }) => theme.modalCloseButtonHoverBorder};
  }

  &:focus-visible {
    outline: none;
    background-color: ${({ theme }) => theme.modalCloseButtonHoverSurface};
    border-color: ${({ theme }) => theme.gbaThemeBlue};
    box-shadow: 0 0 0 0.25rem ${({ theme }) => theme.focusRingPrimary};
  }
`;

export const ModalHeader = ({
  title,
  showExitIndicator = true,
  onClose
}: ModalHeaderProps) => {
  const { setIsModalOpen } = useModalContext();

  return (
    <HeaderWrapper>
      <Header id="modalHeader">{title}</Header>
      {showExitIndicator && (
        <CloseButton
          aria-label="Close"
          onClick={() => {
            setIsModalOpen(false);
            onClose?.();
          }}
        />
      )}
    </HeaderWrapper>
  );
};
