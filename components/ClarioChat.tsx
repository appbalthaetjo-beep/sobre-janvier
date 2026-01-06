import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, Image } from 'react-native';
import { Send, X } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing,
  withSpring
} from 'react-native-reanimated';
import { sendClarioMessage, type ClarioChatMessage } from '@/lib/clario';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ClarioChatProps {
  onClose: () => void;
}

// Composant pour les particules animées
function FloatingParticle({ delay, initialX, initialY }: { delay: number; initialX: number; initialY: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    setTimeout(() => {
      translateY.value = withRepeat(
        withTiming(-30, { 
          duration: 3000 + Math.random() * 2000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
        }),
        -1,
        true
      );
      
      opacity.value = withRepeat(
        withTiming(0.8, { 
          duration: 2000 + Math.random() * 1000,
          easing: Easing.bezier(0.42, 0, 0.58, 1) 
        }),
        -1,
        true
      );
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        styles.particle, 
        { 
          left: initialX, 
          top: initialY 
        },
        animatedStyle
      ]} 
    />
  );
}

export default function ClarioChat({ onClose }: ClarioChatProps) {
  const insets = useSafeAreaInsets();
  const [chatMode, setChatMode] = useState<'intro' | 'chat'>('intro');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animations pour l'intro
  const introOpacity = useSharedValue(1);
  const introScale = useSharedValue(1);
  const chatOpacity = useSharedValue(0);
  const chatTranslateY = useSharedValue(50);

  // Générer les particules avec positions aléatoires
  const particles = Array.from({ length: 25 }, (_, index) => ({
    id: index,
    delay: Math.random() * 5000,
    initialX: Math.random() * width,
    initialY: Math.random() * height,
  }));

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageToSend = inputText.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };

    // Si c'est le premier message, ajouter le message d'accueil de Clario
    let initialMessages = [];
    if (chatMode === 'intro') {
      const clarioWelcome: Message = {
        id: 'clario-welcome',
        text: "Salut, je suis Clario, thérapeute expert pour t'accompagner à combattre le porno. Je suis là pour t'écouter et te soutenir.",
        isUser: false,
        timestamp: new Date(),
      };
      initialMessages = [clarioWelcome];
      
      // Transition vers le mode chat
      transitionToChat();
    }

    const historyForAssistant: ClarioChatMessage[] = [...messages, ...initialMessages, userMessage].map((msg) => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
    }));

    setMessages(prev => [...prev, ...initialMessages, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      const clarioAnswer = await sendClarioMessage(messageToSend, historyForAssistant);

      const clarioResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: clarioAnswer,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, clarioResponse]);
      
    } catch (error) {
      console.error('Erreur Clario:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Je rencontre des difficultés techniques. En attendant, prends une grande respiration : inspire 4 secondes, retiens 7 secondes, expire 8 secondes. Tu peux aussi contacter les lignes d'aide dans la section urgence.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const transitionToChat = () => {
    // Animation de transition fluide
    introOpacity.value = withTiming(0, { duration: 400 });
    introScale.value = withTiming(0.9, { duration: 400 });
    
    setTimeout(() => {
      setChatMode('chat');
      chatOpacity.value = withTiming(1, { duration: 500 });
      chatTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 400);
  };

  useEffect(() => {
    if (chatMode === 'chat') {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, isTyping, chatMode]);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introOpacity.value,
    transform: [{ scale: introScale.value }],
  }));

  const chatStyle = useAnimatedStyle(() => ({
    opacity: chatOpacity.value,
    transform: [{ translateY: chatTranslateY.value }],
  }));

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Fond avec particules animées */}
      <View style={styles.background}>
        {particles.map((particle) => (
          <FloatingParticle
            key={particle.id}
            delay={particle.delay}
            initialX={particle.initialX}
            initialY={particle.initialY}
          />
        ))}
      </View>

      {/* Header - TOUJOURS VISIBLE */}
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Image
            source={{ uri: 'https://i.imgur.com/yWky9d2.png' }}
            style={styles.clarioAvatar}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Clario</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* MODE INTRO - Page d'accueil */}
      {chatMode === 'intro' && (
        <Animated.View
          style={[styles.introContainer, introStyle, { paddingBottom: 120 + Math.max(insets.bottom - 16, 0) }]}
        >
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Salut, je suis <Text style={styles.clarioName}>Clario</Text>, thérapeute expert pour t'accompagner à combattre le porno.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* MODE CHAT - Interface de conversation */}
      {chatMode === 'chat' && (
        <Animated.View style={[styles.chatContainer, chatStyle]}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.messagesContent, { paddingBottom: 20 + Math.max(insets.bottom, 12) }]}
          >
            {messages.map((message, index) => (
              <View
                key={message.id}
                style={styles.messageContainer}
              >
                {message.isUser ? (
                  <View style={styles.userMessageBubble}>
                    <Text style={styles.userMessageText}>{message.text}</Text>
                  </View>
                ) : (
                  <View style={styles.clarioMessageContainer}>
                    <Text style={styles.clarioMessageText}>{message.text}</Text>
                  </View>
                )}
              </View>
            ))}
            
            {isTyping && (
              <View style={styles.messageContainer}>
                <View style={styles.typingContainer}>
                  <View style={styles.typingIndicator}>
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* Input fixe en bas - TOUJOURS VISIBLE */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom + 16, 40) }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Dis-moi tout..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={18} color={(inputText.trim() && !isLoading) ? "#000000" : "rgba(255, 255, 255, 0.3)"} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clarioAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  
  // INTRO MODE STYLES
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120, // Espace pour l'input
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 34,
  },
  clarioName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  
  // CHAT MODE STYLES
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  messagesContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  clarioMessageContainer: {
    maxWidth: '85%',
  },
  clarioMessageText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 26,
  },
  userMessageBubble: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 20,
    borderTopRightRadius: 4,
    padding: 16,
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  userMessageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  typingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    opacity: 0.6,
  },
  
  // INPUT STYLES (TOUJOURS VISIBLE)
  inputContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    zIndex: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    maxHeight: 80,
    minHeight: 24,
    paddingVertical: 4,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
  },
});
