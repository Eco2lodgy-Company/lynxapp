import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../lib/api';
import { 
    ClipboardList, 
    Calendar,
    User,
    ChevronRight,
    Search,
    CloudRain,
    Thermometer
} from 'lucide-react-native';
import { Input } from '../../components/ui/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReportsScreen() {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchLogs = async () => {
        try {
            const response = await api.get('/daily-logs');
            setLogs(response.data);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    }, []);

    const filteredLogs = logs.filter(l => 
        l.project?.name.toLowerCase().includes(search.toLowerCase()) ||
        l.summary?.toLowerCase().includes(search.toLowerCase())
    );

    const LogCard = ({ log }: { log: any }) => (
        <TouchableOpacity 
            className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-4"
            activeOpacity={0.7}
        >
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-white font-bold text-lg mb-1" numberOfLines={1}>
                        {log.project?.name}
                    </Text>
                    <View className="flex-row items-center">
                        <Calendar size={12} color="#94A3B8" />
                        <Text className="text-slate-400 text-xs ml-1">
                            {new Date(log.date).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                            })}
                        </Text>
                    </View>
                </View>
                <View className={`px-2.5 py-1 rounded-full border ${
                    log.status === 'VALIDÉ' ? 'bg-primary/10 border-primary/20' : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                    <Text className={`text-[10px] font-bold tracking-wider ${
                        log.status === 'VALIDÉ' ? 'text-primary' : 'text-amber-500'
                    }`}>
                        {log.status}
                    </Text>
                </View>
            </View>

            <Text className="text-slate-300 text-sm mb-4" numberOfLines={2}>
                {log.summary}
            </Text>

            <View className="flex-row items-center justify-between pt-3 border-t border-slate-700/50">
                <View className="flex-row items-center">
                    <View className="flex-row items-center mr-4">
                        <CloudRain size={14} color="#64748B" />
                        <Text className="text-slate-400 text-xs ml-1">{log.weather || 'N/A'}</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Thermometer size={14} color="#64748B" />
                        <Text className="text-slate-400 text-xs ml-1">{log.temperature}°C</Text>
                    </View>
                </View>
                <View className="flex-row items-center">
                    <User size={14} color="#64748B" />
                    <Text className="text-slate-400 text-[10px] ml-1">
                        {log.author?.firstName}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View 
            className="flex-1 bg-slate-900 px-5"
            style={{ paddingTop: Math.max(insets.top, 24) }}
        >
            <View className="mb-6">
                <Text className="text-white text-3xl font-bold mb-2">Journaux</Text>
                <Text className="text-slate-400 text-sm">Suivi quotidien des activités de chantier</Text>
            </View>

            <View className="mb-6">
                <Input 
                    placeholder="Chercher par projet ou résumé..." 
                    value={search}
                    onChangeText={setSearch}
                    icon={<Search size={20} color="#64748B" />}
                />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#14F195" size="large" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
                >
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map(log => (
                            <LogCard key={log.id} log={log} />
                        ))
                    ) : (
                        <View className="items-center justify-center py-20">
                            <Text className="text-slate-500 italic">Aucun journal trouvé</Text>
                        </View>
                    )}
                    <View className="h-20" />
                </ScrollView>
            )}
        </View>
    );
}
