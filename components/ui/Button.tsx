import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator, View } from "react-native";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LinearGradient } from "expo-linear-gradient";

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
    const baseClass = "flex flex-row items-center justify-center rounded-2xl overflow-hidden active:scale-[0.97]";
    
    const sizeClasses = {
        sm: "px-4 py-2",
        md: "px-5 py-4",
        lg: "px-6 py-5",
    };

    const variantClasses = {
        primary: "shadow-xl shadow-primary/30",
        secondary: "bg-slate-800 border border-slate-700",
        danger: "bg-red-600 shadow-lg shadow-red-500/20",
        ghost: "bg-transparent active:bg-white/5",
    };

    const textClasses = {
        primary: "text-slate-950 font-black uppercase tracking-tighter",
        secondary: "text-slate-200 font-bold tracking-tight",
        danger: "text-white font-bold uppercase tracking-tight",
        ghost: "text-primary font-bold",
    };

    const mergedClass = twMerge(
        clsx(baseClass, sizeClasses[size], variantClasses[variant], (disabled || loading) && "opacity-60"),
        className
    );

    const mergedTextClass = twMerge(
        clsx("text-center text-sm", textClasses[variant]),
        textClassName
    );

    const content = (
        <>
            {loading ? (
                <ActivityIndicator color={variant === "primary" ? "#0f172a" : "#C8842A"} />
            ) : (
                typeof children === 'string' ? (
                    <Text className={mergedTextClass}>{children}</Text>
                ) : children
            )}
        </>
    );

    if (variant === "primary" && !disabled && !loading) {
        return (
            <TouchableOpacity 
                disabled={disabled || loading} 
                activeOpacity={0.8}
                {...props}
            >
                <LinearGradient
                    colors={['#C8842A', '#926220']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className={mergedClass}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity 
            className={mergedClass} 
            disabled={disabled || loading} 
            activeOpacity={0.7}
            {...props}
        >
            {content}
        </TouchableOpacity>
    );
}
