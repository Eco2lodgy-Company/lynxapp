import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { 
    Activity, 
    AlertTriangle, 
    CheckCircle2, 
    Briefcase,
    ChevronRight,
    CircleDollarSign,
    Truck,
    ClipboardList
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const fetchStats = async () => {
        try {
            // Placeholder: Replace with actual stats endpoint when ready
            // const response = await api.get('/stats/summary');
            // setStats(response.data);
            
            // Simulating stats for now
            setStats({
                activeProjects: 3,
                pendingValidations: 5,
                recentIncidents: 2,
                completedTasks: 12
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <View className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 w-[48%] mb-4">
            <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 ${color} bg-opacity-20`}>
                <Icon size={20} color={color.replace('bg-', '#')} />
            </View>
            <Text className="text-slate-400 text-xs font-medium mb-1">{title}</Text>
            <Text className="text-white text-xl font-bold">{value}</Text>
        </View>
    );

    return (
        <ScrollView 
            className="flex-1 bg-slate-900" 
            contentContainerStyle={{ 
                padding: 20, 
                paddingTop: Math.max(insets.top, 20),
                paddingBottom: Math.max(insets.bottom, 80) // Space for tabs
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
        >
            <View className="mb-8">
                <Text className="text-slate-400 text-lg font-medium">Bonjour,</Text>
                <Text className="text-white text-3xl font-bold">{user?.name || 'Utilisateur'}</Text>
                <View className="flex-row items-center mt-3">
                    <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        <Text className="text-primary text-[10px] font-bold uppercase tracking-wider">{user?.role}</Text>
                    </View>
                </View>
            </View>

            <View className="flex-row flex-wrap justify-between">
                <StatCard 
                    title="Projets Actifs" 
                    value={stats?.activeProjects || 0} 
                    icon={Briefcase} 
                    color="#3B82F6" 
                    className="bg-blue-500"
                />
                <StatCard 
                    title="Validations" 
                    value={stats?.pendingValidations || 0} 
                    icon={CheckCircle2} 
                    color="#22C55E" 
                />
                <StatCard 
                    title="Incidents" 
                    value={stats?.recentIncidents || 0} 
                    icon={AlertTriangle} 
                    color="#EF4444" 
                />
                <StatCard 
                    title="Tâches" 
                    value={stats?.completedTasks || 0} 
                    icon={Activity} 
                    color="#A855F7" 
                />
            </View>

            <View className="mt-4 mb-8">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-white text-xl font-bold">Actions Rapides</Text>
                </View>
                
                <TouchableOpacity className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center mr-3">
                            <ClipboardList color="#3B82F6" size={20} />
                        </View>
                        <View>
                            <Text className="text-white font-semibold text-base">Nouveau Journal</Text>
                            <Text className="text-slate-400 text-[11px] mt-0.5">Rapporter l'avancement du jour</Text>
                        </View>
                    </View>
                    <ChevronRight color="#475569" size={20} />
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-red-500/20 rounded-full items-center justify-center mr-3">
                            <AlertTriangle color="#EF4444" size={20} />
                        </View>
                        <View>
                            <Text className="text-white font-semibold">Signaler Incident</Text>
                            <Text className="text-slate-400 text-xs">Signaler un problème critique</Text>
                        </View>
                    </View>
                    <ChevronRight color="#475569" size={20} />
                </TouchableOpacity>

                {user?.role === 'CHEF_EQUIPE' && (
                    <TouchableOpacity 
                        onPress={() => router.push('/advance-request')}
                        className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-3 flex-row items-center justify-between"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-amber-500/20 rounded-full items-center justify-center mr-3">
                                <CircleDollarSign color="#F59E0B" size={20} />
                            </View>
                            <View>
                                <Text className="text-white font-semibold">Demander une avance</Text>
                                <Text className="text-slate-400 text-xs">Alerte besoin en fonds</Text>
                            </View>
                        </View>
                        <ChevronRight color="#475569" size={20} />
                    </TouchableOpacity>
                )}

                {(user?.role === 'CONDUCTEUR' || user?.role === 'ADMIN' || user?.role === 'CHEF_EQUIPE') && (
                    <TouchableOpacity 
                        onPress={() => router.push('/deliveries')}
                        className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-3 flex-row items-center justify-between"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-indigo-500/20 rounded-full items-center justify-center mr-3">
                                <Truck color="#6366F1" size={20} />
                            </View>
                            <View>
                                <Text className="text-white font-semibold">Planning Livraisons</Text>
                                <Text className="text-slate-400 text-xs">Suivi logistique du chantier</Text>
                            </View>
                        </View>
                        <ChevronRight color="#475569" size={20} />
                    </TouchableOpacity>
                )}
            </View>

            <Button 
                variant="ghost" 
                onPress={logout} 
                className="mt-4 border border-slate-700"
                textClassName="text-slate-400"
            >
                Déconnexion
            </Button>
            
            <View className="h-20" />
        </ScrollView>
    );
}
