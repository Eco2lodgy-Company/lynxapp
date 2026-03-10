import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
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
    ClipboardList,
    Clock
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await api.get('/stats');
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
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
            <View className="w-10 h-10 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: color + '22' }}>
                <Icon size={20} color={color} />
            </View>
            <Text className="text-slate-400 text-xs font-medium mb-1">{title}</Text>
            <Text className="text-white text-xl font-bold">{loading ? '...' : (value ?? 0)}</Text>
        </View>
    );

    const quickActions = [
        {
            label: 'Nouveau Journal',
            sub: "Rapporter l'avancement du jour",
            icon: ClipboardList,
            color: '#3B82F6',
            roles: ['CHEF_EQUIPE', 'CONDUCTEUR', 'ADMIN'],
            onPress: () => {},
        },
        {
            label: 'Pointage',
            sub: "Enregistrer votre présence",
            icon: Clock,
            color: '#22C55E',
            roles: ['CHEF_EQUIPE', 'OUVRIER', 'CONDUCTEUR', 'ADMIN'],
            onPress: () => router.push('/attendance'),
        },
        {
            label: 'Signaler Incident',
            sub: "Signaler un problème critique",
            icon: AlertTriangle,
            color: '#EF4444',
            roles: ['CHEF_EQUIPE', 'CONDUCTEUR', 'ADMIN'],
            onPress: () => {},
        },
        {
            label: "Demander une avance",
            sub: "Alerte besoin en fonds",
            icon: CircleDollarSign,
            color: '#F59E0B',
            roles: ['CHEF_EQUIPE'],
            onPress: () => router.push('/advance-request'),
        },
        {
            label: 'Planning Livraisons',
            sub: 'Suivi logistique du chantier',
            icon: Truck,
            color: '#6366F1',
            roles: ['CHEF_EQUIPE', 'CONDUCTEUR', 'ADMIN'],
            onPress: () => router.push('/deliveries'),
        },
    ];

    const visibleActions = quickActions.filter(a => a.roles.includes(user?.role || ''));

    return (
        <ScrollView 
            className="flex-1 bg-slate-900" 
            contentContainerStyle={{ 
                padding: 20, 
                paddingTop: Math.max(insets.top, 20),
                paddingBottom: Math.max(insets.bottom, 80)
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
                <StatCard title="Projets Actifs" value={stats?.activeProjects} icon={Briefcase} color="#3B82F6" />
                <StatCard title="Validations" value={stats?.pendingValidations} icon={CheckCircle2} color="#22C55E" />
                <StatCard title="Incidents" value={stats?.recentIncidents} icon={AlertTriangle} color="#EF4444" />
                <StatCard title="Tâches faites" value={stats?.completedTasks} icon={Activity} color="#A855F7" />
            </View>

            <View className="mt-4 mb-8">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-white text-xl font-bold">Actions Rapides</Text>
                </View>
                
                {visibleActions.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={action.onPress}
                        className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-3 flex-row items-center justify-between"
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: action.color + '22' }}>
                                <action.icon color={action.color} size={20} />
                            </View>
                            <View>
                                <Text className="text-white font-semibold text-base">{action.label}</Text>
                                <Text className="text-slate-400 text-[11px] mt-0.5">{action.sub}</Text>
                            </View>
                        </View>
                        <ChevronRight color="#475569" size={20} />
                    </TouchableOpacity>
                ))}
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
