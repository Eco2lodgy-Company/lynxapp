import React, { forwardRef } from "react";
import { View, Text, TextInput as RNTextInput, TextInputProps as RNTextInputProps } from "react-native";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends RNTextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    containerClassName?: string;
    inputClassName?: string;
    labelClassName?: string;
    errorClassName?: string;
}

export const Input = forwardRef<RNTextInput, InputProps>(
    ({ label, error, icon, containerClassName, inputClassName, labelClassName, errorClassName, ...props }, ref) => {
        return (
            <View className={twMerge("w-full mb-4", containerClassName)}>
                {label && (
                    <Text className={twMerge("text-xs font-medium text-slate-400 mb-1.5 ml-1", labelClassName)}>
                        {label}
                    </Text>
                )}
                <View className="relative w-full">
                    {icon && (
                        <View className="absolute left-4 top-0 bottom-0 py-3.5 z-10 flex flex-row items-center justify-center">
                            {icon}
                        </View>
                    )}
                    <RNTextInput
                        ref={ref}
                        placeholderTextColor="#475569" // slate-600
                        className={twMerge(
                            "w-full bg-surface-dark border rounded-xl py-3.5 px-4 text-white text-sm focus:border-primary/50",
                            icon ? "pl-11" : "pl-4",
                            error ? "border-red-500 bg-red-500/5 focus:border-red-500" : "border-border-dark",
                            inputClassName
                        )}
                        {...props}
                    />
                </View>
                {error && (
                    <Text className={twMerge("text-xs text-red-400 mt-1.5 ml-1", errorClassName)}>
                        {error}
                    </Text>
                )}
            </View>
        );
    }
);

Input.displayName = "Input";
