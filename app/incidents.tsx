import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, StyleSheet, Platform } from 'react-native';
import api from '../lib/api';
import { AlertTriangle, MapPin, Search, ChevronDown, CheckCircle, Clock, ChevronLeft, Plus } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeIn, SlideInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export default function IncidentsScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [modalVisible, setModalVisible] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('MOYENNE');
    const [location, setLocation] = useState('');
    const [selectedProject, setSelectedProject] = useState('');

    const severities = ['FAIBLE', 'MOYENNE', 'HAUTE', 'CRITIQUE'];

    const fetchData = async () => {
        try {
            const [paramsRes, incRes] = await Promise.all([
                api.get('/projects'),
                api.get('/incidents')
            ]);
            setProjects(paramsRes.data);
            setIncidents(incRes.data);
            if (paramsRes.data.length > 0 && !selectedProject) {
                setSelectedProject(paramsRes.data[0].id);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, []);

    const handleSubmit = async () => {
        if (!selectedProject || !title.trim()) {
            Alert.alert("Erreur", "Le projet et le titre sont requis");
            return;
        }

        setLoadingSubmit(true);
        try {
            await api.post('/incidents', {
                projectId: selectedProject,
                title: title.trim(),
                description: description.trim(),
                severity,
                location: location.trim(),
            });
            Alert.alert("Succès", "Incident déclaré avec succès.");
            setModalVisible(false);
            // Reset form
            setTitle('');
            setDescription('');
            setSeverity('MOYENNE');
            setLocation('');
            fetchData();
        } catch (error: any) {
            Alert.alert("Erreur", error.response?.data?.error || "Une erreur est survenue");
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleResolve = (incidentId: string) => {
        Alert.alert(
            "Marquer comme résolu",
            "Voulez-vous vraiment marquer cet incident comme résolu ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Confirmer",
                    onPress: async () => {
                        try {
                            await api.put(`/incidents/${incidentId}`, {
                                status: 'RESOLU'
                            });
                            fetchData();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de mettre à jour le statut.');
                        }
                    }
                }
            ]
        );
    };

    const getSeverityInfo = (sev: string) => {
        switch (sev) {
            case 'CRITIQUE': return { color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)', border: '#F43F5E' };
            case 'HAUTE': return { color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', border: '#F97316' };
            case 'MOYENNE': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: '#F59E0B' };
            case 'FAIBLE': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981' };
            default: return { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)', border: '#94A3B8' };
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'RESOLU':
            case 'FERME':
                return <CheckCircle size={14} color="#10B981" />;
            default:
                return <Clock size={14} color="#F59E0B" />;
        }
    };

    const IncidentCard = ({ incident, index }: { incident: any, index: number }) => {
        const sevInfo = getSeverityInfo(incident.severity);
        const isResolved = incident.status === 'RESOLU' || incident.status === 'FERME';

        return (
            <PremiumCard index={index} glass={true} style={{ padding: 18, marginBottom: 14 }}>
                <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 mr-4">
                        <Text className={`font-black text-lg tracking-tight mb-1 ${isResolved ? 'text-slate-600 opacity-60' : 'text-white'}`} numberOfLines={2}>
                            {incident.title}
                        </Text>
                        <View className="flex-row items-center">
                            <View className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2" />
                            <Text className="text-primary text-[10px] font-black uppercase tracking-widest">{incident.project?.name}</Text>
                        </View>
                    </View>
                    <View style={{ backgroundColor: sevInfo.bg, borderColor: sevInfo.border }} className="px-3 py-1 rounded-lg border">
                        <Text style={{ color: sevInfo.color }} className="text-[9px] font-black uppercase tracking-widest">{incident.severity}</Text>
                    </View>
                </View>
                
                {incident.description && (
                    <Text className={`text-sm leading-5 mb-5 font-medium ${isResolved ? 'text-slate-700' : 'text-slate-400'}`} numberOfLines={3}>
                        {incident.description}
                    </Text>
                )}

                <View className="flex-row items-center justify-between border-t border-white/5 pt-4 mt-1">
                    <View className="flex-row items-center bg-slate-950/30 px-3 py-1.5 rounded-xl border border-white/5">
                        {getStatusIcon(incident.status)}
                        <Text className={`text-[10px] font-black uppercase tracking-widest ml-2 ${isResolved ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {incident.status}
                        </Text>
                        <View className="w-px h-3 bg-slate-800 mx-3" />
                        <Text className="text-slate-600 text-[9px] font-black uppercase tracking-widest">
                            {new Date(incident.date).toLocaleDateString()}
                        </Text>
                    </View>
                    
                    {!isResolved && (
                        <TouchableOpacity 
                            onPress={() => handleResolve(incident.id)} 
                            className="bg-primary/10 border border-primary/30 px-4 py-2 rounded-xl flex-row items-center"
                        >
                            <CheckCircle size={14} color="#C8842A" strokeWidth={2.5} />
                            <Text className="text-primary text-[10px] font-black uppercase tracking-widest ml-2">Clore</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {incident.location && (
                    <View className="flex-row items-center mt-3 bg-slate-900/40 self-start px-2 py-1 rounded-lg">
                        <MapPin size={10} color="#94A3B8" />
                        <Text className="text-slate-500 text-[9px] font-bold ml-1.5 uppercase tracking-tighter">{incident.location}</Text>
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
            
            <View className="px-5 mb-10 flex-row justify-between items-end" style={{ paddingTop: Math.max(insets.top, 24) }}>
                <View>
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[4px] mb-1">Rapports de Sécurité</Text>
                    <Text className="text-white text-4xl font-black tracking-tight">Incidents</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                    className="w-16 h-16 rounded-[22px] items-center justify-center shadow-2xl shadow-red-500/40 bg-red-600"
                >
                    <AlertTriangle color="#FFF" size={32} strokeWidth={2.5} />
                    <View className="absolute -top-1 -right-1 w-6 h-6 bg-slate-950 rounded-full items-center justify-center border-2 border-red-600">
                        <Plus size={14} color="#FFF" strokeWidth={3} />
                    </View>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#C8842A" size="large" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1 px-5"
                    contentContainerStyle={{ paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            tintColor="#C8842A" 
                            colors={['#C8842A']} 
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {incidents.length === 0 ? (
                        <Animated.View entering={FadeIn.delay(300)} className="items-center justify-center py-20">
                            <View className="w-24 h-24 bg-slate-900 rounded-[35px] items-center justify-center mb-6 border border-white/5">
                                <CheckCircle size={48} color="#1e293b" strokeWidth={1.5} />
                            </View>
                            <Text className="text-white font-black text-xl mb-2">Zone sécurisée</Text>
                            <Text className="text-slate-500 text-center text-sm font-medium">Aucun incident n'a été signalé. La vigilance reste de mise.</Text>
                        </Animated.View>
                    ) : (
                        incidents.map((incident, idx) => (
                            <IncidentCard key={incident.id} incident={incident} index={idx} />
                        ))
                    )}
                </ScrollView>
            )}

            {/* Modal de création d'incident */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={StyleSheet.absoluteFill}>
                    <View className="flex-1 justify-end">
                        <Animated.View entering={SlideInUp.springify()} className="bg-slate-900/90 rounded-t-[40px] p-8 h-[92%] border-t border-white/10 shadow-2xl">
                            <View className="flex-row justify-between items-center mb-10">
                                <View>
                                    <Text className="text-red-500 text-[10px] font-black uppercase tracking-[4px] mb-1">Alerte Immédiate</Text>
                                    <Text className="text-white text-2xl font-black tracking-tight">Signalement</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setModalVisible(false)} 
                                    className="w-12 h-12 bg-slate-800 rounded-2xl items-center justify-center border border-white/5"
                                >
                                    <Text className="text-slate-400 font-bold text-lg">✕</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                                <View className="mb-8">
                                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-1">Projet de Référence</Text>
                                    <View className="flex-row flex-wrap">
                                        {projects.map(p => (
                                            <TouchableOpacity
                                                key={p.id}
                                                onPress={() => setSelectedProject(p.id)}
                                                className={`mr-3 mb-3 px-5 py-3 rounded-2xl border-2 ${selectedProject === p.id ? 'bg-primary/10 border-primary' : 'bg-slate-950/50 border-white/5'}`}
                                            >
                                                <Text className={`font-bold text-sm ${selectedProject === p.id ? 'text-primary' : 'text-slate-500'}`}>{p.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View className="mb-8">
                                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-1">Niveau de Criticité</Text>
                                    <View className="flex-row flex-wrap">
                                        {severities.map(sev => {
                                            const sevInfo = getSeverityInfo(sev);
                                            return (
                                                <TouchableOpacity
                                                    key={sev}
                                                    onPress={() => setSeverity(sev)}
                                                    style={{ 
                                                        backgroundColor: severity === sev ? sevInfo.bg : 'rgba(15, 23, 42, 0.5)',
                                                        borderColor: severity === sev ? sevInfo.border : 'rgba(255, 255, 255, 0.05)'
                                                    }}
                                                    className="mr-3 mb-3 px-5 py-3 rounded-2xl border-2"
                                                >
                                                    <Text style={{ color: severity === sev ? sevInfo.color : '#475569' }} className="text-xs font-black uppercase tracking-widest">{sev}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                <View className="space-y-6">
                                    <Input
                                        label="Nature de l'incident"
                                        placeholder="Ex: Panne machine, Accident..."
                                        value={title}
                                        onChangeText={setTitle}
                                    />

                                    <Input
                                        label="Localisation précise"
                                        placeholder="Zone, Bâtiment, Étage..."
                                        value={location}
                                        onChangeText={setLocation}
                                    />

                                    <View className="mb-10">
                                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-3 ml-1">Observations</Text>
                                        <TextInput
                                            className="bg-slate-950/50 border border-white/5 text-white p-5 rounded-2xl text-base font-medium min-h-[140px]"
                                            placeholder="Détaillez la situation..."
                                            placeholderTextColor="#334155"
                                            multiline
                                            textAlignVertical="top"
                                            value={description}
                                            onChangeText={setDescription}
                                        />
                                    </View>
                                </View>

                                <Button  
                                    onPress={handleSubmit} 
                                    variant="primary" 
                                    className="w-full h-20 rounded-[28px]"
                                    disabled={loadingSubmit || !title.trim()}
                                >
                                    Transmettre le Rapport
                                </Button>
                            </ScrollView>
                        </Animated.View>
                    </View>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({});
