import { Text as RNText, type TextProps } from 'react-native';
import { maxFontScale } from '@/theme';

const Text = (props: TextProps) => <RNText maxFontSizeMultiplier={maxFontScale} {...props} />;

export default Text;
