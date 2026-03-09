import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
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

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();

    const MenuButton = ({ icon: Icon, title, subtitle, color, onPress }: any) => (
        <TouchableOpacity 
            className="flex-row items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-3"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${color} bg-opacity-20`}>
                    <Icon size={20} color={color.replace('bg-', '#')} />
                </View>
                <View>
                    <Text className="text-white font-semibold">{title}</Text>
                    {subtitle && <Text className="text-slate-400 text-xs">{subtitle}</Text>}
                </View>
            </View>
            <ChevronRight color="#475569" size={20} />
        </TouchableOpacity>
    );

    return (
        <ScrollView 
            className="flex-1 bg-slate-900" 
            contentContainerStyle={{ 
                padding: 20, 
                paddingTop: Math.max(insets.top, 24),
                paddingBottom: Math.max(insets.bottom, 80)
            }}
        >
            <View className="items-center mb-8">
                <View className="relative">
                    <View className="w-24 h-24 bg-slate-800 rounded-3xl border-2 border-primary/30 items-center justify-center overflow-hidden shadow-xl shadow-black">
                        {user?.image ? (
                            <Image source={{ uri: user.image }} className="w-full h-full" />
                        ) : (
                            <User size={48} color="#14F195" />
                        )}
                    </View>
                    <View className="absolute -bottom-1 -right-1 bg-primary w-6 h-6 rounded-full border-2 border-slate-900 items-center justify-center shadow-sm">
                        <View className="w-2 h-2 bg-slate-900 rounded-full" />
                    </View>
                </View>
                <Text className="text-white text-2xl font-bold mt-4">{user?.name}</Text>
                <Text className="text-slate-400 text-sm">{user?.role}</Text>
            </View>

            <View className="bg-slate-800/80 rounded-3xl p-5 border border-slate-700 mb-8">
                <View className="flex-row items-center mb-4">
                    <Mail size={16} color="#94A3B8" />
                    <Text className="text-slate-300 ml-3">{user?.email}</Text>
                </View>
                <View className="flex-row items-center">
                    <Shield size={16} color="#94A3B8" />
                    <Text className="text-slate-300 ml-3">ID: {user?.id?.substring(0, 8)}...</Text>
                </View>
            </View>

            <View className="mb-8">
                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 ml-2">Paramètres</Text>
                
                <MenuButton 
                    icon={Bell} 
                    title="Notifications" 
                    subtitle="Gérer vos alertes et rappels"
                    color="#3B82F6"
                />
                <MenuButton 
                    icon={Shield} 
                    title="Sécurité" 
                    subtitle="Mot de passe et biométrie"
                    color="#A855F7"
                />
                <MenuButton 
                    icon={Settings} 
                    title="Préférences" 
                    subtitle="Langue, Thème et Affichage"
                    color="#64748B"
                />
            </View>

            <Button 
                variant="danger" 
                onPress={logout}
                className="mt-4 rounded-2xl h-14"
            >
                <View className="flex-row items-center justify-center">
                    <LogOut size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Déconnexion</Text>
                </View>
            </Button>

            <View className="items-center mt-8 opacity-20">
                <Text className="text-slate-500 text-xs">LYNX Mobile v1.0.0</Text>
                <Text className="text-slate-500 text-[10px] mt-1">NGS Digital © 2026</Text>
            </View>

            <View className="h-20" />
        </ScrollView>
    );
}
