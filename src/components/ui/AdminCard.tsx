import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

interface AdminCardProps {
  admins: any[];
}

export default function AdminCards({ admins }: AdminCardProps) {
  const [visibleCount, setVisibleCount] = useState(3);
  const userEmail = Cookies.get("userEmail");
  const navigate = useNavigate();

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  const handleShowLess = () => {
    setVisibleCount((prev) => prev - 3);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 tracking-wide">Admins</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {admins.slice(0, visibleCount).map((admin: any) => (
          admin.email !== userEmail &&
          <div
            key={admin.id}
            onClick={() => navigate(`/admins/${admin.email}`)}
            className="cursor-pointer group bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md p-8 flex items-center justify-around transition transform hover:scale-105 hover:shadow-xl duration-300"
          >
            <div className="relative w-32 h-32">
              {admin.pictureUrl ? (
                <div className="absolute inset-0 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  <img src={admin.pictureUrl} alt="Admin Avatar" className="object-cover rounded-full" />
                </div>
              ) : (
                <div className="absolute inset-0 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center tracking-widest justify-center text-white text-3xl font-bold">
                  {admin.firstName?.[0]}
                  {admin.lastName?.[0]}
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">{admin.firstName} {admin.lastName}</h3>
              <p className="text-lg text-gray-500 dark:text-gray-300 break-all mt-1">{admin.email}</p>
            </div>
          </div>
        ))}
      </div>

      {visibleCount < admins.length ? (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleShowMore}
            className="px-6 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-full transition"
          >
            Show More
          </button>
        </div>
      ) : (visibleCount <= 3 ? <></> :
        <div className="flex justify-center mt-6">
          <button
            onClick={handleShowLess}
            className="px-6 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-full transition"
          >
            Show Less
          </button>
        </div>
      )}
    </div>
  );
}
