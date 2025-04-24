import { FaBuilding, FaMap, FaRoute, FaQrcode } from "react-icons/fa";

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 w-64 h-screen dark:bg-gray-900 dark:text-white p-6 z-40 shadow-md dark:shadow-gray-700">
      <h1 className="text-2xl font-bold mb-8 tracking-wide">Indoor Panel</h1>
      <ul className="space-y-6 text-lg">
        <li className="flex items-center space-x-3 hover:text-blue-400 cursor-pointer transition-colors">
          <FaBuilding /><span>Buildings</span>
        </li>
        <li className="flex items-center space-x-3 hover:text-blue-400 cursor-pointer transition-colors">
          <FaMap /><span>Floors</span>
        </li>
        <li className="flex items-center space-x-3 hover:text-blue-400 cursor-pointer transition-colors">
          <FaRoute /><span>Routes</span>
        </li>
        <li className="flex items-center space-x-3 hover:text-blue-400 cursor-pointer transition-colors">
          <FaQrcode /><span>QR Points</span>
        </li>
      </ul>
    </aside>
  );
}
