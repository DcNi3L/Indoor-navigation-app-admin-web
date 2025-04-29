export interface BuildingTypeOption {
    label: string;
    value: string;
  }
  
  export const buildingTypes: BuildingTypeOption[] = [
    { label: "House", value: "house" },
    { label: "Educational", value: "educational" },
    { label: "Medical", value: "medical" },
  ];