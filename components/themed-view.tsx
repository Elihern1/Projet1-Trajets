import { View, type ViewProps } from 'react-native';
import { useTheme } from '@react-navigation/native';

export function ThemedView({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return <View {...rest} style={[{ backgroundColor: colors.background }, style]} />;
}
