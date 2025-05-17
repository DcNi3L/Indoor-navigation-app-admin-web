import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { createPortal } from "react-dom";
import { FaUserCircle, FaEdit, FaSave } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useUserByEmail } from "../../services/authApiService";
import { useTranslation } from "react-i18next";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "EN" | "RU";
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { t } = useTranslation();
  const userEmail = Cookies.get("userEmail") ?? "";
  const { data: user } = useUserByEmail(userEmail);
  Cookies.set("userId", user?.id.toString(), { expires: 3400 / 86400 });

  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [initialPictureUrl, setInitialPictureUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setPictureUrl(user.pictureUrl || null);
      setInitialPictureUrl(user.pictureUrl || null);
    }
  }, [user]);

  const handleSave = () => {
    setIsEditing(false);
    console.log("Profile saved:", { firstName, lastName, email, pictureUrl });
    setInitialPictureUrl(pictureUrl);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setEmail(user?.email || "");
    setPictureUrl(initialPictureUrl);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPictureUrl(reader.result as string);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const hasUnsavedChanges =
    pictureUrl !== initialPictureUrl ||
    firstName !== user?.firstName ||
    lastName !== user?.lastName ||
    email !== user?.email;

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl w-full max-w-lg p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-lg"
          >
            <IoClose size={26} />
          </button>

          {/* Profile Image */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-700 text-white flex items-center justify-center text-6xl mb-4">
              {pictureUrl ? (
                <img
                  src={pictureUrl}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <FaUserCircle />
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 border-4 border-white dark:border-gray-900 shadow-md z-20 transition-transform transform hover:scale-110"
              >
                <FaEdit size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-1">
              {firstName} {lastName}
            </h2>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {email}
            </span>
          </div>

          {/* Input Fields */}
          <div className="space-y-5 mb-6">
            <Field
              label={t("firstName")}
              value={firstName}
              setValue={setFirstName}
              isEditing={isEditing}
            />
            <Field
              label={t("lastName")}
              value={lastName}
              setValue={setLastName}
              isEditing={isEditing}
            />
            <Field
              label={t("email")}
              value={email}
              setValue={setEmail}
              isEditing={isEditing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {hasUnsavedChanges && isEditing && (
              <button
                onClick={handleCancel}
                className="px-6 py-2 rounded-full bg-orange-500 font-bold text-white hover:bg-orange-400 transition"
              >
                {t("cancel")}
              </button>
            )}
            {hasUnsavedChanges ? (
              <button
                onClick={handleSave}
                className="px-6 py-2 flex justify-center items-center font-bold rounded-full bg-green-500 text-white hover:bg-green-600 transition"
              >
                <FaSave className="inline mr-2" /> {t("save")}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-full bg-blue-500 flex justify-center items-center font-bold text-white hover:bg-blue-600 transition"
              >
                <FaEdit className="inline mr-2" /> {t("edit")}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
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
        className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none transition ${isEditing ? "focus:ring-2 focus:ring-blue-500" : ""}`}
      />
    </div>
  );
}
