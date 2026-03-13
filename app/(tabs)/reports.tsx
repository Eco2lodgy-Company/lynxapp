import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, StyleSheet, Platform } from 'react-native';
import api from '../../lib/api';
import { 
    ClipboardList, 
    Calendar,
    User,
    Search,
    CloudRain,
    Thermometer,
    CheckCircle2,
    XCircle,
    FileText,
    X,
    ChevronRight,
    Filter
} from 'lucide-react-native';
import { Input } from '../../components/ui/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const STATUS_LABELS: Record<string, string> = {
    BROUILLON: 'BROUILLON',
    SOUMIS: 'SOUMIS',
    VALIDE: 'VALIDÉ',
    REJETE: 'REJETÉ',
};

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; color: string }> = {
    BROUILLON: { bg: 'bg-slate-700/30', border: 'border-white/5', text: 'text-slate-400', color: '#64748B' },
    SOUMIS: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', color: '#F59E0B' },
    VALIDE: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', color: '#10B981' },
    REJETE: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', color: '#EF4444' },
};

export default function ReportsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectModal, setRejectModal] = useState<{ visible: boolean; logId: string | null }>({ visible: false, logId: null });
    const [counterNotes, setCounterNotes] = useState('');

    const canValidate = user?.role === 'CONDUCTEUR' || user?.role === 'ADMIN';

    const fetchLogs = async () => {
        try {
            const response = await api.get('/daily-logs');
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    }, []);

    const handleValidate = async (logId: string) => {
        setActionLoading(true);
        try {
            await api.patch(`/daily-logs/${logId}`, { status: 'VALIDE' });
            Alert.alert('✅ Validé', 'Le journal a été validé avec succès.');
            fetchLogs();
        } catch (err: any) {
            Alert.alert('Erreur', err.response?.data?.error || 'Impossible de valider');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectModal.logId) return;
        if (!counterNotes.trim()) {
            Alert.alert('Requis', 'Veuillez saisir les notes de contre-visite.');
            return;
        }
        setActionLoading(true);
        try {
            await api.patch(`/daily-logs/${rejectModal.logId}`, { 
                status: 'REJETE', 
                correctionNotes: counterNotes.trim() 
            });
            Alert.alert('❌ Rejeté', 'Journal rejeté avec succès.');
            setRejectModal({ visible: false, logId: null });
            setCounterNotes('');
            fetchLogs();
        } catch (err: any) {
            Alert.alert('Erreur', err.response?.data?.error || 'Impossible de rejeter');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredLogs = logs.filter(l => 
        l.project?.name.toLowerCase().includes(search.toLowerCase()) ||
        l.summary?.toLowerCase().includes(search.toLowerCase())
    );

    const LogCard = ({ log, index }: { log: any, index: number }) => {
        const style = STATUS_STYLE[log.status] || STATUS_STYLE.BROUILLON;
        return (
            <PremiumCard index={index} glass={true} style={{ padding: 18, marginBottom: 16 }}>
                <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                        <Text className="text-white font-black text-lg tracking-tight mb-1.5" numberOfLines={1}>
                            {log.project?.name}
                        </Text>
                        <View className="flex-row items-center bg-white/5 self-start px-2.5 py-1 rounded-lg border border-white/5">
                            <Calendar size={12} color="#94A3B8" strokeWidth={2.5} />
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-2">
                                {new Date(log.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                    </View>
                    <View className={`px-3 py-1 transparent rounded-full border ${style.border}`}>
                        <Text className={`text-[9px] font-black tracking-[1.5px] uppercase ${style.text}`}>
                            {STATUS_LABELS[log.status] || log.status}
                        </Text>
                    </View>
                </View>

                {log.summary && (
                    <Text className="text-slate-400 text-sm leading-5 mb-4" numberOfLines={2}>{log.summary}</Text>
                )}

                {log.correctionNotes && log.status === 'REJETE' && (
                    <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-4">
                        <View className="flex-row items-center mb-1.5">
                            <XCircle size={14} color="#EF4444" strokeWidth={2.5} />
                            <Text className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">Contre-visite</Text>
                        </View>
                        <Text className="text-red-200/80 text-xs leading-5 font-medium">{log.correctionNotes}</Text>
                    </View>
                )}

                <View className="flex-row items-center justify-between pt-4 border-t border-white/5">
                    <View className="flex-row items-center">
                        <View className="flex-row items-center mr-5">
                            <CloudRain size={14} color="#C8842A" strokeWidth={2} />
                            <Text className="text-slate-200 text-[11px] font-bold ml-2 uppercase tracking-tighter">{log.weather || '—'}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Thermometer size={14} color="#C8842A" strokeWidth={2} />
                            <Text className="text-slate-200 text-[11px] font-bold ml-1 uppercase">{log.temperature ? `${log.temperature}°C` : '—'}</Text>
                        </View>
                    </View>
                    <View className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{log.author?.firstName}</Text>
                    </View>
                </View>

                {canValidate && log.status === 'SOUMIS' && (
                    <View className="flex-row mt-5 pt-5 border-t border-white/5 gap-3">
                        <TouchableOpacity
                            onPress={() => handleValidate(log.id)}
                            disabled={actionLoading}
                            activeOpacity={0.7}
                            className="flex-1 h-12 flex-row items-center justify-center bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20"
                        >
                            <CheckCircle2 size={16} color="#0F172A" strokeWidth={3} />
                            <Text className="text-slate-900 font-black text-xs uppercase tracking-tight ml-2">Valider</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { setRejectModal({ visible: true, logId: log.id }); setCounterNotes(''); }}
                            disabled={actionLoading}
                            activeOpacity={0.7}
                            className="flex-1 h-12 flex-row items-center justify-center bg-slate-900 border border-red-500/30 rounded-xl"
                        >
                            <XCircle size={16} color="#EF4444" strokeWidth={2.5} />
                            <Text className="text-red-400 font-black text-xs uppercase tracking-tight ml-2">Rejeter</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </PremiumCard>
        );
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#1e293b', '#0f172a', '#020617']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <View 
                className="flex-1 px-5"
                style={{ paddingTop: Math.max(insets.top, 24) }}
            >
                <Animated.View entering={FadeInUp.duration(600)} className="mb-8">
                    <Text className="text-slate-500 text-sm font-bold uppercase tracking-[4px] mb-2">Historique</Text>
                    <Text className="text-white text-4xl font-black tracking-tighter">Journaux</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200)} className="mb-8">
                    <PremiumCard index={-1} glass={true} style={{ padding: 4, borderRadius: 20 }}>
                        <Input 
                            placeholder="Rechercher un rapport..." 
                            value={search}
                            onChangeText={setSearch}
                            //@ts-ignore
                            placeholderTextColor="#64748B"
                            className="bg-transparent border-0 h-14"
                            icon={<Search size={22} color="#C8842A" strokeWidth={2.5} />}
                        />
                    </PremiumCard>
                </Animated.View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#C8842A" size="large" />
                    </View>
                ) : (
                    <ScrollView 
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C8842A" />}
                    >
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log, index) => <LogCard key={log.id} log={log} index={index} />)
                        ) : (
                            <View className="items-center justify-center py-24">
                                <FileText size={48} color="#1e293b" strokeWidth={1} />
                                <Text className="text-slate-500 text-base font-medium mt-4 italic">Aucun document archivé</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Reject Modal */}
            {rejectModal.visible && (
                <View className="absolute inset-0 bg-black/80 justify-end z-50">
                    <Animated.View 
                        entering={FadeInUp} 
                        className="bg-slate-950 rounded-t-[40px] p-8 border-t border-white/10"
                        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    >
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-white text-2xl font-black tracking-tight">Contre-visite</Text>
                                <Text className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">Éléments non conformes</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setRejectModal({ visible: false, logId: null })}
                                className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/5"
                            >
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        
                        <View className="bg-white/5 border border-white/5 rounded-[28px] p-5 mb-8 min-h-[160px]">
                            <TextInput
                                className="text-white text-[15px] font-medium leading-6"
                                placeholder="Détaillez les correctifs nécessaires..."
                                placeholderTextColor="#334155"
                                multiline
                                textAlignVertical="top"
                                value={counterNotes}
                                onChangeText={setCounterNotes}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleReject}
                            disabled={actionLoading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#B91C1C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <XCircle color="white" size={24} strokeWidth={3} className="mr-3" />
                                        <Text className="text-white font-black text-lg uppercase tracking-tight">Confirmer le Rejet</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({});
