import { FaToilet, FaBed, FaChild, FaBath, FaUtensils } from "react-icons/fa";
import { IconType } from "react-icons";

const icons: Record<string, IconType> = {
  toilet: FaToilet,
  kitchen: FaUtensils,
  bedroom: FaBed,
  children: FaChild,
  bathroom: FaBath,
};

export default function POIIcon({ type, size = 20 }: { type: string; size?: number }) {
  const Icon = icons[type.toLowerCase()] || FaBed;
  return <Icon size={size} />;
}
