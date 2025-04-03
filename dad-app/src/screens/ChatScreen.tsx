import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import { Container, StyledText } from '../theme/components';
import { useTheme } from '../theme/ThemeProvider';
import { generateDadResponse, Message as OpenAIMessage } from '../services/openai';
import { database } from '../services/database';
import { ThreadList } from '../components/ThreadList';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Chat: undefined;
};

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  threadId: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showThreads, setShowThreads] = useState(true);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const theme = useTheme();
  const navigation = useNavigation<ChatScreenNavigationProp>();

  const toggleThreads = useCallback(() => {
    setShowThreads(prev => !prev);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={toggleThreads}>
          <Text style={{ color: '#fff', fontSize: 16, marginRight: 10 }}>
            {showThreads ? 'Close' : 'Chats'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, showThreads, toggleThreads]);

  useEffect(() => {
    if (currentThreadId) {
      loadMessages(currentThreadId);
    }
  }, [currentThreadId]);

  const loadMessages = async (threadId: string) => {
    try {
      const threadMessages = await database.getMessagesForThread(threadId);
      setMessages(threadMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleNewThread = useCallback(async () => {
    try {
      const threadId = uuidv4();
      const now = Date.now();
      
      // Create the thread first
      await database.createThread({
        id: threadId,
        title: 'New Chat',
        createdAt: now,
        lastMessageAt: now,
      });

      // Then update state
      setCurrentThreadId(threadId);
      setMessages([]);
      setShowThreads(false);
      
      console.log('Created new thread:', threadId); // Debug log
    } catch (error) {
      console.error('Error creating new thread:', error);
    }
  }, []);

  const handleSelectThread = useCallback(async (threadId: string) => {
    try {
      // Verify the thread exists
      const thread = await database.getThread(threadId);
      if (!thread) {
        console.error('Thread not found:', threadId);
        return;
      }

      setCurrentThreadId(threadId);
      setShowThreads(false);
      
      console.log('Selected thread:', threadId); // Debug log
    } catch (error) {
      console.error('Error selecting thread:', error);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading || !currentThreadId) {
      console.log('Send conditions not met:', { 
        hasText: !!inputText.trim(), 
        isLoading, 
        threadId: currentThreadId 
      }); // Debug log
      return;
    }

    const timestamp = Date.now();
    const userMessage: ChatMessage = {
      id: uuidv4(),
      text: inputText.trim(),
      isUser: true,
      timestamp,
      threadId: currentThreadId,
    };

    try {
      setIsLoading(true);
      
      // Save user message first
      await database.saveMessage(userMessage);
      console.log('Saved user message:', userMessage.id); // Debug log
      
      // Update UI
      setMessages(prev => [...prev, userMessage]);
      setInputText('');

      // Get conversation history
      const conversationHistory: OpenAIMessage[] = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text,
      }));

      // Get Dad's response
      const dadResponse = await generateDadResponse(userMessage.text, conversationHistory);
      console.log('Got dad response'); // Debug log

      const dadMessage: ChatMessage = {
        id: uuidv4(),
        text: dadResponse || 'I apologize, but I seem to be having trouble responding right now.',
        isUser: false,
        timestamp: Date.now(),
        threadId: currentThreadId,
      };

      // Save dad's message
      await database.saveMessage(dadMessage);
      console.log('Saved dad message:', dadMessage.id); // Debug log

      // Update thread title if it's the first message
      if (messages.length === 0) {
        await database.updateThreadTitle(currentThreadId, userMessage.text);
        console.log('Updated thread title'); // Debug log
      }

      // Update UI with dad's message
      setMessages(prev => [...prev, dadMessage]);
    } catch (error) {
      console.error('Error in send message flow:', error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        text: 'I apologize, but I seem to be having trouble connecting right now. Please try again later.',
        isUser: false,
        timestamp: Date.now(),
        threadId: currentThreadId,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, currentThreadId, messages]);

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.dadMessage,
        { marginLeft: item.isUser ? 50 : 10, marginRight: item.isUser ? 10 : 50 }
      ]}
    >
      <StyledText
        style={[
          styles.messageText,
          { color: item.isUser ? '#FFFFFF' : theme.colors.text }
        ]}
      >
        {item.text}
      </StyledText>
    </View>
  );

  if (showThreads) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThreadList
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
          selectedThreadId={currentThreadId || undefined}
        />
      </SafeAreaView>
    );
  }

  const canSendMessage = !isLoading && currentThreadId && inputText.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          <View style={[styles.inputContainer, { borderTopColor: theme.colors.border }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={canSendMessage ? sendMessage : undefined}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.text + '80'}
              returnKeyType="send"
              blurOnSubmit={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!canSendMessage}
              style={[
                styles.sendButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: canSendMessage ? 1 : 0.5,
                }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    maxWidth: '85%',
    marginVertical: 8,
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderTopRightRadius: 4,
  },
  dadMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: 10,
    minHeight: 40,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 