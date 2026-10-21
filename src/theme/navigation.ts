import { colors } from '@/theme';

/** Cabeçalho comum das pilhas: fundo areia, título em verde escuro, título grande no iOS. */
export const headerOptions = {
  headerLargeTitle: true,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  /** Só a seta de voltar, sem o nome da tela anterior (que aparecia como "(tabs)") */
  headerBackButtonDisplayMode: 'minimal' as const,
  headerStyle: { backgroundColor: colors.background },
  headerLargeStyle: { backgroundColor: colors.background },
  headerTintColor: colors.primaryDark,
  headerTitleStyle: { color: colors.primaryDark },
  headerLargeTitleStyle: { color: colors.primaryDark },
};

/** Telas abertas por cima (modal): mesmo cabeçalho, sem título grande. */
export const modalHeaderOptions = {
  ...headerOptions,
  headerLargeTitle: false,
};
