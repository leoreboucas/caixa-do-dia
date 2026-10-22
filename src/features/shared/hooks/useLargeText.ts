import { useWindowDimensions } from 'react-native';
import { largeTextScale } from '@/theme';

const useLargeText = (): boolean => {
  return useWindowDimensions().fontScale >= largeTextScale;
};

export default useLargeText;
