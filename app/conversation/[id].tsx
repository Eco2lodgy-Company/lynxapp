import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, StyleSheet
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Send, Paperclip, Camera, MapPin, Clock, MoreVertical, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, SlideInRight, Layout } from 'react-native-reanimated';

export default function ConversationScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<any[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [attachments, setAttachments] = useState<{uri: string, type: string, name: string}[]>([]);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/conversations/${id}`);
            setConversation(res.data);
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error('Error loading conversation:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    }, [messages.length]);

    const sendMessage = async () => {
        if (!text.trim() && attachments.length === 0) return;
        setSending(true);
        const messageText = text.trim();
        setText('');
        try {
            let uploadedUrls: string[] = [];
            for (const att of attachments) {
                const formData = new FormData();
                formData.append('file', {
                    uri: att.uri,
                    type: att.type,
                    name: att.name
                } as any);

                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data?.url) {
                    uploadedUrls.push(uploadRes.data.url);
                }
            }

            await api.post('/messages', {
                conversationId: id,
                content: messageText,
                attachments: uploadedUrls,
            });
            setAttachments([]);
            fetchMessages();
        } catch (err: any) {
            Alert.alert('Erreur', err.response?.data?.error || 'Impossible d\'envoyer le message');
            setText(messageText);
        } finally {
            setSending(false);
        }
    };

    const pickMedia = async (useCamera: boolean) => {
        try {
            const { status } = useCamera 
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permission requise', 'Accès caméra/galerie nécessaire.');
                return;
            }

            const result = useCamera 
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: true,
                    quality: 0.8,
                  })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: true,
                    quality: 0.8,
                  });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const uri = asset.uri;
                const type = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
                const name = uri.split('/').pop() || `media-${Date.now()}`;
                setAttachments(prev => [...prev, { uri, type, name }]);
            }
        } catch (error) {
            console.error('Error picking media:', error);
        }
    };

    const handleAttachPhoto = () => {
        Alert.alert(
            'Joindre un média',
            'Sélecteur de fichiers LYNX',
            [
                { text: 'Appareil Photo', onPress: () => pickMedia(true) },
                { text: 'Bibliothèque', onPress: () => pickMedia(false) },
                { text: 'Annuler', style: 'cancel' },
            ]
        );
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
        if (d.toDateString() === yesterday.toDateString()) return 'Hier';
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    };

    const groupedMessages: { date: string; items: any[] }[] = [];
    let lastDate = '';
    for (const msg of messages) {
        const date = formatDate(msg.createdAt);
        if (date !== lastDate) {
            groupedMessages.push({ date, items: [] });
            lastDate = date;
        }
        groupedMessages[groupedMessages.length - 1].items.push(msg);
    }

    const displayName = conversation?.name ||
        (conversation?.members?.filter((m: any) => m.userId !== user?.id)?.[0]?.user
            ? `${conversation.members.filter((m: any) => m.userId !== user?.id)[0].user.firstName} ${conversation.members.filter((m: any) => m.userId !== user?.id)[0].user.lastName}`
            : 'Discussion');

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-slate-950"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <LinearGradient
                colors={['#1e293b', '#0f172a', '#020617']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Header */}
            <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={{ paddingTop: insets.top }}>
                <View className="flex-row items-center px-5 py-4 border-b border-white/5">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center border border-white/5 mr-4">
                        <ChevronLeft size={22} color="#C8842A" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-white font-black text-lg tracking-tight" numberOfLines={1}>{displayName}</Text>
                        <View className="flex-row items-center mt-0.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-500" />
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest" numberOfLines={1}>
                                {conversation?.project ? conversation.project.name : 'Canal Sécurisé'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center border border-white/5">
                        <MoreVertical size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </BlurView>

            {/* Messages */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#C8842A" size="large" />
                </View>
            ) : (
                <ScrollView
                    ref={scrollRef}
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {groupedMessages.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-24">
                            <View className="w-20 h-20 bg-slate-900 rounded-[30px] items-center justify-center mb-6 border border-white/5">
                                <Send size={32} color="#1e293b" strokeWidth={1.5} />
                            </View>
                            <Text className="text-slate-500 font-black text-xs uppercase tracking-[3px] text-center px-10">
                                Début de la transmission
                            </Text>
                        </View>
                    ) : (
                        groupedMessages.map((group, gi) => (
                            <View key={gi}>
                                <View className="flex-row items-center my-8">
                                    <View className="flex-1 h-[1px] bg-white/5" />
                                    <View className="bg-slate-900/80 px-4 py-1.5 rounded-full border border-white/5 mx-4">
                                        <Text className="text-slate-500 text-[9px] font-black uppercase tracking-[2px]">{group.date}</Text>
                                    </View>
                                    <View className="flex-1 h-[1px] bg-white/5" />
                                </View>
                                {group.items.map((msg: any, idx: number) => {
                                    const isMe = msg.authorId === user?.id;
                                    const attachments = msg.attachments ? (typeof msg.attachments === 'string' ? JSON.parse(msg.attachments) : msg.attachments) : [];
                                    
                                    return (
                                        <Animated.View 
                                            key={msg.id} 
                                            entering={FadeInDown.delay(idx * 50)}
                                            layout={Layout.springify()}
                                            className={`mb-6 max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                                        >
                                            {!isMe && (
                                                <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5 ml-2">
                                                    {msg.author?.firstName} {msg.author?.lastName}
                                                </Text>
                                            )}
                                            
                                            <View className={`p-1 rounded-[28px] ${isMe ? 'bg-primary/10 border border-primary/20' : 'bg-slate-900/80 border border-white/5'}`}>
                                                {attachments.length > 0 && (
                                                    <View className="mb-1">
                                                        {attachments.map((url: string, i: number) => (
                                                            <Image
                                                                key={i}
                                                                source={{ uri: url }}
                                                                className="w-64 h-64 rounded-[24px]"
                                                                resizeMode="cover"
                                                            />
                                                        ))}
                                                    </View>
                                                )}
                                                <View className="px-4 py-3">
                                                    <Text className={`text-[15px] leading-6 font-medium ${isMe ? 'text-primary' : 'text-slate-200'}`}>
                                                        {msg.content}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View className={`flex-row items-center mt-1.5 mx-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <Text className="text-slate-600 text-[9px] font-black tracking-widest uppercase">
                                                    {formatTime(msg.createdAt)}
                                                </Text>
                                                {isMe && <View className="w-1 h-1 rounded-full bg-primary mx-1.5 opacity-50" />}
                                            </View>
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Input Bar */}
            <BlurView intensity={Platform.OS === 'ios' ? 90 : 100} tint="dark" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
                {attachments.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 py-4 border-b border-white/5">
                        {attachments.map((att, i) => (
                            <View key={i} className="mr-4 relative">
                                <Image source={{ uri: att.uri }} className="w-20 h-20 rounded-2xl border border-white/10" />
                                <TouchableOpacity 
                                    onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute -top-2 -right-2 bg-slate-950 rounded-full w-7 h-7 items-center justify-center border border-white/10 shadow-lg"
                                >
                                    <X color="#EF4444" size={14} strokeWidth={3} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
                
                <View className="px-5 py-5 flex-row items-center">
                    <TouchableOpacity
                        onPress={handleAttachPhoto}
                        className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/5 mr-3"
                    >
                        <Paperclip size={20} color="#C8842A" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <View className="flex-1 bg-white/5 border border-white/5 rounded-[24px] px-5 py-1 min-h-[52px] justify-center">
                        <TextInput
                            className="text-white text-[14px] font-medium py-2.5"
                            placeholder="Message sécurisé..."
                            placeholderTextColor="#334155"
                            value={text}
                            onChangeText={setText}
                            multiline
                            style={{ maxHeight: 100 }}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={sending || (!text.trim() && attachments.length === 0)}
                        className={`w-12 h-12 rounded-2xl items-center justify-center ml-3 shadow-2xl ${(text.trim() || attachments.length > 0) ? 'bg-primary shadow-primary/30' : 'bg-white/5 border border-white/5'}`}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#0F172A" />
                        ) : (
                            <Send size={20} color={(text.trim() || attachments.length > 0) ? '#0F172A' : '#334155'} strokeWidth={2.5} />
                        )}
                    </TouchableOpacity>
                </View>
            </BlurView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({});
