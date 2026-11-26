import { useTheme } from '@mui/material/styles';
import { FaGripLines } from 'react-icons/fa';

type GripperHandleProps = {
  variation?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
};

const getRotationDegrees = (v: GripperHandleProps['variation']) => {
  switch (v) {
    case 'topLeft':
      return '-45deg';
    case 'topRight':
      return '45deg';
    case 'bottomLeft':
      return '45deg';
    case 'bottomRight':
      return '-45deg';
    default:
      return '0deg';
  }
};

export const GripperHandle = ({ variation }: GripperHandleProps) => {
  const theme = useTheme();

  return (
    <FaGripLines
      data-testid="gripper-handle"
      color={theme.gbaThemeBlue}
      style={{ transform: `rotate(${getRotationDegrees(variation)})` }}
    />
  );
};
