import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { isValidDateKey, todayKey, type DateKey } from '@/domain/date';
import {
  countClosingsAfter,
  getClosingByDate,
  getSuggestedOpeningCash,
  type ClosingWithItems,
} from '@/repositories/closings';
import { getProduct } from '@/repositories/products';

export type DayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      date: DateKey;
      /** null = o dia ainda não foi aberto */
      closing: ClosingWithItems | null;
      /** Caixa final do último dia fechado, para sugerir o caixa inicial */
      suggestedOpeningCents: number | null;
      /** Custo ATUAL do cadastro por produto, para marcar itens com custo diferente */
      currentCosts: Record<number, number>;
      /** Quantos dias existem depois deste (se > 0, editar pode deixar o caixa deles defasado) */
      laterDays: number;
    };

/** Lê o parâmetro `date` da rota; sem ele (ou inválido), usa hoje. */
export function useDateParam(): DateKey {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return date && isValidDateKey(date) ? date : todayKey();
}

/**
 * Carrega um dia toda vez que a tela ganha foco (inclusive ao voltar de uma tela de cadastro).
 * Sem `fixedDate`, usa o dia de hoje, recalculado a cada carga (vira à meia-noite).
 * Mantém o conteúdo antigo na tela durante a atualização e só mostra erro de tela cheia se nada foi carregado.
 */
export function useDay(fixedDate?: DateKey) {
  const [state, setState] = useState<DayState>({ status: 'loading' });
  const hasData = useRef(false);

  const load = useCallback(async () => {
    try {
      const date = fixedDate ?? todayKey();
      const closing = await getClosingByDate(date);
      const suggestedOpeningCents = closing ? null : await getSuggestedOpeningCash(date);
      const laterDays = await countClosingsAfter(date);
      const currentCosts: Record<number, number> = {};
      if (closing) {
        const products = await Promise.all(closing.items.map((item) => getProduct(item.productId)));
        for (const product of products) {
          if (product) currentCosts[product.id] = product.costCents;
        }
      }
      hasData.current = true;
      setState({ status: 'ready', date, closing, suggestedOpeningCents, currentCosts, laterDays });
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
}
