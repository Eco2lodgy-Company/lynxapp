import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from "react-native";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends TouchableOpacityProps {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
    textClassName?: string;
}

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    className,
    textClassName,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseClass = "flex flex-row items-center justify-center rounded-2xl transition-all active:opacity-70 active:scale-[0.98]";
    
    const sizeClasses = {
        sm: "px-4 py-2",
        md: "px-5 py-3.5",
        lg: "px-6 py-4",
    };

    const variantClasses = {
        primary: "bg-primary shadow-lg shadow-primary/20",
        secondary: "bg-surface-dark border border-border-dark",
        danger: "bg-red-500/10 border border-red-500/20",
        ghost: "bg-transparent active:bg-white/5",
    };

    const textClasses = {
        primary: "text-slate-900 font-bold",
        secondary: "text-white font-semibold",
        danger: "text-red-400 font-semibold",
        ghost: "text-primary font-semibold",
    };

    const mergedClass = twMerge(
        clsx(baseClass, sizeClasses[size], variantClasses[variant], (disabled || loading) && "opacity-50"),
        className
    );

    const mergedTextClass = twMerge(
        clsx("text-center text-sm", textClasses[variant]),
        textClassName
    );

    return (
        <TouchableOpacity 
            className={mergedClass} 
            disabled={disabled || loading} 
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === "primary" ? "#0f172a" : "#14F195"} />
            ) : (
                typeof children === 'string' ? (
                    <Text className={mergedTextClass}>{children}</Text>
                ) : children
            )}
        </TouchableOpacity>
    );
}
