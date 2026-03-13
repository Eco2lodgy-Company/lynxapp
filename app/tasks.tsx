import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import api from '../lib/api';
import { CheckSquare, Calendar, MoreVertical, PlayCircle, CheckCircle, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

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
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le statut de la tâche.');
            fetchTasks(); 
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
            case 'TERMINE': return { label: 'Terminé', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle size={14} color="#10B981" /> };
            case 'EN_COURS': return { label: 'En cours', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)', icon: <PlayCircle size={14} color="#6366F1" /> };
            case 'EN_ATTENTE': return { label: 'En attente', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={14} color="#F59E0B" /> };
            case 'A_FAIRE': 
            default:
                return { label: 'À faire', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', icon: <CheckSquare size={14} color="#94A3B8" /> };
        }
    };

    const TaskCard = ({ task, index }: { task: any, index: number }) => {
        const statusInfo = getStatusInfo(task.status);
        const isCompleted = task.status === 'TERMINE';

        return (
            <PremiumCard index={index} glass={true} style={{ padding: 16, marginBottom: 12 }}>
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-4">
                        <Text className={`font-black text-lg tracking-tight mb-1 ${isCompleted ? 'text-slate-600 line-through opacity-50' : 'text-white'}`}>
                            {task.title}
                        </Text>
                        <View className="flex-row items-center">
                            <View className="w-1 h-1 rounded-full bg-primary/40 mr-2" />
                            <Text className="text-primary text-[10px] font-black uppercase tracking-widest">{task.project?.name || 'Projet Général'}</Text>
                        </View>
                    </View>
                    
                    {!isCompleted && (
                        <TouchableOpacity 
                            onPress={() => handleActionPress(task)} 
                            className="w-10 h-10 bg-slate-900 rounded-xl items-center justify-center border border-white/5"
                        >
                            <MoreVertical size={20} color="#C8842A" />
                        </TouchableOpacity>
                    )}
                </View>

                {task.description && (
                    <Text className={`text-sm leading-5 mb-4 font-medium ${isCompleted ? 'text-slate-700' : 'text-slate-400'}`} numberOfLines={2}>
                        {task.description}
                    </Text>
                )}

                <View className="flex-row items-center justify-between pt-4 border-t border-white/5 mt-1">
                    <View style={{ backgroundColor: statusInfo.bg }} className="px-3 py-1.5 rounded-lg flex-row items-center border border-white/5">
                        {statusInfo.icon}
                        <Text style={{ color: statusInfo.color }} className="text-[10px] ml-2 font-black uppercase tracking-wider">
                            {statusInfo.label}
                        </Text>
                    </View>
                    
                    {task.dueDate && (
                        <View className="flex-row items-center bg-slate-950/30 px-3 py-1.5 rounded-lg border border-white/5">
                            <Calendar size={12} color={isCompleted ? '#334155' : '#94A3B8'} />
                            <Text className={`text-[10px] ml-2 font-black uppercase tracking-wider ${isCompleted ? 'text-slate-700 font-bold' : 'text-slate-400'}`}>
                                {new Date(task.dueDate).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
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
            
            <View className="px-5 mb-10" style={{ paddingTop: Math.max(insets.top, 24) }}>
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[4px] mb-1">Missions & Objectifs</Text>
                <Text className="text-white text-4xl font-black tracking-tight">Tâches</Text>
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
                    {tasks.length === 0 ? (
                        <Animated.View entering={FadeIn.delay(300)} className="items-center justify-center py-20">
                            <View className="w-24 h-24 bg-slate-900 rounded-[35px] items-center justify-center mb-6 border border-white/5">
                                <CheckSquare size={48} color="#1e293b" strokeWidth={1.5} />
                            </View>
                            <Text className="text-white font-black text-xl mb-2">Libre d'esprit</Text>
                            <Text className="text-slate-500 text-center text-sm font-medium">Vous n'avez pas de tâche immédiate. Prenez de l'avance !</Text>
                        </Animated.View>
                    ) : (
                        tasks.map((task, idx) => (
                            <TaskCard key={task.id} task={task} index={idx} />
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}
