import React, { useState } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Container, StyledText, Input, Button } from '../theme/components';
import { useTheme } from '../theme/ThemeProvider';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const theme = useTheme();

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={{
        alignSelf: item.isUser ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginVertical: theme.space[2],
        padding: theme.space[2],
        backgroundColor: item.isUser ? theme.colors.primary : theme.colors.muted,
        borderRadius: 12,
      }}
    >
      <StyledText
        style={{
          color: item.isUser ? '#FFFFFF' : theme.colors.text,
        }}
      >
        {item.text}
      </StyledText>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Container style={{ flex: 1 }}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: theme.space[2] }}
        />
        <View
          style={{
            flexDirection: 'row',
            padding: theme.space[2],
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Input
            style={{ flex: 1, marginRight: theme.space[2] }}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
          />
          <Button onPress={handleSend}>
            <StyledText style={{ color: '#FFFFFF' }}>Send</StyledText>
          </Button>
        </View>
      </Container>
    </KeyboardAvoidingView>
  );
}; 