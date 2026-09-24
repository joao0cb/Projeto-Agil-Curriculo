import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import type { MovementType, SupplyDraft } from "../domain/rules";

export type SupplyFilter = {
  search?: string;
  category?: string;
  onlyLowStock?: boolean;
};

/**
 * Serviço do módulo: único ponto de contato com o backend Convex.
 *
 * Observação (auditoria UX — 9.1): `useQuery` do Convex lança o erro durante
 * o render em falhas de rede/permissão. A UI exibe esse estado via
 * `QueryErrorBoundary` na página (InsumosPage), não via valor retornado.
 */
export function useSupplies(filters: SupplyFilter) {
  const supplies = useQuery(api.insumos.listSupplies, {
    search: filters.search || undefined,
    category: filters.category,
    onlyLowStock: filters.onlyLowStock,
  });
  const categories = useQuery(api.insumos.listCategories, {});
  return { supplies, categories };
}

export function useSupplyDetail(supplyId: string | null) {
  const detail = useQuery(
    api.insumos.getSupplyWithMovements,
    supplyId ? { supplyId: supplyId as Id<"supplies"> } : "skip"
  );
  return detail ?? null;
}

export function useCreateSupply() {
  return useMutation(api.insumos.createSupply);
}

export function useRegisterMovement() {
  return useMutation(api.insumos.registerMovement);
}

export function useSoftDeleteSupply() {
  return useMutation(api.insumos.softDeleteSupply);
}

export type CreateSupplyArgs = SupplyDraft & {
  brand?: string;
  supplier?: string;
  labId?: string;
  equipmentId?: string;
};

export type RegisterMovementArgs = {
  supplyId: string;
  type: MovementType;
  quantity: number;
  lot: string;
  expiresAt?: number;
  responsibleId: string;
  reservationId?: string;
  note?: string;
};
