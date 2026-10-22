import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { getClosingByDate, type ClosingWithItems } from '@/features/day/services';
import { getProduct } from '@/features/products';
import { todayKey, type DateKey } from '@/features/shared';

type DayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      date: DateKey;
      closing: ClosingWithItems | null;
      currentCosts: Record<number, number>;
    };

const useDay = (fixedDate?: DateKey) => {
  const [state, setState] = useState<DayState>({ status: 'loading' });
  const hasData = useRef(false);

  const load = useCallback(async () => {
    try {
      const date = fixedDate ?? todayKey();
      const closing = await getClosingByDate(date);
      const currentCosts: Record<number, number> = {};
      if (closing) {
        const products = await Promise.all(closing.items.map((item) => getProduct(item.productId)));
        for (const product of products) {
          if (product) currentCosts[product.id] = product.costCents;
        }
      }
      hasData.current = true;
      setState({ status: 'ready', date, closing, currentCosts });
    } catch (e) {
      if (hasData.current) return;
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido' });
    }
  }, [fixedDate]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    void load();
  }, [load]);

  return { state, reload: load, retry };
};

export default useDay;
