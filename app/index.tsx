import React, { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
            className="flex-1 bg-bg-dark"
        >
            <StatusBar style="light" />
            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ 
                    flexGrow: 1, 
                    justifyContent: "center",
                    paddingTop: Math.max(insets.top, 24),
                    paddingBottom: Math.max(insets.bottom, 24)
                }}
            >
                {/* Branding Section */}
                <View className="items-center mb-12">
                    <View className="w-32 h-32 mb-6 drop-shadow-2xl">
                        <Image 
                            source={require("../assets/logo-lynx.png")}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    </View>
                    <View className="bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                        <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-[3px]">
                            ECOTECH Platform
                        </Text>
                    </View>
                </View>

                {/* Form Section */}
                <View className="bg-slate-800/80 border border-slate-700/50 rounded-[40px] p-8 shadow-2xl">
                    <View className="mb-8">
                        <Text className="text-2xl font-bold text-white mb-2">Bon retour</Text>
                        <Text className="text-slate-400 text-sm leading-5">Connectez-vous pour accéder à vos chantiers et rapports.</Text>
                    </View>

                    {error && (
                        <View className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <Text className="text-red-400 text-sm">{error}</Text>
                        </View>
                    )}

                    <Input
                        label="Adresse email"
                        placeholder="jean.dupont@ecotech.fr"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Input
                        label="Mot de passe"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        onPress={handleLogin}
                        loading={loading}
                        className="mt-4"
                    >
                        Se connecter
                    </Button>
                </View>

                {/* Footer */}
                <View className="items-center mt-12">
                    <Text className="text-xs text-slate-500">
                        © {new Date().getFullYear()} ECOTECH. Tous droits réservés.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
