import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../lib/api';
import { 
    MapPin, 
    User, 
    Calendar,
    ChevronRight,
    Search
} from 'lucide-react-native';
import { Input } from '../../components/ui/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProjectsScreen() {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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
                    <User size={14} color="#14F195" />
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
                    <Text className="text-white text-xs font-bold">{Math.round(project.progress ?? 0)}%</Text>
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
        </View>
    );
}
