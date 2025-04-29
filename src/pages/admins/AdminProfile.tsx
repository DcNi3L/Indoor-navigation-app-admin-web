import { useParams } from "react-router-dom";
import { useUserByEmail } from "../../services/authApiService";

export default function AdminProfile() {
  const { id } = useParams<{ id: string }>(); // это теперь email!!

  const { data: admin, isLoading, isError } = useUserByEmail(id!);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError || !admin) return <div className="p-6">Admin not found.</div>;

  return (
    <div className="p-6 mt-12 text-gray-900 dark:text-white space-y-6">
      <div className="flex flex-col items-center">
        {admin.pictureUrl ? (
          <div className="w-64 h-64 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-4xl mb-4">
            <img src={admin.pictureUrl} alt="Admin Avatar" className="object-cover rounded-full" />
          </div>
        ) : (
          <div className="w-64 h-64 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-4xl mb-4">
            {admin.firstName?.[0]}{admin.lastName?.[0]}
          </div>
        )}
        <h1 className="text-2xl font-bold">{admin.firstName} {admin.lastName}</h1>
        <p className="text-gray-500 dark:text-gray-300">{admin.email}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Admin Details</h2>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li><strong>First Name:</strong> {admin.firstName}</li>
          <li><strong>Last Name:</strong> {admin.lastName}</li>
          <li><strong>Email:</strong> {admin.email}</li>
          {/* Добавь еще что хочешь */}
        </ul>
      </div>
    </div>
  );
}
