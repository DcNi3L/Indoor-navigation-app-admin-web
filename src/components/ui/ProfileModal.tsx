"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Cookies from "js-cookie"
import { createPortal } from "react-dom"
import { FaUserCircle, FaEdit, FaSave, FaTrash, FaEye, FaEyeSlash } from "react-icons/fa"
import { IoClose } from "react-icons/io5"
import { useUserByEmail, useUpdateUserProfile, useDeleteUserProfile } from "../../services/authApiService"
import { useTranslation } from "react-i18next"
import { toast } from "react-hot-toast"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  language: "EN" | "RU"
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { t } = useTranslation()
  const userEmail = Cookies.get("userEmail") ?? ""
  const { data: user, isLoading } = useUserByEmail(userEmail)
  const updateProfileMutation = useUpdateUserProfile()
  const deleteProfileMutation = useDeleteUserProfile()

  // Set userId cookie when user data is available
  useEffect(() => {
    if (user?.id) {
      Cookies.set("userId", user.id.toString(), { expires: 3400 / 86400 })
    }
  }, [user?.id])

  const [pictureUrl, setPictureUrl] = useState<string | null>(null)
  const [initialPictureUrl, setInitialPictureUrl] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "")
      setLastName(user.lastName || "")
      setEmail(user.email || "")
      setPictureUrl(user.pictureUrl || null)
      setInitialPictureUrl(user.pictureUrl || null)
      setPassword("") // Always start with empty password
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error(t("fillAllFields"))
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error(t("invalidEmail"))
      return
    }

    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    }

    // Only include password if it's provided
    if (password.trim()) {
      if (password.length < 6) {
        toast.error(t("passwordTooShort"))
        return
      }
      updateData.password = password.trim()
    }

    // Only include pictureUrl if it changed
    if (pictureUrl !== initialPictureUrl) {
      updateData.pictureUrl = pictureUrl
    }

    try {
      await updateProfileMutation.mutateAsync({
        email: userEmail,
        data: updateData,
      })

      // Update cookies if email changed
      if (email !== userEmail) {
        Cookies.set("userEmail", email, { expires: 3400 / 86400 })
      }

      setIsEditing(false)
      setInitialPictureUrl(pictureUrl)
      setPassword("") // Clear password field after successful update
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFirstName(user?.firstName || "")
    setLastName(user?.lastName || "")
    setEmail(user?.email || "")
    setPictureUrl(initialPictureUrl)
    setPassword("")
    setShowPassword(false)
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("imageTooLarge"))
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(t("invalidImageType"))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setPictureUrl(reader.result as string)
        setIsEditing(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteProfile = async () => {
    if (!user) return

    try {
      await deleteProfileMutation.mutateAsync(userEmail)
      onClose() // Close modal before redirect
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const hasUnsavedChanges =
    pictureUrl !== initialPictureUrl ||
    firstName !== (user?.firstName || "") ||
    lastName !== (user?.lastName || "") ||
    email !== (user?.email || "") ||
    password.trim() !== ""

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={onClose}></div>

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-lg z-10">
            <IoClose size={26} />
          </button>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Profile Image */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-700 text-white flex items-center justify-center text-6xl mb-4">
                  {pictureUrl ? (
                    <img
                      src={pictureUrl || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <FaUserCircle />
                  )}
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 border-4 border-white dark:border-gray-900 shadow-md z-20 transition-transform transform hover:scale-110"
                    >
                      <FaEdit size={16} />
                    </button>
                  )}
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
                <span className="text-gray-500 dark:text-gray-400 text-sm">{email}</span>
              </div>

              {/* Input Fields */}
              <div className="space-y-5 mb-6">
                <Field
                  label={t("firstName")}
                  value={firstName}
                  setValue={setFirstName}
                  isEditing={isEditing}
                  required
                />
                <Field label={t("lastName")} value={lastName} setValue={setLastName} isEditing={isEditing} required />
                <Field
                  label={t("email")}
                  value={email}
                  setValue={setEmail}
                  isEditing={isEditing}
                  type="email"
                  required
                />
                {isEditing && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {t("newPassword")} ({t("optional")})
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("enterNewPassword")}
                        className="w-full px-4 py-2.5 pr-12 rounded-lg border text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                    {password && password.length < 6 && (
                      <p className="text-red-500 text-xs mt-1">{t("passwordTooShort")}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-center gap-4">
                  {hasUnsavedChanges && isEditing && (
                    <button
                      onClick={handleCancel}
                      disabled={updateProfileMutation.isPending}
                      className="px-6 py-2 rounded-full bg-orange-500 font-bold text-white hover:bg-orange-400 transition disabled:opacity-50"
                    >
                      {t("cancel")}
                    </button>
                  )}
                  {hasUnsavedChanges ? (
                    <button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="px-6 py-2 flex justify-center items-center font-bold rounded-full bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {updateProfileMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <FaSave className="inline mr-2" />
                      )}
                      {t("save")}
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

                {/* Delete Profile Section */}
                {!isEditing && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition"
                      >
                        {t("deleteProfile")}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                          {t("deleteProfileConfirm")}
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium transition"
                          >
                            {t("cancel")}
                          </button>
                          <button
                            onClick={handleDeleteProfile}
                            disabled={deleteProfileMutation.isPending}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center"
                          >
                            {deleteProfileMutation.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <FaTrash className="mr-2" />
                            )}
                            {t("deleteProfile")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}

function Field({
  label,
  value,
  setValue,
  isEditing,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  setValue: (val: string) => void
  isEditing: boolean
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        disabled={!isEditing}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none transition ${
          isEditing ? "focus:ring-2 focus:ring-blue-500" : ""
        } ${required && !value.trim() && isEditing ? "border-red-500" : ""}`}
      />
    </div>
  )
}
