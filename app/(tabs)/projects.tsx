import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
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
            // Update local state temporarily
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

    const ProjectCard = ({ project }: { project: any }) => (
        <TouchableOpacity 
            className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 mb-4"
            activeOpacity={0.7}
        >
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-3">
                    <Text className="text-white text-lg font-bold mb-1" numberOfLines={1}>
                        {project.name}
                    </Text>
                    <View className="flex-row items-center bg-slate-900/50 self-start px-2 py-0.5 rounded-full mt-1.5">
                        <MapPin size={10} color="#94A3B8" />
                        <Text className="text-slate-400 text-[10px] ml-1" numberOfLines={1}>
                            {project.address || 'Adresse non spécifiée'}
                        </Text>
                    </View>
                </View>
                <View className={`px-2.5 py-1 rounded-full border ${
                    project.status === 'EN_COURS' ? 'bg-primary/10 border-primary/20' : 'bg-blue-500/10 border-blue-500/20'
                }`}>
                    <Text className={`text-[10px] font-bold tracking-wider ${
                        project.status === 'EN_COURS' ? 'text-primary' : 'text-blue-500'
                    }`}>
                        {project.status === 'EN_COURS' ? 'ACTIF' : project.status}
                    </Text>
                </View>
            </View>

            <View className="bg-slate-900/50 rounded-xl p-3 mb-4 flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <User size={14} color="#C8842A" />
                    <Text className="text-slate-300 text-xs ml-2 font-medium">
                        {project.supervisor?.firstName} {project.supervisor?.lastName}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <Calendar size={14} color="#94A3B8" />
                    <Text className="text-slate-400 text-xs ml-2">
                        {new Date(project.startDate).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View>
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-slate-400 text-xs">Avancement global</Text>
                    <View className="flex-row items-center">
                        <Text className="text-white text-xs font-bold mr-2">{Math.round(project.progress ?? 0)}%</Text>
                        {(user?.role === 'ADMIN' || user?.role === 'CONDUCTEUR') && (
                            <TouchableOpacity
                                onPress={() => {
                                    setEditingProject(project);
                                    setNewProgress(String(project.progress ?? 0));
                                    setEditModalVisible(true);
                                }}
                                className="bg-slate-700/50 p-1 rounded-md"
                            >
                                <Edit2 size={12} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <View className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden border border-white/5">
                    <View className="h-full bg-primary shadow-sm shadow-primary" style={{ width: `${Math.min(100, project.progress ?? 0)}%` }} />
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
                <Text className="text-white text-3xl font-bold mb-2">Projets</Text>
                <Text className="text-slate-400 text-sm">Gérez et suivez vos chantiers actifs</Text>
            </View>

            <View className="mb-6">
                <Input 
                    placeholder="Rechercher un projet..." 
                    value={search}
                    onChangeText={setSearch}
                    icon={<Search size={20} color="#64748B" />}
                />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#22C55E" size="large" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
                >
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))
                    ) : (
                        <View className="items-center justify-center py-20">
                            <Text className="text-slate-500 italic">Aucun projet trouvé</Text>
                        </View>
                    )}
                    <View className="h-20" />
                </ScrollView>
            )}

            {/* Edit Progress Modal */}
            {editModalVisible && editingProject && (
                <View className="absolute inset-0 bg-black/60 justify-end z-50">
                    <View className="bg-slate-900 rounded-t-3xl p-6 border-t border-slate-800">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Modifier l'avancement</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2 bg-slate-800 rounded-full">
                                <Text className="text-white font-bold">✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text className="text-slate-400 text-sm mb-4">
                            Projet : <Text className="text-white font-bold">{editingProject.name}</Text>
                        </Text>
                        
                        <View className="mb-6">
                            <Text className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Nouveau pourcentage (%)</Text>
                            <Input
                                value={newProgress}
                                onChangeText={setNewProgress}
                                keyboardType="numeric"
                                placeholder="Ex: 65"
                                maxLength={3}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSaveProgress}
                            disabled={saving}
                            className={`w-full py-4 rounded-xl flex-row items-center justify-center ${saving ? 'bg-primary/50' : 'bg-primary'}`}
                        >
                            {saving ? (
                                <ActivityIndicator color="#0F172A" />
                            ) : (
                                <>
                                    <CheckCircle color="#0F172A" size={20} className="mr-2" />
                                    <Text className="text-slate-900 font-bold text-base">Enregistrer</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <View style={{ height: insets.bottom + 20 }} />
                    </View>
                </View>
            )}
        </View>
    );
}
