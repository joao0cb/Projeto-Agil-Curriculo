export const LAB_NAME_REQUIRED = "O nome do laboratório é obrigatório.";
export const LAB_LOCAL_REQUIRED = "Informe o local ou bloco do laboratório.";
export const EQUIPMENT_SERIAL_REQUIRED = "O número de série é obrigatório.";

export type LabFormDraft = {
  name: string;
  local: string;
  capacity?: number | null;
};

export function validateLabDraft(draft: LabFormDraft): string | null {
  if (!draft.name.trim()) return LAB_NAME_REQUIRED;
  if (!draft.local.trim()) return LAB_LOCAL_REQUIRED;
  return null;
}

export type EquipmentFormDraft = {
  name: string;
  serialNumber: string;
  labId?: string | null;
};

export function validateEquipmentDraft(draft: EquipmentFormDraft): string | null {
  if (!draft.name.trim()) return "Informe o nome do equipamento.";
  if (!draft.serialNumber.trim()) return EQUIPMENT_SERIAL_REQUIRED;
  return null;
}
