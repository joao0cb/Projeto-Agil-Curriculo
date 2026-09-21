export { ManutencaoPage } from "./components/ManutencaoPage";
export { TicketRow } from "./components/TicketRow";
export { ChamadoForm } from "./components/ChamadoForm";
export { PreventivaForm } from "./components/PreventivaForm";
export { CalibracaoCard } from "./components/CalibracaoCard";
export { EquipmentCard } from "./components/EquipmentCard";

export {
  useMaintenanceTickets,
  usePreventiveTasks,
  useCalibrations,
  useAbrirChamado,
  useAtualizarChamado,
  useRegistrarPreventiva,
  useRegistrarCalibracao,
} from "./services/useManutencao";

export * from "./domain/rules";
