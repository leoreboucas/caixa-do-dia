import { TextInput as RNTextInput, type TextInputProps } from 'react-native';
import { maxFontScale } from '@/theme';

const TextInput = (props: TextInputProps) => <RNTextInput maxFontSizeMultiplier={maxFontScale} {...props} />;

export default TextInput;
