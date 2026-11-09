"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Trash2,
  HelpCircle,
  Info,
  CheckCircle2,
  X,
  Edit3,
} from "lucide-react";

export type DialogType = "confirm" | "prompt" | "alert";
export type DialogVariant = "danger" | "warning" | "info" | "primary" | "success";

export interface DialogOptions {
  type: DialogType;
  variant?: DialogVariant;
  title?: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

interface DialogState extends DialogOptions {
  isOpen: boolean;
  resolve: (value: any) => void;
}

// Global emitter mechanism
type Listener = (state: DialogState) => void;
let globalListener: Listener | null = null;

export function showConfirm(options: {
  title?: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    if (globalListener) {
      globalListener({
        isOpen: true,
        type: "confirm",
        variant: options.variant || "danger",
        title: options.title || "Confirm Action",
        message: options.message,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        resolve,
      });
    } else {
      resolve(typeof window !== "undefined" ? window.confirm(options.message) : false);
    }
  });
}

export function showPrompt(options: {
  title?: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<string | null> {
  return new Promise((resolve) => {
    if (globalListener) {
      globalListener({
        isOpen: true,
        type: "prompt",
        variant: "primary",
        title: options.title || "Input Required",
        message: options.message,
        defaultValue: options.defaultValue || "",
        placeholder: options.placeholder || "",
        confirmText: options.confirmText || "Save",
        cancelText: options.cancelText || "Cancel",
        resolve,
      });
    } else {
      resolve(typeof window !== "undefined" ? window.prompt(options.message, options.defaultValue) : null);
    }
  });
}

export function showAlert(options: {
  title?: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
}): Promise<void> {
  return new Promise((resolve) => {
    if (globalListener) {
      globalListener({
        isOpen: true,
        type: "alert",
        variant: options.variant || "info",
        title: options.title || "Notice",
        message: options.message,
        confirmText: options.confirmText || "OK",
        resolve: () => resolve(),
      });
    } else {
      if (typeof window !== "undefined") window.alert(options.message);
      resolve();
    }
  });
}

export default function GlobalPromptDialog() {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    globalListener = (state: DialogState) => {
      setDialog(state);
      setInputValue(state.defaultValue || "");
    };

    return () => {
      globalListener = null;
    };
  }, []);

  useEffect(() => {
    if (dialog?.isOpen) {
      if (dialog.type === "prompt") {
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 50);
      } else {
        setTimeout(() => {
          confirmBtnRef.current?.focus();
        }, 50);
      }
    }
  }, [dialog]);

  if (!dialog || !dialog.isOpen) return null;

  const handleClose = () => {
    if (dialog.type === "confirm") {
      dialog.resolve(false);
    } else if (dialog.type === "prompt") {
      dialog.resolve(null);
    } else {
      dialog.resolve(undefined);
    }
    setDialog(null);
  };

  const handleConfirm = () => {
    if (dialog.type === "confirm") {
      dialog.resolve(true);
    } else if (dialog.type === "prompt") {
      dialog.resolve(inputValue);
    } else {
      dialog.resolve(undefined);
    }
    setDialog(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    } else if (e.key === "Enter" && dialog.type === "prompt") {
      e.preventDefault();
      handleConfirm();
    }
  };

  const isDanger = dialog.variant === "danger";
  const isWarning = dialog.variant === "warning";
  const isSuccess = dialog.variant === "success";

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-all duration-200"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-900 flex flex-col gap-5 relative transition-all duration-200 transform scale-100 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon in corner */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon and Title */}
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDanger
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : isWarning
                ? "bg-amber-50 border-amber-200 text-amber-600"
                : isSuccess
                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                : dialog.type === "prompt"
                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                : "bg-blue-50 border-blue-200 text-blue-600"
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-5 h-5" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : dialog.type === "prompt" ? (
              <Edit3 className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {dialog.title || (dialog.type === "prompt" ? "Input Required" : dialog.type === "confirm" ? "Confirm Action" : "Notice")}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {dialog.message}
            </p>
          </div>
        </div>

        {/* Prompt Input Box */}
        {dialog.type === "prompt" && (
          <div className="mt-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={dialog.placeholder || "Type here..."}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl text-sm outline-none transition-all shadow-2xs font-medium"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          {dialog.type !== "alert" && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
            >
              {dialog.cancelText || "Cancel"}
            </button>
          )}

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
            }`}
          >
            {dialog.confirmText || (dialog.type === "alert" ? "OK" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
