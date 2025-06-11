"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useUserByEmail, useInvalidateAuthQueries } from "../../services/authApiService"
import { useAllBuildings, useAllFloors, useRoutes } from "../../services/useBuildingService"
import { useState, useEffect, useMemo } from "react"
import {
  FaArrowLeft,
  FaEdit,
  FaEnvelope,
  FaUser,
  FaCalendar,
  FaCog,
  FaHistory,
  FaDownload,
  FaTrash,
  FaBuilding,
  FaMap,
  FaRoute,
  FaSave,
  FaTimes,
  FaShieldAlt,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa"
import { useTranslation } from "react-i18next"
import { toast } from "react-hot-toast"
import Cookies from "js-cookie"

interface EditFormData {
  firstName: string
  lastName: string
  email: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
}

export default function AdminProfile() {
  const { id } = useParams<{ id: string }>() // email parameter
  const navigate = useNavigate()
  const { t } = useTranslation()
  const currentUserEmail = Cookies.get("userEmail")
  const isOwnProfile = currentUserEmail === id

  const { data: admin, isLoading, isError, refetch } = useUserByEmail(id!)
  const { data: buildings = [] } = useAllBuildings()
  const { data: floors = [] } = useAllFloors()
  const { data: routes = [] } = useRoutes()
  const { invalidateUser } = useInvalidateAuthQueries()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editForm, setEditForm] = useState<EditFormData>({
    firstName: "",
    lastName: "",
    email: "",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Calculate real activity statistics
  const activityStats = useMemo(() => {
    if (!admin) return { buildings: 0, floors: 0, routes: 0 }

    const userBuildings = buildings.filter((b) => b.userId === admin.id)
    const userFloors = floors.filter((f) => userBuildings.some((b) => b.id === f.buildingId))
    const userRoutes = routes.filter((r) => userFloors.some((f) => f.id === r.floorId))

    return {
      buildings: userBuildings.length,
      floors: userFloors.length,
      routes: userRoutes.length,
    }
  }, [admin, buildings, floors, routes])

  // Initialize form when admin data loads
  useEffect(() => {
    if (admin && !isEditing) {
      setEditForm({
        firstName: admin.firstName || "",
        lastName: admin.lastName || "",
        email: admin.email || "",
      })
    }
  }, [admin, isEditing])

  // Form validation
  const validateForm = (data: EditFormData): FormErrors => {
    const errors: FormErrors = {}

    if (!data.firstName.trim()) {
      errors.firstName = t("firstNameRequired")
    } else if (data.firstName.length < 2) {
      errors.firstName = t("firstNameTooShort")
    }

    if (!data.lastName.trim()) {
      errors.lastName = t("lastNameRequired")
    } else if (data.lastName.length < 2) {
      errors.lastName = t("lastNameTooShort")
    }

    if (!data.email.trim()) {
      errors.email = t("emailRequired")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = t("emailInvalid")
    }

    return errors
  }

  const handleEdit = () => {
    setEditForm({
      firstName: admin?.firstName || "",
      lastName: admin?.lastName || "",
      email: admin?.email || "",
    })
    setFormErrors({})
    setIsEditing(true)
  }

  const handleSave = async () => {
    const errors = validateForm(editForm)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error(t("pleaseFixErrors"))
      return
    }

    setIsSaving(true)
    try {
      // TODO: Implement actual API call to update user
      // await updateUser(admin.id, editForm)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success(t("profileUpdatedSuccessfully"))
      setIsEditing(false)
      invalidateUser(admin?.email)
      refetch()
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error?.message || t("failedToUpdateProfile"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormErrors({})
    setEditForm({
      firstName: admin?.firstName || "",
      lastName: admin?.lastName || "",
      email: admin?.email || "",
    })
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      // TODO: Implement actual API call to delete user
      // await deleteUser(admin.id)

      toast.success(t("accountDeletedSuccessfully"))
      navigate("/dashboard")
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast.error(error?.message || t("failedToDeleteAccount"))
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleExportData = async () => {
    try {
      const exportData = {
        profile: admin,
        statistics: activityStats,
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `admin-profile-${admin?.email}-${new Date().toISOString().split("T")[0]}.json`
      link.click()

      URL.revokeObjectURL(url)
      toast.success(t("dataExportedSuccessfully"))
    } catch (error) {
      toast.error(t("failedToExportData"))
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "AD"
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("notAvailable")
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getAccountStatus = () => {
    // TODO: Implement real account status logic
    return {
      status: "active",
      color: "green",
      label: t("active"),
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("loadingAdminProfile")}</p>
        </div>
      </div>
    )
  }

  if (isError || !admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <FaUser className="text-red-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("adminNotFound")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t("adminNotFoundDescription")}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
          >
            {t("backToDashboard")}
          </button>
        </div>
      </div>
    )
  }

  const accountStatus = getAccountStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-6 mt-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            aria-label={t("backToDashboard")}
          >
            <FaArrowLeft size={20} />
          </button>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("adminProfile")}
              {isOwnProfile && (
                <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                  {t("yourProfile")}
                </span>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">{t("manageAdministratorInformation")}</p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 bg-${accountStatus.color}-500 rounded-full`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{accountStatus.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Profile Card */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center">
                <div className="relative inline-block">
                  {admin.pictureUrl ? (
                    <img
                      src={admin.pictureUrl || "/placeholder.svg"}
                      alt={t("adminAvatar")}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                      <span className="text-2xl font-bold text-indigo-600">
                        {getInitials(admin.firstName, admin.lastName)}
                      </span>
                    </div>
                  )}

                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <FaShieldAlt className="text-white text-sm" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white mt-4">
                  {admin.firstName} {admin.lastName}
                </h2>
                <p className="text-indigo-100 break-all">{admin.email}</p>
              </div>

              {/* Quick Actions */}
              <div className="p-6 space-y-3">
                {isOwnProfile && (
                  <button
                    onClick={handleEdit}
                    disabled={isEditing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                  >
                    <FaEdit />
                    {t("editProfile")}
                  </button>
                )}

                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <FaDownload />
                  {t("exportData")}
                </button>

                {isOwnProfile && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                      showDeleteConfirm
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                    } disabled:opacity-50`}
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : showDeleteConfirm ? (
                      <>
                        <FaCheck />
                        {t("confirmDelete")}
                      </>
                    ) : (
                      <>
                        <FaTrash />
                        {t("deleteAccount")}
                      </>
                    )}
                  </button>
                )}

                {showDeleteConfirm && (
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <FaTimes />
                    {t("cancel")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="xl:col-span-3 space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaUser className="text-indigo-500" />
                  {t("personalInformation")}
                </h3>
                {!isEditing && isOwnProfile && (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FaEdit size={14} />
                    {t("edit")}
                  </button>
                )}
              </div>

              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSave()
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("firstName")} *
                      </label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          formErrors.firstName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder={t("enterFirstName")}
                        required
                      />
                      {formErrors.firstName && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <FaExclamationTriangle size={12} />
                          {formErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("lastName")} *
                      </label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          formErrors.lastName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder={t("enterLastName")}
                        required
                      />
                      {formErrors.lastName && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <FaExclamationTriangle size={12} />
                          {formErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("emailAddress")} *
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        formErrors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder={t("enterEmailAddress")}
                      required
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <FaExclamationTriangle size={12} />
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FaSave />
                      )}
                      {isSaving ? t("saving") : t("saveChanges")}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t("firstName")}
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {admin.firstName || t("notProvided")}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t("lastName")}
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {admin.lastName || t("notProvided")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t("emailAddress")}
                      </label>
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="text-gray-400" />
                        <p className="text-lg font-semibold text-gray-900 dark:text-white break-all">{admin.email}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t("role")}
                      </label>
                      <div className="flex items-center gap-2">
                        <FaShieldAlt className="text-indigo-500" />
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium">
                          {t("administrator")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Account Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <FaCog className="text-indigo-500" />
                {t("accountInformation")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t("accountCreated")}
                  </label>
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(admin.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t("lastUpdated")}
                  </label>
                  <div className="flex items-center gap-2">
                    <FaHistory className="text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(admin.updatedAt)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t("accountStatus")}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 bg-${accountStatus.color}-500 rounded-full`}></div>
                    <span
                      className={`px-3 py-1 bg-${accountStatus.color}-100 dark:bg-${accountStatus.color}-900/30 text-${accountStatus.color}-600 dark:text-${accountStatus.color}-400 rounded-full text-sm font-medium`}
                    >
                      {accountStatus.label}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t("permissions")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                      {t("fullAccess")}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                      {t("userManagement")}
                    </span>
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded text-xs font-medium">
                      {t("systemConfig")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <FaHistory className="text-indigo-500" />
                {t("activitySummary")}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <FaBuilding className="text-2xl text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activityStats.buildings}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">{t("buildingsManaged")}</div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <FaMap className="text-2xl text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activityStats.floors}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">{t("floorsCreated")}</div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <FaRoute className="text-2xl text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activityStats.routes}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">{t("routesDesigned")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
