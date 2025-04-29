import { JSX } from "react";

export default function ActionCard({
    color,
    icon,
    title,
    onClick,
  }: {
    color: string;
    icon: JSX.Element;
    title: string;
    onClick?: () => void;
  }) {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-6 rounded-xl text-white shadow-md transition-transform transform hover:scale-105 ${color}`}
      >
        <div className="mb-2">
          {icon}
        </div>
        <span className="font-semibold">{title}</span>
      </button>
    );
  }
  