import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Send, Paperclip, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

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
        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        // Scroll to bottom when messages load
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages.length]);

    const sendMessage = async () => {
        if (!text.trim() && attachments.length === 0) return;
        setSending(true);
        const messageText = text.trim();
        setText('');
        try {
            let uploadedUrls: string[] = [];
            
            // Upload attachments first
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
            setAttachments([]); // Clear attachments on success
            fetchMessages();
        } catch (err: any) {
            Alert.alert('Erreur', err.response?.data?.error || 'Impossible d\'envoyer le message');
            setText(messageText); // Restore on failure
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
                Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre caméra ou galerie.');
                return;
            }

            const result = useCamera 
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images', 'videos'],
                    allowsEditing: true,
                    quality: 0.8,
                  })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images', 'videos'],
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
            Alert.alert('Erreur', 'Impossible de charger le média.');
        }
    };

    const handleAttachPhoto = () => {
        Alert.alert(
            'Joindre un fichier',
            'Choisissez une option',
            [
                { text: 'Prendre une photo/vidéo', onPress: () => pickMedia(true) },
                { text: 'Galerie', onPress: () => pickMedia(false) },
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

    // Group messages by date
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
            className="flex-1 bg-slate-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            {/* Header */}
            <View
                className="flex-row items-center px-4 py-3 border-b border-slate-800 bg-slate-900"
                style={{ paddingTop: Math.max(insets.top, 16) }}
            >
                <TouchableOpacity onPress={() => router.back()} className="mr-3 bg-slate-800 p-2 rounded-full">
                    <ChevronLeft size={20} color="#FFF" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-white font-bold text-base" numberOfLines={1}>{displayName}</Text>
                    {conversation?.project && (
                        <Text className="text-primary text-xs mt-0.5">📍 {conversation.project.name}</Text>
                    )}
                </View>
            </View>

            {/* Messages */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#22C55E" size="large" />
                </View>
            ) : (
                <ScrollView
                    ref={scrollRef}
                    className="flex-1 px-4"
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                >
                    {groupedMessages.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-slate-500 italic text-center">
                                Aucun message pour l'instant.{'\n'}Commencez la discussion !
                            </Text>
                        </View>
                    ) : (
                        groupedMessages.map((group, gi) => (
                            <View key={gi}>
                                {/* Date separator */}
                                <View className="flex-row items-center my-4">
                                    <View className="flex-1 h-px bg-slate-700/50" />
                                    <Text className="text-slate-500 text-[11px] mx-3 font-medium">{group.date}</Text>
                                    <View className="flex-1 h-px bg-slate-700/50" />
                                </View>
                                {group.items.map((msg: any) => {
                                    const isMe = msg.authorId === user?.id;
                                    const hasAttachment = msg.attachments && JSON.parse(msg.attachments || '[]').length > 0;
                                    const attachments = hasAttachment ? JSON.parse(msg.attachments) : [];
                                    return (
                                        <View key={msg.id} className={`mb-3 max-w-[82%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                            {!isMe && (
                                                <Text className="text-slate-500 text-[10px] mb-1 ml-1">
                                                    {msg.author?.firstName} {msg.author?.lastName}
                                                </Text>
                                            )}
                                            <View className={`px-4 py-3 rounded-2xl ${isMe
                                                ? 'bg-primary rounded-tr-sm'
                                                : 'bg-slate-700/80 rounded-tl-sm border border-slate-600/30'
                                            }`}>
                                                {attachments.map((url: string, i: number) => (
                                                    <Image
                                                        key={i}
                                                        source={{ uri: url }}
                                                        className="w-40 h-40 rounded-xl mb-2"
                                                        resizeMode="cover"
                                                    />
                                                ))}
                                                <Text className={`text-sm leading-5 ${isMe ? 'text-slate-900 font-medium' : 'text-white'}`}>
                                                    {msg.content}
                                                </Text>
                                            </View>
                                            <Text className="text-slate-600 text-[10px] mt-1 mx-1">
                                                {formatTime(msg.createdAt)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Input Bar */}
            <View
                className="bg-slate-800 border-t border-slate-700"
                style={{ paddingBottom: Math.max(insets.bottom, 12) }}
            >
                {/* Pending Attachments Preview */}
                {attachments.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2 border-b border-slate-700/50">
                        {attachments.map((att, i) => (
                            <View key={i} className="mr-3 relative mt-2 mb-2">
                                <Image source={{ uri: att.uri }} className="w-16 h-16 rounded-xl border border-slate-600" />
                                <TouchableOpacity 
                                    onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center border border-slate-800"
                                >
                                    <Text className="text-white text-[10px] font-bold">X</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
                <View className="flex-row items-center px-4 py-3">
                    <TouchableOpacity
                        onPress={handleAttachPhoto}
                        className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center mr-2"
                    >
                        <Paperclip size={18} color="#94A3B8" />
                    </TouchableOpacity>
                <TextInput
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-white text-sm max-h-28"
                    placeholder="Écrire un message..."
                    placeholderTextColor="#475569"
                    value={text}
                    onChangeText={setText}
                    multiline
                    returnKeyType="default"
                />
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={sending || (!text.trim() && attachments.length === 0)}
                        className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${(text.trim() || attachments.length > 0) ? 'bg-primary' : 'bg-slate-700'}`}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#0F172A" />
                        ) : (
                            <Send size={17} color={(text.trim() || attachments.length > 0) ? '#0F172A' : '#475569'} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
