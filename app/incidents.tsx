import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import api from '../lib/api';
import { AlertTriangle, MapPin, Search, ChevronDown, CheckCircle, Clock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';

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

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'CRITIQUE': return 'bg-rose-500 text-white';
            case 'HAUTE': return 'bg-orange-500 text-white';
            case 'MOYENNE': return 'bg-yellow-500 text-white';
            case 'FAIBLE': return 'bg-green-500 text-white';
            default: return 'bg-slate-500 text-white';
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

    const IncidentCard = ({ incident }: { incident: any }) => (
        <View className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-3">
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-3">
                    <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>{incident.title}</Text>
                    <Text className="text-primary text-xs font-medium mb-2">{incident.project?.name}</Text>
                </View>
                <View className={`px-2 py-1 rounded-md ${getSeverityColor(incident.severity).split(' ')[0]}`}>
                    <Text className={`text-[10px] font-bold ${getSeverityColor(incident.severity).split(' ')[1]}`}>{incident.severity}</Text>
                </View>
            </View>
            
            {incident.description && (
                <Text className="text-slate-400 text-sm mb-3" numberOfLines={3}>{incident.description}</Text>
            )}

            {incident.location && (
                <View className="flex-row items-center mb-3">
                    <MapPin size={12} color="#94A3B8" className="mr-1" />
                    <Text className="text-slate-400 text-xs">{incident.location}</Text>
                </View>
            )}

            <View className="flex-row items-center justify-between border-t border-slate-700/50 pt-3 mt-1">
                <View className="flex-row items-center">
                    {getStatusIcon(incident.status)}
                    <Text className={`text-xs ml-1 ${incident.status === 'RESOLU' || incident.status === 'FERME' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {incident.status}
                    </Text>
                    <Text className="text-slate-500 text-xs ml-3">
                        {new Date(incident.date).toLocaleDateString()}
                    </Text>
                </View>
                {(incident.status === 'OUVERT' || incident.status === 'EN_COURS') && (
                    <TouchableOpacity onPress={() => handleResolve(incident.id)} className="bg-slate-700 px-3 py-1.5 rounded flex-row items-center">
                        <CheckCircle size={12} color="#E2E8F0" />
                        <Text className="text-slate-200 text-xs ml-1">Résoudre</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-900" style={{ paddingTop: Math.max(insets.top, 24) }}>
            <View className="px-5 mb-5 flex-row justify-between items-center">
                <View>
                    <Text className="text-white text-3xl font-black tracking-tight mb-1">Incidents</Text>
                    <Text className="text-slate-400 text-sm">Signalez et suivez les problèmes</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => setModalVisible(true)}
                    className="w-12 h-12 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/30"
                >
                    <AlertTriangle color="#0F172A" size={24} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#22C55E" size="large" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1 px-5"
                    contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
                    showsVerticalScrollIndicator={false}
                >
                    {incidents.length === 0 ? (
                        <View className="items-center justify-center py-20">
                            <View className="w-16 h-16 bg-slate-800 rounded-full items-center justify-center mb-4">
                                <CheckCircle size={32} color="#22C55E" />
                            </View>
                            <Text className="text-white font-bold text-lg mb-2">Aucun incident</Text>
                            <Text className="text-slate-400 text-center">Tout se passe bien sur vos chantiers.</Text>
                        </View>
                    ) : (
                        incidents.map((incident) => (
                            <IncidentCard key={incident.id} incident={incident} />
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
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-slate-900 rounded-t-3xl p-6 h-[85%] border-t border-slate-800">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Nouvel Incident</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2 bg-slate-800 rounded-full">
                                <Text className="text-white font-bold">✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Projet concerné</Text>
                            <View className="flex-row flex-wrap mb-6">
                                {projects.map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        onPress={() => setSelectedProject(p.id)}
                                        className={`mr-2 mb-2 px-4 py-2 rounded-full border ${selectedProject === p.id ? 'bg-primary/20 border-primary' : 'bg-slate-800 border-slate-700'}`}
                                    >
                                        <Text className={selectedProject === p.id ? 'text-primary' : 'text-slate-300'}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Gravité</Text>
                            <View className="flex-row flex-wrap mb-6">
                                {severities.map(sev => (
                                    <TouchableOpacity
                                        key={sev}
                                        onPress={() => setSeverity(sev)}
                                        className={`mr-2 mb-2 px-3 py-1.5 rounded border ${severity === sev ? 'border-white' : 'border-transparent'} ${getSeverityColor(sev).split(' ')[0]}`}
                                    >
                                        <Text className="text-white text-xs font-bold">{sev}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Titre de l'incident *</Text>
                            <TextInput
                                className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl mb-6"
                                placeholder="Grave fuite d'eau, Blessure..."
                                placeholderTextColor="#64748B"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <Text className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Lieu / Localisation</Text>
                            <TextInput
                                className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl mb-6"
                                placeholder="Bâtiment A, Été 2..."
                                placeholderTextColor="#64748B"
                                value={location}
                                onChangeText={setLocation}
                            />

                            <Text className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Description détaillée</Text>
                            <TextInput
                                className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl mb-8 min-h-[100px]"
                                placeholder="Que s'est-il passé exactement ?"
                                placeholderTextColor="#64748B"
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />

                            <Button  
                                onPress={handleSubmit} 
                                variant="primary" 
                                className="w-full mb-10"
                                disabled={loadingSubmit || !title.trim()}
                            >
                                Signaler l'incident
                            </Button>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
