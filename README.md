# Caixa do Dia

App mobile (Expo + React Native + TypeScript) para gestão financeira diária de um pequeno comércio.
Funciona 100% offline, com os dados em SQLite no próprio celular.

## Como rodar

```bash
npm install
npx expo start        # abra no Expo Go, ou use `npm run android`
```

Outros comandos:

```bash
npm test              # testes (regras de negócio + serviços em SQLite real)
npm run typecheck     # checagem de tipos
npm run lint:check    # ESLint (inclui as regras de estrutura, veja "Convenções")
npm run format:check  # Prettier; use `npm run format` para corrigir
npm run db:generate   # gera nova migration depois de mudar src/db/schema.ts
```

> Requer Node 22+ (os testes dos serviços usam o SQLite embutido do Node).

Use sempre `npx expo install <pacote>` para adicionar bibliotecas, assim a versão fica compatível com o SDK.
O app é só mobile (Android/iOS); o SQLite não é suportado na web.

## Como o app pensa

O centro do app é o **lançamento do dia**, feito no fim do dia, não a venda individual:

1. **Caixa Inicial:** o dinheiro com que o dia começou.
2. **Compras:** os produtos comprados, com quantidade e custo.
3. **Caixa Final:** o dinheiro contado no caixa no fim do dia. O app calcula o resto.

```
Venda Total (Bruto) = Caixa Final - Caixa Inicial
Despesas            = soma de (quantidade x custo) dos itens comprados
Líquido             = Bruto - Despesas
```

O Caixa Inicial não é receita, e as compras não saem da conta do Caixa Final: elas só entram no Líquido.

## Regras importantes

- **Dinheiro sempre em centavos (inteiro).** Formatação só na tela (`formatBRL`).
- **Datas são `YYYY-MM-DD` no fuso local.** Nunca use `toISOString()` (vira o dia seguinte à noite no Brasil).
- **Editar o preço no cadastro do produto** vale só para itens adicionados daqui para frente.
- **Editar o preço dentro de um dia** altera só aquele item daquele dia (`closing_items`).
- Cada item do dia guarda um **snapshot** (nome, tipo, unidades por pacote, custo): o histórico nunca muda sozinho.
- Produtos são **arquivados**, não apagados.
- Custo unitário = custo do pacote / unidades por pacote (opcional). Não é arredondado nos cálculos, só na exibição.
- Dias sem movimento simplesmente não são lançados.

## Estrutura

```
src/
├── app/                      rotas do expo-router: só layouts e arquivos finos que reexportam a tela
│   ├── (tabs)/               abas: (today), (products), (history), (reports)
│   ├── add-purchase.tsx, close-day.tsx, edit-item.tsx, edit-opening-cash.tsx,
│   │   launch-day.tsx, product.tsx, day/[date].tsx
│   └── _layout.tsx
├── db/                       schema.ts (Drizzle), client.ts, testClient.ts, migrations/
├── features/
│   ├── day/                  lançamento do dia (Hoje, detalhe do dia, compras, caixa)
│   ├── products/             cadastro de produtos
│   ├── history/              lista de dias lançados
│   ├── reports/              relatórios por mês e de todos os meses
│   └── shared/               o que não tem dono: componentes, hooks, utils, validators, definitions
└── theme/                    cores, espaçamento, tipografia e movimento
```

Uma feature organiza os arquivos em subdiretórios por tipo, cada um com um `index.ts` (barrel). Só existem os
que ela usa:

```
features/day/
├── components/    pedaços de tela (DayView, DayPane, StepRow...)
├── hooks/         useDay, useDayPager, usePullToClose...
├── services/      acesso ao banco (closingService)
├── views/         as telas que uma rota renderiza (*Screen)
├── index.ts       barrel raiz: só o que outras features e as rotas usam
├── utils.ts, validators.ts      regras puras e schemas Zod (com testes ao lado)
```

## Convenções

Elas são conferidas pelo ESLint (`npm run lint:check`) sempre que possível.

- **Idioma:** pastas, arquivos e identificadores em inglês. Os textos da tela ficam em português.
- **Sem comentários em `src`.** A regra local `local/no-comments` impede novos; o nome do código deve dizer o que o comentário diria.
- **Importações:** caminho relativo só para o mesmo diretório (`./Arquivo`); o resto usa o alias `@/`.
  `import type` quando só há tipos; `type` dentro das chaves quando o import mistura valores e tipos.
- **Fronteiras entre features:** outra feature e as rotas importam só do barrel raiz (`@/features/day`).
  Dentro da feature, importa-se pelo barrel do subdiretório (`@/features/day/hooks`) ou pelo módulo da raiz,
  nunca pelo barrel raiz da própria feature. Componentes não importam `views/`. O `shared` não importa outras features.
  Para os testes rodarem em Node sem carregar React Native, módulos puros (`utils`, `validators`, `services`)
  importam do shared por `@/features/shared/utils`, `/validators` ou `/definitions`, que o lint libera.
- **Arquivos de componente:** um componente por arquivo, arrow function e `export default` no fim.
  Componente de uma tela só vive no arquivo de quem o usa; ganha arquivo próprio se for usado por mais de um.
  O arquivo do componente declara só componentes: hooks vão para `hooks/`, funções para o `utils.ts`.
- **Props:** tipagem inline até 4 props; a partir de 5, ou com objeto aninhado, uma `interface <Componente>Props`
  logo acima do componente, sem `export`.
- **Módulos de campo (`definitions/`):** o que descreve um campo (valores, labels, regras) fica num módulo com o
  nome do campo (`closingStatus`, `purchaseType`): o objeto `as const` e o tipo com o mesmo nome, `<campo>Labels`,
  `<campo>Options` e as regras do campo. Comparações usam o módulo (`isPack(type)`), nunca o valor escrito à mão.
- **Constantes:** `UPPER_CASE` só para valor simples e imutável; objetos e listas em camelCase; o objeto que
  funciona como enum, em PascalCase. A constante fica no módulo a que pertence.
- **Telas:** uma tela de rota vive em `features/<feature>/views/<Nome>Screen.tsx`, e o arquivo em `src/app`
  só reexporta (`export { TodayScreen as default } from '@/features/day';`).
- **Textos exibidos** usam os termos do negócio com inicial maiúscula: Caixa Inicial, Caixa Final, Venda Total, Bruto,
  Despesas, Líquido.
- **Testes** ficam ao lado do arquivo testado, com as fases Arrange/Act/Assert separadas por uma linha em branco.

## Backup (ainda não implementado)

Sem backup, trocar de celular apaga tudo. Sugestão: exportar o arquivo `caixa-do-dia.db`
(ou CSV) pelo menu de compartilhar do sistema, com `expo-file-system` + `expo-sharing`.
