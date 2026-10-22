import { Stack } from 'expo-router';
import { headerOptions } from '@/theme/navigation';

const ProductsLayout = () => {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="products" options={{ title: 'Produtos' }} />
    </Stack>
  );
};

export default ProductsLayout;
