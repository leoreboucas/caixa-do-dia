import { colors } from '@/theme';

export const headerOptions = {
  headerLargeTitle: true,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,

  headerBackButtonDisplayMode: 'minimal' as const,
  headerStyle: { backgroundColor: colors.background },
  headerLargeStyle: { backgroundColor: colors.background },
  headerTintColor: colors.primaryDark,
  headerTitleStyle: { color: colors.primaryDark },
  headerLargeTitleStyle: { color: colors.primaryDark },
};

export const modalHeaderOptions = {
  ...headerOptions,
  headerLargeTitle: false,
};
