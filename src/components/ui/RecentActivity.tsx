const recent = [
    { user: "admin", action: "uploaded floor plan for Building A", date: "2025-04-24" },
    { user: "dev1", action: "added navigation point QR-12", date: "2025-04-23" },
  ];
  
  export default function RecentActivity() {
    return (
      <div className="bg-white p-4 shadow rounded-xl">
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <ul className="space-y-2">
          {recent.map((item, i) => (
            <li key={i} className="text-sm text-gray-700">
              <strong>{item.user}</strong> {item.action} <span className="text-gray-400">({item.date})</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  