import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { 
    User, 
    Settings, 
    Shield, 
    LogOut,
    Bell,
    ChevronRight,
    Mail
} from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();

    const MenuButton = ({ icon: Icon, title, subtitle, color, onPress, index }: any) => (
        <PremiumCard 
            index={index} 
            style={{ padding: 12, marginBottom: 12 }}
            glass={true}
        >
            <TouchableOpacity 
                className="flex-row items-center justify-between"
                onPress={onPress}
                activeOpacity={0.6}
            >
                <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: color + '15' }}>
                        <Icon size={22} color={color} strokeWidth={2} />
                    </View>
                    <View>
                        <Text className="text-white font-bold text-base tracking-tight">{title}</Text>
                        {subtitle && <Text className="text-slate-400 text-[11px] font-medium mt-0.5">{subtitle}</Text>}
                    </View>
                </View>
                <View className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                    <ChevronRight color="#C8842A" size={16} strokeWidth={3} />
                </View>
            </TouchableOpacity>
        </PremiumCard>
    );

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#1e293b', '#0f172a', '#020617']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ 
                    padding: 20, 
                    paddingTop: Math.max(insets.top, 24),
                    paddingBottom: Math.max(insets.bottom, 120)
                }}
            >
                <Animated.View entering={FadeInDown.duration(800)} className="items-center mb-10">
                    <View className="relative">
                        <View className="w-28 h-28 bg-slate-800 rounded-[35px] border-2 border-primary/40 items-center justify-center overflow-hidden shadow-2xl shadow-primary/20">
                            {user?.image ? (
                                <Image source={{ uri: user.image }} className="w-full h-full" />
                            ) : (
                                <View className="bg-slate-900 w-full h-full items-center justify-center">
                                    <User size={56} color="#C8842A" strokeWidth={1.5} />
                                </View>
                            )}
                        </View>
                        <View className="absolute -bottom-2 -right-2 bg-primary w-8 h-8 rounded-2xl border-4 border-slate-950 items-center justify-center shadow-lg">
                            <View className="w-2.5 h-2.5 bg-slate-950 rounded-full" />
                        </View>
                    </View>
                    <Text className="text-white text-3xl font-black mt-6 tracking-tight">{user?.name}</Text>
                    <View className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 mt-2">
                        <Text className="text-primary text-[10px] font-black uppercase tracking-[2px]">{user?.role}</Text>
                    </View>
                </Animated.View>

                <PremiumCard index={1} style={{ padding: 16, marginBottom: 32 }}>
                    <View className="flex-row items-center mb-5">
                        <View className="w-8 h-8 rounded-lg bg-slate-900 items-center justify-center mr-4">
                            <Mail size={16} color="#94A3B8" />
                        </View>
                        <Text className="text-slate-200 font-medium">{user?.email}</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-lg bg-slate-900 items-center justify-center mr-4">
                            <Shield size={16} color="#94A3B8" />
                        </View>
                        <View>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Identifiant Utilisateur</Text>
                            <Text className="text-slate-200 font-mono text-xs">{user?.id?.substring(0, 12)}...</Text>
                        </View>
                    </View>
                </PremiumCard>

                <View className="mb-10">
                    <Animated.Text 
                        entering={FadeIn.delay(600)}
                        className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mb-6 ml-1"
                    >
                        Préférences Système
                    </Animated.Text>
                    
                    <MenuButton 
                        index={2}
                        icon={Bell} 
                        title="Notifications" 
                        subtitle="Gérer les alertes et communications"
                        color="#3B82F6"
                    />
                    <MenuButton 
                        index={3}
                        icon={Shield} 
                        title="Sécurité & Accès" 
                        subtitle="Confidentialité et authentification"
                        color="#A855F7"
                    />
                    <MenuButton 
                        index={4}
                        icon={Settings} 
                        title="Réglages" 
                        subtitle="Interface et paramètres globaux"
                        color="#64748B"
                    />
                </View>

                <TouchableOpacity 
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#EF4444', '#991B1B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ borderRadius: 20, height: 60, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <View className="flex-row items-center">
                            <LogOut size={20} color="white" strokeWidth={2.5} />
                            <Text className="text-white font-black ml-3 text-base tracking-tight uppercase">Déconnexion</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <Animated.View entering={FadeIn.delay(1000)} className="items-center mt-12 mb-8 opacity-40">
                    <Image 
                        source={require("../../assets/logo-lynx.png")}
                        className="w-10 h-10 mb-3"
                        resizeMode="contain"
                    />
                    <Text className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">LYNX Mobile Elite v1.2.0</Text>
                    <Text className="text-slate-500 text-[9px] mt-1 font-medium">ECOTECH PRODUCTIONS © 2026</Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}
