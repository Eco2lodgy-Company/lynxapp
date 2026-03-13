import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { 
    Activity, 
    AlertTriangle, 
    CheckCircle2, 
    Briefcase,
    ChevronRight,
    CircleDollarSign,
    Truck,
    ClipboardList,
    Clock,
    CheckSquare,
    Image as ImageIcon
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';

export default function DashboardScreen() {
    const { user } = useAuth();
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

    const StatCard = ({ title, value, icon: Icon, color, index }: any) => (
        <PremiumCard 
            index={index} 
            style={{ width: '48%', padding: 16, marginBottom: 16 }}
            glass={true}
        >
            <View className="w-10 h-10 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: color + '15' }}>
                <Icon size={20} color={color} strokeWidth={2.5} />
            </View>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</Text>
            <Text className="text-white text-2xl font-black">{loading ? '...' : (value ?? 0)}</Text>
        </PremiumCard>
    );

    const quickActions = [
        {
            label: 'Journal de Chantier',
            sub: "Rapport d'avancement quotidien",
            icon: ClipboardList,
            color: '#C8842A',
            roles: ['CHEF_EQUIPE', 'CONDUCTEUR', 'ADMIN'],
            onPress: () => {},
        },
        {
            label: 'Pointage Présence',
            sub: "Check-in Matin / Soir",
            icon: Clock,
            color: '#10B981',
            roles: ['CHEF_EQUIPE', 'OUVRIER', 'CONDUCTEUR', 'ADMIN'],
            onPress: () => router.push('/attendance'),
        },
        {
            label: 'Mes Tâches',
            sub: "Planning de travail assigné",
            icon: CheckSquare,
            color: '#8B5CF6',
            roles: ['OUVRIER', 'CHEF_EQUIPE', 'CONDUCTEUR', 'ADMIN'],
            onPress: () => router.push('/tasks'),
        },
        {
            label: 'Signaler Incident',
            sub: "Alerte de sécurité ou technique",
            icon: AlertTriangle,
            color: '#F43F5E',
            roles: ['CHEF_EQUIPE', 'CONDUCTEUR', 'ADMIN'],
            onPress: () => router.push('/incidents'),
        },
        {
            label: "Demander une avance",
            sub: "Requête de fonds exceptionnelle",
            icon: CircleDollarSign,
            color: '#F59E0B',
            roles: ['CHEF_EQUIPE'],
            onPress: () => router.push('/advance-request'),
        },
        {
            label: 'Logistique & Livraisons',
            sub: 'Suivi des approvisionnements',
            icon: Truck,
            color: '#3B82F6',
            roles: ['CHEF_EQUIPE', 'CONDUCTEUR', 'ADMIN'],
            onPress: () => router.push('/deliveries'),
        },
        {
            label: 'Galerie Photos',
            sub: 'Visualisation des chantiers',
            icon: ImageIcon,
            color: '#D946EF',
            roles: ['CLIENT'],
            onPress: () => router.push('/feedbacks'),
        },
    ];

    const visibleActions = quickActions.filter(a => a.roles.includes(user?.role || ''));

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
                    paddingBottom: Math.max(insets.bottom, 100)
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C8842A" />}
            >
                <Animated.View entering={FadeInDown.duration(800)} className="mb-8">
                    <Text className="text-slate-500 text-sm font-bold uppercase tracking-[3px] mb-1">LYNX Management</Text>
                    <View className="flex-row items-baseline">
                        <Text className="text-white text-3xl font-black">Bonjour, </Text>
                        <Text className="text-primary text-3xl font-black">{user?.name?.split(' ')[0]}</Text>
                    </View>
                    <View className="flex-row items-center mt-4">
                        <View className="bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                            <Text className="text-primary text-[10px] font-black uppercase tracking-widest">{user?.role}</Text>
                        </View>
                    </View>
                </Animated.View>

                <View className="flex-row flex-wrap justify-between">
                    <StatCard index={0} title="Projets Actifs" value={stats?.activeProjects} icon={Briefcase} color="#3B82F6" />
                    <StatCard index={1} title="Validations" value={stats?.pendingValidations} icon={CheckCircle2} color="#10B981" />
                    <StatCard index={2} title="Incidents" value={stats?.recentIncidents} icon={AlertTriangle} color="#F43F5E" />
                    <StatCard index={3} title="Performance" value={stats?.completedTasks} icon={Activity} color="#A855F7" />
                </View>

                <View className="mt-6 mb-8">
                    <Animated.Text 
                        entering={FadeInRight.delay(400)}
                        className="text-white text-xl font-black mb-6 tracking-tight"
                    >
                        Pilotage Opérationnel
                    </Animated.Text>
                    
                    {visibleActions.map((action, index) => (
                        <PremiumCard
                            key={index}
                            index={index + 4}
                            style={{ padding: 14, marginBottom: 12 }}
                            glass={true}
                        >
                            <TouchableOpacity
                                onPress={action.onPress}
                                className="flex-row items-center justify-between"
                                activeOpacity={0.6}
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4 shadow-lg" style={{ backgroundColor: action.color + '15' }}>
                                        <action.icon color={action.color} size={24} strokeWidth={2} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-bold text-base tracking-tight">{action.label}</Text>
                                        <Text className="text-slate-400 text-[11px] mt-0.5 font-medium">{action.sub}</Text>
                                    </View>
                                </View>
                                <View className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                                    <ChevronRight color="#C8842A" size={18} strokeWidth={3} />
                                </View>
                            </TouchableOpacity>
                        </PremiumCard>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}
