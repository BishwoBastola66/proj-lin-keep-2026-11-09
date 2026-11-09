"use client";

import { useState, useTransition, useRef } from "react";
import {
  Settings,
  User,
  Shield,
  KeyRound,
  Mail,
  Phone,
  Briefcase,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Send,
  Lock,
} from "lucide-react";
import { getUserAvatar } from "@/lib/avatarHelper";
import {
  updateCurrentProfileDetailsAction,
  sendPasswordChangeOtpAction,
  changePasswordWithOtpAction,
} from "@/app/actions/auth";

interface SettingsManagementViewProps {
  user: any;
  onProfileUpdated?: (updatedUser: any) => void;
}

export default function SettingsManagementView({
  user,
  onProfileUpdated,
}: SettingsManagementViewProps) {
  // Mobile active tab ("profile" | "security")
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [position, setPosition] = useState(user?.position || "");
  const [gender, setGender] = useState(user?.gender || "male");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Feedback State
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();

  // Security / Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Security Feedback State
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState<string | null>(null);
  const [securityErrorMsg, setSecurityErrorMsg] = useState<string | null>(null);
  const [isOtpPending, startOtpTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  // Handle avatar file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  // Submit Profile Form
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("position", position);
    formData.append("gender", gender);
    if (selectedFile) {
      formData.append("avatar", selectedFile);
    }

    startProfileTransition(async () => {
      const res = await updateCurrentProfileDetailsAction(formData);
      if (res.success && res.user) {
        setProfileSuccessMsg(res.message);
        if (onProfileUpdated) {
          onProfileUpdated(res.user);
        }
      } else {
        setProfileErrorMsg(res.message || "Failed to update profile details.");
      }
    });
  };

  // Send Password OTP
  const handleSendOtp = () => {
    setSecurityErrorMsg(null);
    setSecuritySuccessMsg(null);

    if (!newPassword) {
      setSecurityErrorMsg("Please enter your desired new password first.");
      return;
    }
    if (newPassword.length < 6) {
      setSecurityErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      setSecurityErrorMsg("New password and confirm password do not match.");
      return;
    }

    startOtpTransition(async () => {
      const res = await sendPasswordChangeOtpAction();
      if (res.success) {
        setOtpSent(true);
        setSecuritySuccessMsg(res.message);
        setOtpCooldown(60);

        const timer = setInterval(() => {
          setOtpCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setSecurityErrorMsg(res.message || "Failed to dispatch verification code.");
      }
    });
  };

  // Verify OTP and Update Password
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityErrorMsg(null);
    setSecuritySuccessMsg(null);

    if (!otpCode.trim()) {
      setSecurityErrorMsg("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    const formData = new FormData();
    formData.append("otp", otpCode.trim());
    formData.append("newPassword", newPassword.trim());
    formData.append("confirmPassword", confirmPassword.trim());

    startPasswordTransition(async () => {
      const res = await changePasswordWithOtpAction(formData);
      if (res.success) {
        setSecuritySuccessMsg(res.message);
        setNewPassword("");
        setConfirmPassword("");
        setOtpCode("");
        setOtpSent(false);
      } else {
        setSecurityErrorMsg(res.message || "Failed to update password.");
      }
    });
  };


  const currentDisplayAvatar =
    avatarPreview || getUserAvatar(user?.avatarUrl, gender);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Settings
            </h2>
            <p className="text-xs text-slate-500">
              Manage your personal information, clinical role details, and security
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70">
            {user?.role || "Employee"}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            #{user?.id}
          </span>
        </div>
      </div>

      {/* Mobile Tab Switcher (< md) */}
      <div className="md:hidden flex border-b border-slate-200 bg-slate-50 p-2 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "profile"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile Details</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "security"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Security &amp; OTP</span>
        </button>
      </div>

      {/* Split-Screen 50/50 Layout: Left Half Profile Details, Right Half Security & Password */}
      <div className="flex-1 overflow-y-auto bg-slate-50/40">
        <div className="w-full min-h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
          
          {/* ============================================================ */}
          {/* LEFT HALF: Profile Details ("as now name email like this")   */}
          {/* ============================================================ */}
          <div
            className={`p-6 sm:p-8 space-y-6 ${
              activeTab === "profile" ? "block" : "hidden md:block"
            }`}
          >
            <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-black text-lg text-slate-900 tracking-tight">
                      Profile Details
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Manage your personal information, role details, and avatar image
                  </p>
                </div>

                {/* Feedback Banners */}
                {profileSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{profileSuccessMsg}</span>
                  </div>
                )}
                {profileErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-medium">{profileErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  {/* Photo row */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <img
                      src={currentDisplayAvatar}
                      alt="Avatar"
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload New Photo</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <p className="text-[10px] text-slate-400">
                        Square photo recommended. JPG, PNG or WEBP up to 5MB.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Elena Rostova"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. user@srimatrix.com"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 bg-white"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other / Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Clinical / Staff Role Position
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g. Critical Care Registered Nurse (ICU)"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isProfilePending}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isProfilePending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT HALF: Security & Password ("and in side option appears")*/}
          {/* ============================================================ */}
          <div
            className={`p-6 sm:p-8 space-y-6 bg-slate-50/20 ${
              activeTab === "security" ? "block" : "hidden md:block"
            }`}
          >
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Security &amp; Password</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Email OTP
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Update your account password with email one-time passcode (OTP) verification
                </p>
              </div>

                {/* Feedback Banners */}
                {securitySuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{securitySuccessMsg}</span>
                  </div>
                )}
                {securityErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-medium">{securityErrorMsg}</span>
                  </div>
                )}

                {/* Email Verification Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Verification Code Target
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 truncate block">
                      {user?.email}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isOtpPending || otpCooldown > 0}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isOtpPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {otpCooldown > 0
                        ? `Wait ${otpCooldown}s`
                        : otpSent
                        ? "Resend Verification Code"
                        : "Send Verification Code (OTP)"}
                    </span>
                  </button>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        New Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* OTP Code Box */}
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                    <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Enter 6-Digit Email Verification Code (OTP) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-indigo-200 text-sm font-mono font-bold tracking-widest text-indigo-900 focus:outline-hidden focus:border-indigo-600 bg-white shadow-2xs"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Code is valid for 10 minutes. Check your spam folder if not received promptly.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isPasswordPending || !otpCode || !newPassword}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      {isPasswordPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Verify OTP &amp; Update Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

        </div>
      </div>
  );
}
