import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import api from '../../lib/api';
import { 
    MapPin, 
    User, 
    Calendar,
    ChevronRight,
    Search,
    Edit2,
    CheckCircle
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../../components/ui/PremiumCard';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

export default function ProjectsScreen() {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { user } = useAuth();

    // Edit logic
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [newProgress, setNewProgress] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchProjects();
        setRefreshing(false);
    }, []);

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.address?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSaveProgress = async () => {
        if (!editingProject) return;
        setSaving(true);
        try {
            await api.put(`/projects/${editingProject.id}`, {
                progress: parseInt(newProgress)
            });
            setProjects(prev => prev.map(p => 
                p.id === editingProject.id ? { ...p, progress: parseInt(newProgress) } : p
            ));
            setEditModalVisible(false);
        } catch (error) {
            console.error('Error updating progress', error);
        } finally {
            setSaving(false);
        }
    };

    const ProjectCard = ({ project, index }: { project: any, index: number }) => (
        <PremiumCard index={index} glass={true} style={{ padding: 18, marginBottom: 16 }}>
            <TouchableOpacity 
                activeOpacity={0.7}
            >
                <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 mr-3">
                        <Text className="text-white text-xl font-black mb-2 tracking-tight" numberOfLines={1}>
                            {project.name}
                        </Text>
                        <View className="flex-row items-center bg-white/5 self-start px-2.5 py-1 rounded-lg border border-white/10">
                            <MapPin size={12} color="#94A3B8" />
                            <Text className="text-slate-400 text-[10px] font-bold ml-1.5 uppercase tracking-wider" numberOfLines={1}>
                                {project.address || 'Localisation non définie'}
                            </Text>
                        </View>
                    </View>
                    <View className={`px-3 py-1 transparent rounded-full border ${
                        project.status === 'EN_COURS' ? 'border-primary/50' : 'border-blue-500/50'
                    }`}>
                        <Text className={`text-[10px] font-black tracking-[1.5px] uppercase ${
                            project.status === 'EN_COURS' ? 'text-primary' : 'text-blue-400'
                        }`}>
                            {project.status === 'EN_COURS' ? 'Actif' : project.status}
                        </Text>
                    </View>
                </View>

                <View className="bg-slate-900/60 rounded-2xl p-4 mb-5 flex-row justify-between items-center border border-white/5">
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                            <User size={14} color="#C8842A" strokeWidth={2.5} />
                        </View>
                        <View>
                            <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-wider">Superviseur</Text>
                            <Text className="text-slate-200 text-xs font-bold leading-tight">
                                {project.supervisor?.firstName} {project.supervisor?.lastName}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center mr-3">
                            <Calendar size={14} color="#94A3B8" />
                        </View>
                        <View>
                            <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-wider">Début</Text>
                            <Text className="text-slate-300 text-xs font-bold leading-tight">
                                {new Date(project.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    </View>
                </View>

                <View>
                    <View className="flex-row justify-between items-end mb-3">
                        <View>
                            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px]">Progression du Chantier</Text>
                            <Text className="text-white text-2xl font-black mt-1">{Math.round(project.progress ?? 0)}%</Text>
                        </View>
                        {(user?.role === 'ADMIN' || user?.role === 'CONDUCTEUR') && (
                            <TouchableOpacity
                                onPress={() => {
                                    setEditingProject(project);
                                    setNewProgress(String(project.progress ?? 0));
                                    setEditModalVisible(true);
                                }}
                                className="bg-primary p-3 rounded-xl shadow-lg shadow-primary/30"
                            >
                                <Edit2 size={16} color="#0F172A" strokeWidth={3} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <LinearGradient
                            colors={['#C8842A', '#F59E0B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ height: '100%', width: `${Math.min(100, project.progress ?? 0)}%` }}
                        />
                    </View>
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
            
            <View 
                className="flex-1 px-5"
                style={{ paddingTop: Math.max(insets.top, 24) }}
            >
                <Animated.View entering={FadeInUp.duration(600)} className="mb-8">
                    <Text className="text-slate-500 text-sm font-bold uppercase tracking-[4px] mb-2">Suivi Global</Text>
                    <Text className="text-white text-4xl font-black tracking-tighter">Projets</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200)} className="mb-8">
                    <PremiumCard index={-1} glass={true} style={{ padding: 4, borderRadius: 20 }}>
                        <Input 
                            placeholder="Rechercher par nom ou adresse..." 
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
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map((project, index) => (
                                <ProjectCard key={project.id} project={project} index={index} />
                            ))
                        ) : (
                            <View className="items-center justify-center py-24">
                                <Search size={48} color="#1e293b" strokeWidth={1} />
                                <Text className="text-slate-500 text-base font-medium mt-4 italic">Aucune correspondance trouvée</Text>
                            </View>
                        )}
                    </ScrollView>
                )}

                {/* Edit Progress Modal */}
                {editModalVisible && editingProject && (
                    <Animated.View entering={FadeIn} className="absolute inset-0 bg-black/80 justify-end z-50">
                        <Animated.View entering={FadeInUp} className="bg-slate-950 rounded-t-[40px] p-8 border-t border-white/10">
                            <View className="flex-row justify-between items-center mb-8">
                                <View>
                                    <Text className="text-white text-2xl font-black tracking-tight">Mise à jour</Text>
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{editingProject.name}</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setEditModalVisible(false)} 
                                    className="w-10 h-10 bg-slate-900 rounded-full items-center justify-center border border-white/10"
                                >
                                    <Text className="text-white font-bold">✕</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View className="mb-10">
                                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-4">Nouveau Pourcentage d'avancement</Text>
                                <Input
                                    value={newProgress}
                                    onChangeText={setNewProgress}
                                    keyboardType="numeric"
                                    placeholder="Valeur entre 0 et 100"
                                    maxLength={3}
                                    className="bg-slate-900 h-16 text-2xl font-black text-primary"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleSaveProgress}
                                disabled={saving}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#C8842A', '#926220']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#0F172A" />
                                    ) : (
                                        <>
                                            <CheckCircle color="#0F172A" size={24} strokeWidth={3} className="mr-3" />
                                            <Text className="text-slate-950 font-black text-lg uppercase tracking-tight">Confirmer les modifications</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                            <View style={{ height: insets.bottom + 20 }} />
                        </Animated.View>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}
