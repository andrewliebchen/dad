import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { database } from '../services/database';
import type { Thread } from '../services/database';

interface ThreadListProps {
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  selectedThreadId?: string;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

export function ThreadList({ onSelectThread, onNewThread, selectedThreadId }: ThreadListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    try {
      const loadedThreads = await database.getThreads();
      setThreads(loadedThreads);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onNewThread}
        style={styles.newChatButton}
      >
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>
      
      {threads.map((thread) => (
        <TouchableOpacity
          key={thread.id}
          onPress={() => onSelectThread(thread.id)}
          style={[
            styles.threadItem,
            thread.id === selectedThreadId && styles.selectedThread
          ]}
        >
          <Text style={styles.threadTitle}>{thread.title}</Text>
          <Text style={styles.threadDate}>
            {formatDate(thread.lastMessageAt)}
          </Text>
        </TouchableOpacity>
      ))}

      {threads.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chats yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
  },
  newChatText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  threadItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
  },
  selectedThread: {
    backgroundColor: '#F0F0F0',
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  threadDate: {
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666666',
  },
}); 