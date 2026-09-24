/**
 * 🎭 MOCK DE PREVIEW — `convex/react` sem backend.
 *
 * Ativado APENAS no preview do Vite via alias em `vite.config.ts`
 * (resolve.alias). O `vitest.config.ts` não tem esse alias, então os testes
 * seguem com o `convex/react` real; um build de produção com backend também
 * não passa por aqui.
 *
 * Comportamento (por que a tela branca sumiu):
 * - `useQuery` busca os dados em `demoData.ts` pelo caminho da função
 *   (ex.: `manutencao.listarChamados`) e devolve uma cópia estável; queries
 *   não semeadas retornam `[]` — estado válido, nunca crash;
 * - `useMutation` devolve uma função que **rejeita** com mensagem clara:
 *   assim o tratamento de erro dos formulários (adicionado na Etapa 1)
 *   pode ser validado visualmente;
 * - `ConvexProvider`/`ConvexReactClient` são pass-through para o
 *   `main.tsx` funcionar sem alterações.
 */

import type { ReactNode } from "react";
import { DEMO_QUERIES } from "./demoData";

type QueryRef = { __path: string };

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function useQuery<Args = unknown, Result = unknown>(
  queryRef: QueryRef,
  args?: Args | "skip",
): Result | undefined {
  if (args === "skip") return undefined;
  const path = queryRef?.__path ?? "";
  const seeded = DEMO_QUERIES[path];
  return (seeded === undefined ? [] : clone(seeded)) as Result;
}

export function useMutation<Args = unknown, Result = unknown>(
  _mutationRef: QueryRef,
): (args: Args) => Promise<Result> {
  void _mutationRef; // mutações não persistem no modo de demonstração
  return async () => {
    throw new Error(
      "Modo de demonstração (preview sem backend): a ação não foi persistida.",
    );
  };
}

export function ConvexProvider({
  children,
  // `client` chega do main.tsx e é ignorado no modo de demonstração.
}: {
  children: ReactNode;
  client?: unknown;
}) {
  return <>{children}</>;
}

export class ConvexReactClient {
  constructor(_address?: string) {
    void _address; // Sem backend: nenhuma conexão é aberta no modo de demonstração.
  }
}

export function useConvex() {
  return null;
}
