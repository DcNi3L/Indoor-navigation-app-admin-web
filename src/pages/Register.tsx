import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import { FaCamera, FaTrashAlt, FaEdit, FaSun, FaMoon } from "react-icons/fa";
import { usePanelRegister } from "../services/authApiService"
import { supabase } from '../services/supabaseClient';
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t, i18n } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropModalRef = useRef<HTMLDialogElement>(null);

  const { mutateAsync: register } = usePanelRegister();

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTempPhoto(url);
      cropModalRef.current?.showModal();
    }
  };

  const handleCropAndSave = async () => {
    if (!tempPhoto || !croppedAreaPixels) return;

    const croppedImage = await getCroppedImg(tempPhoto, croppedAreaPixels);
    if (croppedImage) {
      setProfilePhoto(croppedImage);
      setPreviewPhoto(URL.createObjectURL(croppedImage));
      cropModalRef.current?.close();
      setTempPhoto(null);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setPreviewPhoto(null);
    setTempPhoto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let uploadedImageUrl = "";
    let filePath = "";

    try {
      // Валидация
      if ([firstName, lastName, email, password, confirmPassword, profilePhoto].some(field => !field)) {
        setError(t("errorFillFields"));
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError(t("errorInvalidEmail"));
        return;
      }

      if (password !== confirmPassword) {
        setError(t("errorPasswordMismatch"));
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_.])[A-Za-z\d@$!%*?&\-_.]{8,}$/;

      if (!passwordRegex.test(password)) {
        setError(t("errorWeakPassword"));
        return;
      }

      setError("");

      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${email}${Date.now()}.${fileExt}`;
        filePath = `panel/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, profilePhoto);

        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
          setError(t("errorUploadPhoto"));
          return;
        }

        const { data: publicUrlData } = supabase
          .storage
          .from('profile-images')
          .getPublicUrl(filePath);

        uploadedImageUrl = publicUrlData.publicUrl;
      }

      await register({
        email,
        password,
        firstName,
        lastName,
        pictureUrl: uploadedImageUrl,
      });

      navigate('/login');
    } catch (error: any) {
      console.error('Register error:', error);
      setError(t("errorRegistrationFailed"));
      if (filePath) {
        const { error: removeError } = await supabase
          .storage
          .from('profile-images')
          .remove([filePath]);
  
        if (removeError) {
          console.warn("Failed to clean up uploaded image:", removeError);
        } else {
          console.log("Rolled back image upload:", filePath);
        }
      }

      if (error.response) {
        setError(error.response.data.message || 'Registration failed.');
      } else if (error.request) {
        setError('No response from server.');
      } else {
        setError('Error setting up registration request.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (previewPhoto) URL.revokeObjectURL(previewPhoto);
      if (tempPhoto) URL.revokeObjectURL(tempPhoto);
    };
  }, [previewPhoto, tempPhoto]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ru" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Crop Modal */}
      <dialog ref={cropModalRef} className="rounded-lg backdrop:bg-black/50 p-6 border-none">
        {tempPhoto && (
          <>
            <div className="relative w-[300px] h-[300px] mx-auto overflow-hidden rounded-lg bg-gray-800">
              <Cropper
                image={tempPhoto}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={handleCropAndSave}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {t("cropAndSave")}
              </button>
              <button
                onClick={() => {
                  cropModalRef.current?.close();
                  setTempPhoto(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                {t("cancel")}
              </button>
            </div>
          </>
        )}
      </dialog>

      {/* Main Form */}
      <div className="bg-white dark:bg-gray-800 px-5 py-6 rounded-lg shadow-md w-full max-w-2xl transition-all duration-300 flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-white">
          {t("registerTitle")}
        </h2>

        {error && <div className="mb-6 text-red-500 text-center">{error}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Аватарка */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div
                onClick={handlePhotoClick}
                className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-blue-500 flex items-center justify-center cursor-pointer"
              >
                {previewPhoto ? (
                  <img
                    src={previewPhoto}
                    alt="Avatar Preview"
                    className="object-cover w-full h-full rounded-full"
                  />
                ) : (
                  <div className="text-gray-500 dark:text-gray-300 text-sm flex flex-col items-center">
                    <FaCamera size={24} />
                    <span className="text-xs mt-1">{t("upload")}</span>
                  </div>
                )}
              </div>

              {previewPhoto && (
                <div className="flex justify-center gap-6 mt-2">
                  <button
                    type="button"
                    onClick={handlePhotoClick}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                  >
                    <FaEdit />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="flex items-center gap-2 text-red-400 hover:text-red-600"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          {/* Поля регистрации */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">{t("firstName")}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">{t("lastName")}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">{t("emailLabel")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">{t("passwordLabel")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">{t("confirmPassword")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded transition-all duration-300"
          >
            {t("register")}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
          {t("haveAccount")} <Link to="/login" className="text-blue-500 hover:underline">{t("loginButton")}</Link>
        </p>

        <hr className="w-full my-6 border-gray-300 dark:border-gray-600" />

        {/* Переключатели темы и языка */}
        <div className="flex items-center justify-center space-x-6 mt-4 mb-2">
          {/* Переключатель языка */}
          <button
            onClick={toggleLanguage}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            {i18n.language.toLowerCase() === "en" ? 
              <img src="https://flagcdn.com/gb.svg" width="24" alt="EN" />
              :
              <img src="https://flagcdn.com/ru.svg" width="24" alt="RU" />
            }
          </button>

          {/* Переключатель темы */}
          <button
            onClick={toggleDarkMode}
            className="text-xl text-gray-700 dark:text-gray-300 hover:text-yellow-400 transition"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>
    </div>
  );
}
