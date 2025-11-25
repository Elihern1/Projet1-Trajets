import { Text, type TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'link';
};

export function ThemedText({ style, type = 'default', children, ...rest }: ThemedTextProps) {
  const { colors, dark } = useTheme();
  const textColor = dark ? '#fff' : colors.text;

  return (
    <Text
      {...rest}
      style={[
        styles.base,
        { color: textColor },
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && { color: colors.primary },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
});
