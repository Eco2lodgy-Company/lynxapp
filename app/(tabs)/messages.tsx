import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Platform } from 'react-native';
import api from '../../lib/api';
import { MessageSquare, ChevronRight, User, Search, Plus } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export default function MessagesScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const fetchConversations = async () => {
        try {
            const response = await api.get('/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchConversations();
        setRefreshing(false);
    }, []);

    const ConversationCard = ({ conversation, index }: { conversation: any, index: number }) => {
        const lastMessage = conversation.messages?.[0];
        const otherMembers = conversation.members.filter((m: any) => m.userId !== user?.id);
        const displayName = conversation.name || (otherMembers.length > 0 ? `${otherMembers[0].user.firstName} ${otherMembers[0].user.lastName}` : "Discussion");

        return (
            <PremiumCard index={index} glass={true} style={{ padding: 14, marginBottom: 12 }}>
                <TouchableOpacity 
                    className="flex-row items-center"
                    activeOpacity={0.7}
                    onPress={() => router.push(`/conversation/${conversation.id}`)}
                >
                    <View className="relative">
                        <View className="w-14 h-14 rounded-[22px] bg-slate-800 items-center justify-center mr-4 border border-white/5 overflow-hidden">
                            <User size={28} color="#C8842A" strokeWidth={1.5} />
                        </View>
                        <View className="absolute bottom-0 right-4 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-sm" />
                    </View>
                    
                    <View className="flex-1">
                        <View className="flex-row justify-between items-center mb-1">
                            <Text className="text-white font-black text-[16px] tracking-tight" numberOfLines={1}>
                                {displayName}
                            </Text>
                            {lastMessage && (
                                <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                    {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            )}
                        </View>
                        
                        <Text className="text-slate-400 text-[13px] font-medium leading-4" numberOfLines={1}>
                            <Text className="text-primary/70">{lastMessage?.author.firstName}: </Text>
                            {lastMessage ? lastMessage.content : "Aucun message transmis"}
                        </Text>
                        
                        {conversation.project && (
                            <View className="mt-2.5 bg-white/5 self-start px-2.5 py-1 rounded-lg border border-white/5">
                                <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[2px]">
                                    {conversation.project.name}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    <View className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50 ml-2">
                        <ChevronRight color="#C8842A" size={16} strokeWidth={3} />
                    </View>
                </TouchableOpacity>
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
                <Animated.View entering={FadeInUp.duration(600)} className="mb-8 flex-row justify-between items-end">
                    <View>
                        <Text className="text-slate-500 text-sm font-bold uppercase tracking-[4px] mb-2">Canaux</Text>
                        <Text className="text-white text-4xl font-black tracking-tighter">Messages</Text>
                    </View>
                    <TouchableOpacity className="w-12 h-12 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/30">
                        <Plus size={24} color="#0F172A" strokeWidth={3} />
                    </TouchableOpacity>
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
                        {conversations.length > 0 ? (
                            conversations.map((conv, index) => (
                                <ConversationCard key={conv.id} conversation={conv} index={index} />
                            ))
                        ) : (
                            <View className="items-center justify-center py-24">
                                <View className="w-20 h-20 bg-slate-900 rounded-[30px] items-center justify-center mb-6 border border-white/5">
                                    <MessageSquare size={32} color="#1e293b" strokeWidth={1.5} />
                                </View>
                                <Text className="text-slate-500 font-black text-xs uppercase tracking-[3px] text-center px-10">
                                    Aucune discussion sécurisée
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({});
