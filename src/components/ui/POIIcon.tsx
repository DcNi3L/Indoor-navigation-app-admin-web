import type React from "react"
import {
  FaToilet,
  FaBed,
  FaChild,
  FaBath,
  FaUtensils,
  FaCar,
  FaLeaf,
  FaCouch,
  FaShoppingBag,
  FaCoffee,
  FaCreditCard,
  FaParking,
  FaInfoCircle,
  FaBook,
  FaFlask,
  FaTheaterMasks,
  FaBuilding,
  FaRunning,
  FaHospital,
  FaUserMd,
  FaPills,
  FaXRay,
  FaAmbulance,
  FaMapMarkerAlt,
  FaCircle,
  FaGraduationCap,
  FaStore,
} from "react-icons/fa"
import { BiSolidDoorOpen } from "react-icons/bi";
import { MdElevator, MdStairs  } from "react-icons/md";
import { IoRestaurant } from "react-icons/io5";
import type { IconType } from "react-icons"

interface POIIconProps {
  type: string
  size?: number
  className?: string
}

const icons: Record<string, IconType> = {
  // House types
  toilet: FaToilet,
  kitchen: FaUtensils,
  bedroom: FaBed,
  living_room: FaCouch,
  bathroom: FaBath,
  garage: FaCar,
  garden: FaLeaf,
  children: FaChild,

  // Mall types
  shop: FaShoppingBag,
  store: FaStore,
  restaurant: IoRestaurant,
  cafe: FaCoffee,
  atm: FaCreditCard,
  escalator: MdStairs ,
  parking: FaParking,
  information: FaInfoCircle,

  // Educational types
  classroom: FaGraduationCap,
  library: FaBook,
  laboratory: FaFlask,
  auditorium: FaTheaterMasks,
  cafeteria: IoRestaurant,
  office: FaBuilding,
  gym: FaRunning,

  // Medical types
  reception: FaHospital,
  doctor_office: FaUserMd,
  surgery: FaHospital,
  pharmacy: FaPills,
  xray: FaXRay,
  emergency: FaAmbulance,

  // Common types
  entrance: BiSolidDoorOpen,
  exit: BiSolidDoorOpen,
  elevator: MdElevator,
  stairs: MdStairs,

  // Route types
  route: FaCircle,
  route_node: FaCircle,

  // Default
  default: FaMapMarkerAlt,
}

const POIIcon: React.FC<POIIconProps> = ({ type, size = 20, className = "" }) => {
  const Icon = icons[type.toLowerCase()] || icons.default

  return <Icon size={size} className={`${className} transition-colors duration-200`} />
}

export default POIIcon
