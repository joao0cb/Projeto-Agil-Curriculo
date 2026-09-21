import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { MaintenanceTicketDraft } from "../domain/rules";

type TicketFilters = {
  status?: string;
  equipmentId?: string;
};

export function useMaintenanceTickets(filters: TicketFilters = {}) {
  const tickets = useQuery(api.manutencao.listarChamados, {
    status: filters.status || undefined,
    equipmentId: (filters.equipmentId || undefined) as Id<"equipment"> | undefined,
  });
  return tickets;
}

export function usePreventiveTasks(upcomingOnly = false) {
  const tasks = useQuery(api.manutencao.listarPreventivas, { upcomingOnly });
  return tasks;
}

export function useCalibrations(equipmentId?: string) {
  const calibrations = useQuery(api.manutencao.listarCalibracoes, {
    equipmentId: (equipmentId || undefined) as Id<"equipment"> | undefined,
  });
  return calibrations;
}

export function useAbrirChamado() {
  const abrirChamado = useMutation(api.manutencao.abrirChamado);
  return async (draft: MaintenanceTicketDraft) => {
    const id = await abrirChamado({
      ...draft,
      equipmentId: draft.equipmentId as Id<"equipment">,
    });
    return id as string;
  };
}

export function useAtualizarChamado() {
  const atualizarChamado = useMutation(api.manutencao.atualizarChamado);
  return async (
    ticketId: string,
    args: { status: string; assigneeId?: string; note?: string }
  ) => {
    await atualizarChamado({
      ticketId: ticketId as Id<"maintenanceTickets">,
      status: args.status as "aberto" | "em andamento" | "aguardando peca" | "concluido" | "cancelado",
      assigneeId: args.assigneeId,
      note: args.note,
    });
    return ticketId;
  };
}

export function useRegistrarPreventiva() {
  const registrarPreventiva = useMutation(api.manutencao.registrarPreventiva);
  return async (
    taskId: string,
    args: { executionDate: number; responsibleId: string; note?: string }
  ) => {
    const next = await registrarPreventiva({
      taskId: taskId as Id<"preventiveTasks">,
      executionDate: args.executionDate,
      responsibleId: args.responsibleId,
      note: args.note,
    });
    return next as number | null;
  };
}

export function useRegistrarCalibracao() {
  const registrarCalibracao = useMutation(api.manutencao.registrarCalibracao);
  return async (
    equipmentId: string,
    args: {
      executionDate: number;
      responsibleId: string;
      result: string;
      certificateRef?: string;
      note?: string;
    }
  ) => {
    const id = await registrarCalibracao({
      equipmentId: equipmentId as Id<"equipment">,
      executionDate: args.executionDate,
      responsibleId: args.responsibleId,
      result: args.result as "aprovado" | "reprovado" | "nao_aplicavel",
      certificateRef: args.certificateRef,
      note: args.note,
    });
    return id as string;
  };
}
