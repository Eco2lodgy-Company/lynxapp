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
            <View className={twMerge("w-full mb-5", containerClassName)}>
                {label && (
                    <Text className={twMerge("text-[10px] font-black text-slate-500 mb-2 ml-1 uppercase tracking-[2px]", labelClassName)}>
                        {label}
                    </Text>
                )}
                <View className="relative w-full">
                    {icon && (
                        <View className="absolute left-4 top-0 bottom-0 z-10 flex flex-row items-center justify-center">
                            {icon}
                        </View>
                    )}
                    <RNTextInput
                        ref={ref}
                        placeholderTextColor="#475569" // slate-600
                        className={twMerge(
                            "w-full bg-slate-900/60 border border-white/5 rounded-2xl py-4 px-4 text-white text-base font-bold tracking-tight focus:border-primary/50",
                            icon ? "pl-12" : "pl-5",
                            error ? "border-red-500/50 bg-red-500/10 focus:border-red-500" : "border-white/5",
                            inputClassName
                        )}
                        {...props}
                    />
                </View>
                {error && (
                    <Text className={twMerge("text-[10px] font-bold text-red-400 mt-2 ml-1 uppercase tracking-wider", errorClassName)}>
                        {error}
                    </Text>
                )}
            </View>
        );
    }
);

Input.displayName = "Input";
