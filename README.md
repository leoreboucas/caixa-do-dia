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
npm test              # testes (domínio + repositórios em SQLite real)
npm run typecheck     # checagem de tipos
npm run db:generate   # gera nova migration depois de mudar src/db/schema.ts
```

> Requer Node 22+ (os testes de repositório usam o SQLite embutido do Node).

### Expo Go e versão do SDK

O projeto usa o **Expo SDK 54**, que é a versão compatível com o Expo Go da App Store/Play Store.
SDKs mais novos (55+) não rodam no Expo Go da loja no iPhone; exigem `eas go` (TestFlight) ou um
development build. Só atualize o SDK quando o Expo Go da loja também for atualizado
(veja https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/).

Use sempre `npx expo install <pacote>` para adicionar bibliotecas, assim a versão fica compatível com o SDK.
O app é só mobile (Android/iOS); o SQLite não é suportado na web.

## Como o app pensa

O centro do app é o **fechamento do dia**, não a venda individual:

1. **Abrir o dia:** caixa inicial (sugerido pelo caixa final do último dia fechado).
2. **Durante/fim do dia:** registrar as compras (produtos com quantidade) e a **venda total**.
3. **Resumo:** bruto, despesas, líquido e caixa final.

```
Bruto        = venda total do dia
Despesas     = soma de (quantidade x custo) dos itens comprados
Líquido      = bruto - despesas
Caixa final  = caixa inicial + bruto - despesas   (caixa inicial não é receita)
```

## Regras importantes

- **Dinheiro sempre em centavos (inteiro).** Formatação só na tela (`formatBRL`).
- **Datas são `YYYY-MM-DD` no fuso local.** Nunca use `toISOString()` (vira o dia seguinte à noite no Brasil).
- **Editar o preço no cadastro do produto** vale só para itens adicionados daqui para frente.
- **Editar o preço dentro de um fechamento** altera só aquele item daquele dia (`closing_items`).
- Cada item do fechamento guarda um **snapshot** (nome, tipo, unidades por pacote, custo): o histórico nunca muda sozinho.
- Produtos são **arquivados**, não apagados.
- Custo unitário = custo do pacote / unidades por pacote (opcional). Não é arredondado nos cálculos, só na exibição.
- Dias sem movimento simplesmente não são lançados.

## Estrutura

```
src/
  app/            # telas (expo-router): (tabs)/index = Hoje, produtos, historico
  db/             # schema.ts (Drizzle), client.ts, migrations/ (SQL gerado)
  domain/         # regras puras e testadas: money, date, productCost, closing, validation (Zod)
  repositories/   # acesso ao banco: products.ts, closings.ts
  components/     # MoneyInput (teclado estilo maquininha), ScreenPlaceholder
  theme/          # cores, espaçamento, tipografia
```

## Estado atual

Pronto e testado: schema + migrations, regras de cálculo, validações, repositórios.
Provisório: as 3 telas são placeholders (navegação e tema funcionando). Próximo passo: desenhar e implementar as telas reais.

## Backup (ainda não implementado)

Sem backup, trocar de celular apaga tudo. Sugestão: exportar o arquivo `caixa-do-dia.db`
(ou CSV) pelo menu de compartilhar do sistema, com `expo-file-system` + `expo-sharing`.
