import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import { FaCamera, FaTrashAlt, FaEdit, FaSun, FaMoon } from "react-icons/fa";
import { translations } from "../utils/translations";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<"EN" | "RU">("EN");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);  
  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };  
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropModalRef = useRef<HTMLDialogElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword || !profilePhoto) {
      setError("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("profilePhoto", profilePhoto);

    console.log("Submitting FormData:", Object.fromEntries(formData.entries()));
    // fetch('/api/register', { method: 'POST', body: formData });
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
    setLanguage(language === "EN" ? "RU" : "EN");
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
                aspect={1} // квадратное соотношение
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
                Crop and Save
                </button>
                <button
                onClick={() => {
                    cropModalRef.current?.close();
                    setTempPhoto(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                Cancel
                </button>
            </div>
            </>
        )}
        </dialog>

      {/* Main Form */}
      <div className="bg-white dark:bg-gray-800 px-5 py-6 rounded-lg shadow-md w-full max-w-2xl transition-all duration-300 flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-white">
          Create an account
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
                    <span className="text-xs mt-1">Upload</span>
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
              <label className="block text-gray-700 dark:text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
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
            className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded transition-all duration-300"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
        </p>

        <hr className="w-full my-6 border-gray-300 dark:border-gray-600" />

        {/* Переключатели темы и языка */}
        <div className="flex items-center justify-center space-x-6 mt-4 mb-2">
          {/* Переключатель языка */}
          <button
            onClick={toggleLanguage}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            {language}
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
