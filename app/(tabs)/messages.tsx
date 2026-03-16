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
            <PremiumCard index={index} glass={true} style={{ padding: 16, marginBottom: 16, borderRadius: 28 }}>
                <TouchableOpacity 
                    className="flex-row items-center"
                    activeOpacity={0.7}
                    onPress={() => router.push(`/conversation/${conversation.id}`)}
                >
                    <View className="relative">
                        <View className="w-16 h-16 rounded-[24px] bg-bg-soft items-center justify-center mr-5 border border-border-light overflow-hidden">
                            <User size={30} color="#4A3520" strokeWidth={2} />
                        </View>
                        <View className="absolute bottom-1 right-5 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    </View>
                    
                    <View className="flex-1">
                        <View className="flex-row justify-between items-center mb-1.5">
                            <Text className="text-secondary font-black text-[17px] tracking-tight" numberOfLines={1}>
                                {displayName}
                            </Text>
                            {lastMessage && (
                                <Text className="text-secondary/30 text-[10px] font-black uppercase tracking-[2px]">
                                    {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            )}
                        </View>
                        
                        <Text className="text-secondary/50 text-[14px] font-bold leading-5" numberOfLines={1}>
                            <Text className="text-primary/80">{lastMessage?.author.firstName}: </Text>
                            {lastMessage ? lastMessage.content : "Début de la transmission..."}
                        </Text>
                        
                        {conversation.project && (
                            <View className="mt-3 bg-primary/5 self-start px-3 py-1.5 rounded-xl border border-primary/10">
                                <Text className="text-primary text-[9px] font-black uppercase tracking-[3px]">
                                    {conversation.project.name}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    <View className="bg-bg-soft p-2.5 rounded-2xl ml-3">
                        <ChevronRight color="#E67E22" size={18} strokeWidth={3} />
                    </View>
                </TouchableOpacity>
            </PremiumCard>
        );
    };

    return (
        <View className="flex-1 bg-white">
            <LinearGradient
                colors={['#FFFFFF', '#FDFCFB', '#F8F9FA']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <View 
                className="flex-1 px-5"
                style={{ paddingTop: Math.max(insets.top, 24) }}
            >
                <Animated.View entering={FadeInUp.duration(600)} className="mb-10 flex-row justify-between items-end">
                    <View>
                        <Text className="text-secondary/40 text-sm font-black uppercase tracking-[5px] mb-2">Canaux Sécurisés</Text>
                        <Text className="text-secondary text-4xl font-black tracking-tighter">Messages</Text>
                    </View>
                    <TouchableOpacity className="w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-xl shadow-primary/40">
                        <Plus size={28} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                </Animated.View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#E67E22" size="large" />
                    </View>
                ) : (
                    <ScrollView 
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E67E22" />}
                    >
                        {conversations.length > 0 ? (
                            conversations.map((conv, index) => (
                                <ConversationCard key={conv.id} conversation={conv} index={index} />
                            ))
                        ) : (
                            <View className="items-center justify-center py-24 bg-bg-soft/50 rounded-[40px] border border-border-light">
                                <View className="w-24 h-24 bg-white rounded-[35px] items-center justify-center mb-8 shadow-sm">
                                    <MessageSquare size={40} color="#F2F2F2" strokeWidth={1.5} />
                                </View>
                                <Text className="text-secondary/30 font-black text-xs uppercase tracking-[4px] text-center px-10">
                                    Aucune discussion active
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
