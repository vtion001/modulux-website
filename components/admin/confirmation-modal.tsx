"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, X } from "lucide-react"

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    type?: "danger" | "primary"
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "Are you sure you want to do that?",
    confirmText = "Yes",
    cancelText = "No",
    type = "primary"
}: ConfirmationModalProps) {
    // Close on escape
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-sm bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                            </div>

                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                {message}
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onConfirm();
                                    }}
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg ${type === 'danger'
                                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                                            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
                                        }`}
                                >
                                    {confirmText}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onClose();
                                    }}
                                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-muted border border-border/40 text-foreground hover:bg-muted/80 transition-all"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
