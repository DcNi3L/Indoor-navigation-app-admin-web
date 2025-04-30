export interface BuildingTypeOption {
    label: string;
    value: string;
  }
  
  export const buildingTypes: BuildingTypeOption[] = [
    { value: "HOUSE", label: "House" },
    { value: "EDUCATIONAL", label: "Educational" },
    { value: "MEDICAL", label: "Medical" },
    { value: "MAL", label: "Mall"},
  ];