export { InsumosPage } from "./components/InsumosPage";
export { SupplyList } from "./components/SupplyList";
export { SupplyDetail } from "./components/SupplyDetail";
export { SupplyForm } from "./components/SupplyForm";
export { StockLevelBadge } from "./components/StockLevelBadge";
export {
  validateSupplyDraft,
  validateMovement,
  calculateBalance,
  stockLevel,
  daysUntilExpiry,
  isExpiringSoon,
  MOVEMENT_BALANCE_INSUFICIENTE,
  type Supply,
  type SupplyMovement,
  type SupplyDraft,
  type MovementType,
  type StockLevel,
} from "./domain/rules";
export {
  useSupplies,
  useSupplyDetail,
  useCreateSupply,
  useRegisterMovement,
  useSoftDeleteSupply,
} from "./services/useSupplies";
