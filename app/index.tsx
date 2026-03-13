import React, { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { PremiumCard } from "../components/ui/PremiumCard";
import Animated, { FadeInDown, FadeInUp, FadeIn } from "react-native-reanimated";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";

export default function LoginScreen() {
    const { login } = useAuth();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await login(email, password);
        } catch (e: any) {
            setError(e || "Identifiants invalides ou erreur de connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-slate-950"
        >
            <StatusBar style="light" />
            <LinearGradient
                colors={['#1e293b', '#0f172a', '#020617']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ 
                    flexGrow: 1, 
                    justifyContent: "center",
                    paddingTop: Math.max(insets.top, 24),
                    paddingBottom: Math.max(insets.bottom, 24)
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Branding Section */}
                <Animated.View entering={FadeInDown.duration(1000).springify()} className="items-center mb-16">
                    <View className="relative shadow-2xl shadow-primary/20">
                        <View className="w-36 h-36 bg-slate-900 rounded-[45px] p-8 border-2 border-primary/20 items-center justify-center">
                            <Image 
                                source={require("../assets/logo-lynx.png")}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        </View>
                        <View className="absolute -top-2 -left-2 w-8 h-8 rounded-2xl border-4 border-slate-950 bg-primary/40 items-center justify-center">
                            <View className="w-2 h-2 bg-primary rounded-full" />
                        </View>
                    </View>
                    
                    <Animated.View entering={FadeIn.delay(600)} className="mt-8 items-center">
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[6px] mb-2">LYNX MANAGEMENT</Text>
                        <Text className="text-white text-base font-bold tracking-[2px]">Système de Pilotage Elite</Text>
                    </Animated.View>
                </Animated.View>

                {/* Form Section */}
                <PremiumCard index={1} delay={200} style={{ padding: 32 }} glass={true}>
                    <View className="mb-10">
                        <Text className="text-white text-3xl font-black tracking-tight mb-2">Connexion</Text>
                        <Text className="text-slate-400 text-sm font-medium leading-5">Accédez à votre espace sécurisé pour piloter vos opérations.</Text>
                    </View>

                    {error && (
                        <Animated.View entering={FadeIn} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <Text className="text-red-400 text-xs font-bold uppercase tracking-wider">{error}</Text>
                        </Animated.View>
                    )}

                    <View className="space-y-6">
                        <Input
                            label="ADRESSE EMAIL PROFESSIONNELLE"
                            placeholder="votre.nom@ecotech.fr"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            className="bg-slate-950/50 h-14"
                        />

                        <Input
                            label="MOT DE PASSE"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            className="bg-slate-950/50 h-14"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                        className="mt-8"
                    >
                        <LinearGradient
                            colors={['#C8842A', '#926220']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#0F172A" />
                            ) : (
                                <Text className="text-slate-950 font-black text-lg uppercase tracking-tight">Accéder au Dashboard</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </PremiumCard>

                {/* Footer */}
                <Animated.View entering={FadeIn.delay(1200)} className="items-center mt-16 pb-8">
                    <Text className="text-slate-600 text-[10px] font-bold tracking-[2px] uppercase">
                        Part of ECOTECH Ecosystem
                    </Text>
                    <Text className="text-slate-700 text-[9px] mt-2 font-medium">
                        © {new Date().getFullYear()} LYNX Corp. All rights reserved.
                    </Text>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
