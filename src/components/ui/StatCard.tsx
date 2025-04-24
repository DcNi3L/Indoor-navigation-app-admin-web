import { ReactElement } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactElement;
  color?: string;
};

export default function StatCard({ title, value, icon, color = "bg-blue-100 text-blue-800" }: StatCardProps) {
  return (
    <div className={`p-4 rounded-xl shadow ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </div>
  );
}
