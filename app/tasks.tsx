import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../lib/api';
import { CheckSquare, Calendar, MoreVertical, PlayCircle, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TasksScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks');
            setTasks(response.data);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchTasks();
        setRefreshing(false);
    }, []);

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            // Update local state temporarily for snappy UI
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le statut de la tâche.');
            fetchTasks(); // Revert on failure
        }
    };

    const handleActionPress = (task: any) => {
        const options = [];
        
        if (task.status === 'A_FAIRE') {
            options.push({ text: 'Commencer', onPress: () => updateTaskStatus(task.id, 'EN_COURS') });
        } else if (task.status === 'EN_COURS') {
            options.push({ text: 'Mettre en pause', onPress: () => updateTaskStatus(task.id, 'EN_ATTENTE') });
            options.push({ text: 'Terminer', onPress: () => updateTaskStatus(task.id, 'TERMINE') });
        } else if (task.status === 'EN_ATTENTE') {
            options.push({ text: 'Reprendre', onPress: () => updateTaskStatus(task.id, 'EN_COURS') });
        }

        if (task.status !== 'TERMINE') {
            options.push({ text: 'Terminer', onPress: () => updateTaskStatus(task.id, 'TERMINE') });
        }

        options.push({ text: 'Annuler', style: 'cancel' });

        Alert.alert(
            'Action',
            `Modifier le statut de "${task.title}"`,
            options as any
        );
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'TERMINE': return { label: 'Terminé', color: 'bg-emerald-500 text-white', icon: <CheckCircle size={14} color="#10B981" /> };
            case 'EN_COURS': return { label: 'En cours', color: 'bg-indigo-500 text-white', icon: <PlayCircle size={14} color="#6366F1" /> };
            case 'EN_ATTENTE': return { label: 'En attente', color: 'bg-amber-500 text-white', icon: <Calendar size={14} color="#F59E0B" /> };
            case 'A_FAIRE': 
            default:
                return { label: 'À faire', color: 'bg-slate-600 text-white', icon: <CheckSquare size={14} color="#94A3B8" /> };
        }
    };

    const TaskCard = ({ task }: { task: any }) => {
        const statusInfo = getStatusInfo(task.status);
        const isCompleted = task.status === 'TERMINE';

        return (
            <View className={`p-4 rounded-2xl border mb-3 ${isCompleted ? 'bg-slate-800/30 border-slate-800/50' : 'bg-slate-800 border-slate-700/50'}`}>
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                        <Text className={`font-bold text-base mb-1 ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                            {task.title}
                        </Text>
                        <Text className="text-primary text-xs font-medium">{task.project?.name}</Text>
                    </View>
                    
                    {!isCompleted && (
                        <TouchableOpacity onPress={() => handleActionPress(task)} className="p-1">
                            <MoreVertical size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>

                {task.description && (
                    <Text className={`text-sm mb-3 ${isCompleted ? 'text-slate-600' : 'text-slate-400'}`} numberOfLines={2}>
                        {task.description}
                    </Text>
                )}

                <View className="flex-row items-center justify-between border-t border-slate-700/30 pt-3 mt-1">
                    <View className="flex-row items-center">
                        {statusInfo.icon}
                        <Text className={`text-xs ml-1.5 font-medium ${isCompleted ? 'text-emerald-500/50' : 'text-slate-300'}`}>
                            {statusInfo.label}
                        </Text>
                    </View>
                    
                    {task.dueDate && (
                        <View className="flex-row items-center">
                            <Calendar size={12} color={isCompleted ? '#475569' : '#94A3B8'} />
                            <Text className={`text-xs ml-1 ${isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                                {new Date(task.dueDate).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-slate-900" style={{ paddingTop: Math.max(insets.top, 24) }}>
            <View className="px-5 mb-5">
                <Text className="text-white text-3xl font-black tracking-tight mb-1">Tâches</Text>
                <Text className="text-slate-400 text-sm">Organisez et validez le travail</Text>
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
                    {tasks.length === 0 ? (
                        <View className="items-center justify-center py-20">
                            <View className="w-16 h-16 bg-slate-800 rounded-full items-center justify-center mb-4">
                                <CheckSquare size={32} color="#475569" />
                            </View>
                            <Text className="text-white font-bold text-lg mb-2">Aucune tâche</Text>
                            <Text className="text-slate-400 text-center">Vous n'avez pas de tâche assignée pour le moment.</Text>
                        </View>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}
