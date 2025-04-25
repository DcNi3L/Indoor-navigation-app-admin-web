import { useState } from "react";
import { createPortal } from "react-dom";
import { FaUserCircle, FaEdit, FaSave } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { translations } from "../../utils/translations";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "EN" | "RU";
}

export default function ProfileModal({ isOpen, onClose, language }: ProfileModalProps) {
  const t = translations[language];

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+123456789");
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [role, setRole] = useState("Administrator");

  const handleSave = () => {
    setIsEditing(false);
    console.log("Profile saved:", { firstName, lastName, email, phone, birthDate, role });
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay размытый фон */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      ></div>

      {/* Модальное окно */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-3xl p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-lg"
          >
            <IoClose size={26}/>
          </button>

          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700 text-white flex items-center justify-center text-5xl mb-3">
              <FaUserCircle />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t.profile}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label={t.firstName} value={firstName} setValue={setFirstName} isEditing={isEditing} />
            <Field label={t.lastName} value={lastName} setValue={setLastName} isEditing={isEditing} />
            <Field label="Email" value={email} setValue={setEmail} isEditing={isEditing} />
            <Field label={t.phone} value={phone} setValue={setPhone} isEditing={isEditing} />
            <Field label={t.birthDate} value={birthDate} setValue={setBirthDate} isEditing={isEditing} type="date" />
            <Field label={t.role} value={role} setValue={setRole} isEditing={isEditing} />
          </div>

          <div className="flex justify-center mt-6">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded"
              >
                <FaSave /> {t.save}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded"
              >
                <FaEdit /> {t.edit}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body // --- создаем портал в body
  );
}

function Field({
  label,
  value,
  setValue,
  isEditing,
  type = "text",
}: {
  label: string;
  value: string;
  setValue: (val: string) => void;
  isEditing: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        disabled={!isEditing}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full px-4 py-2.5 rounded border text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none ${
          isEditing ? "focus:ring-2 focus:ring-blue-500" : ""
        }`}
      />
    </div>
  );
}
