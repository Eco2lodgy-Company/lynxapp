import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
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
    X
} from 'lucide-react-native';
import { Input } from '../../components/ui/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

const STATUS_LABELS: Record<string, string> = {
    BROUILLON: 'BROUILLON',
    SOUMIS: 'SOUMIS',
    VALIDE: 'VALIDÉ',
    REJETE: 'REJETÉ',
};

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string }> = {
    BROUILLON: { bg: 'bg-slate-700/30', border: 'border-slate-600/40', text: 'text-slate-400' },
    SOUMIS: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500' },
    VALIDE: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary' },
    REJETE: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
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
            Alert.alert('Requis', 'Veuillez saisir les notes de contre-visite avant de rejeter.');
            return;
        }
        setActionLoading(true);
        try {
            await api.patch(`/daily-logs/${rejectModal.logId}`, { 
                status: 'REJETE', 
                correctionNotes: counterNotes.trim() 
            });
            Alert.alert('❌ Rejeté', 'Le journal a été rejeté avec les notes de contre-visite.');
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

    const LogCard = ({ log }: { log: any }) => {
        const style = STATUS_STYLE[log.status] || STATUS_STYLE.BROUILLON;
        return (
            <View className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-4">
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                        <Text className="text-white font-bold text-lg mb-1" numberOfLines={1}>
                            {log.project?.name}
                        </Text>
                        <View className="flex-row items-center">
                            <Calendar size={12} color="#94A3B8" />
                            <Text className="text-slate-400 text-xs ml-1">
                                {new Date(log.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-full border ${style.bg} ${style.border}`}>
                        <Text className={`text-[10px] font-bold tracking-wider ${style.text}`}>
                            {STATUS_LABELS[log.status] || log.status}
                        </Text>
                    </View>
                </View>

                {log.summary && (
                    <Text className="text-slate-300 text-sm mb-3" numberOfLines={2}>{log.summary}</Text>
                )}

                {log.correctionNotes && log.status === 'REJETE' && (
                    <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-3">
                        <Text className="text-red-300 text-xs font-semibold mb-1">Note de contre-visite :</Text>
                        <Text className="text-red-200 text-xs">{log.correctionNotes}</Text>
                    </View>
                )}

                <View className="flex-row items-center justify-between pt-3 border-t border-slate-700/50">
                    <View className="flex-row items-center">
                        <View className="flex-row items-center mr-4">
                            <CloudRain size={14} color="#64748B" />
                            <Text className="text-slate-400 text-xs ml-1">{log.weather || 'N/A'}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Thermometer size={14} color="#64748B" />
                            <Text className="text-slate-400 text-xs ml-1">{log.temperature ? `${log.temperature}°C` : 'N/A'}</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center">
                        <User size={14} color="#64748B" />
                        <Text className="text-slate-400 text-[10px] ml-1">{log.author?.firstName}</Text>
                    </View>
                </View>

                {/* Validation Actions for Conducteur/Admin — only on SOUMIS logs */}
                {canValidate && log.status === 'SOUMIS' && (
                    <View className="flex-row mt-3 pt-3 border-t border-slate-700/50 gap-2">
                        <TouchableOpacity
                            onPress={() => handleValidate(log.id)}
                            disabled={actionLoading}
                            className="flex-1 flex-row items-center justify-center bg-primary/10 border border-primary/20 py-2.5 rounded-xl"
                        >
                            <CheckCircle2 size={15} color="#22C55E" />
                            <Text className="text-primary font-bold text-xs ml-1.5">Valider</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { setRejectModal({ visible: true, logId: log.id }); setCounterNotes(''); }}
                            disabled={actionLoading}
                            className="flex-1 flex-row items-center justify-center bg-red-500/10 border border-red-500/20 py-2.5 rounded-xl"
                        >
                            <XCircle size={15} color="#EF4444" />
                            <Text className="text-red-400 font-bold text-xs ml-1.5">Rejeter</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-slate-900 px-5" style={{ paddingTop: Math.max(insets.top, 24) }}>
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
                    <ActivityIndicator color="#C8842A" size="large" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
                >
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map(log => <LogCard key={log.id} log={log} />)
                    ) : (
                        <View className="items-center justify-center py-20">
                            <Text className="text-slate-500 italic">Aucun journal trouvé</Text>
                        </View>
                    )}
                    <View className="h-20" />
                </ScrollView>
            )}

            {/* Reject Modal with Counter-Notes */}
            <Modal visible={rejectModal.visible} transparent animationType="slide">
                <View className="flex-1 bg-slate-900/80 justify-end">
                    <View className="bg-slate-800 rounded-t-3xl border-t border-slate-700 p-6" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center">
                                <FileText size={20} color="#EF4444" />
                                <Text className="text-white text-xl font-bold ml-2">Contre-visite</Text>
                            </View>
                            <TouchableOpacity onPress={() => setRejectModal({ visible: false, logId: null })}>
                                <X size={22} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-slate-400 text-sm mb-4">
                            Détaillez les éléments non conformes observés lors de votre contre-visite. Ces notes seront visibles par le Chef d'équipe.
                        </Text>
                        <TextInput
                            className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white text-sm min-h-[130px] mb-6"
                            placeholder="Ex: Les fondations de la section B ne respectent pas la profondeur requise (1.5m vs 1.2m constaté)..."
                            placeholderTextColor="#475569"
                            multiline
                            textAlignVertical="top"
                            value={counterNotes}
                            onChangeText={setCounterNotes}
                        />
                        <Button
                            onPress={handleReject}
                            loading={actionLoading}
                            className="bg-red-500 h-14 rounded-2xl"
                            textClassName="text-white font-bold"
                        >
                            CONFIRMER LE REJET
                        </Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
