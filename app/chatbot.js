import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';

// Sample initial messages
const initialMessages = [
  {
    id: '1',
    text: 'Hello! I\'m your AI travel assistant. How can I help you plan your perfect trip today?',
    sender: 'bot',
    timestamp: new Date(),
  },
];

export default function ChatbotScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() === '') return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, botResponse]);
    }, 1000);
  };

  // Simple bot response generator - would be replaced with actual AI logic
  const generateBotResponse = (userInput) => {
    const userInputLower = userInput.toLowerCase();
    
    if (userInputLower.includes('hotel') || userInputLower.includes('stay')) {
      return "I can help you find the perfect hotel! What's your destination and when are you planning to visit?";
    } else if (userInputLower.includes('flight') || userInputLower.includes('fly')) {
      return "Looking for flights? I can search for the best options. Where are you flying from and to?";
    } else if (userInputLower.includes('restaurant') || userInputLower.includes('food') || userInputLower.includes('eat')) {
      return "I know some great restaurants! What type of cuisine are you interested in?";
    } else if (userInputLower.includes('activity') || userInputLower.includes('attraction') || userInputLower.includes('visit')) {
      return "There are many exciting activities to explore! What kinds of attractions are you interested in?";
    } else if (userInputLower.includes('budget') || userInputLower.includes('cost') || userInputLower.includes('price')) {
      return "I can help you plan a trip that fits your budget. What's your approximate budget range?";
    } else if (userInputLower.includes('hello') || userInputLower.includes('hi')) {
      return "Hello there! How can I assist with your travel plans today?";
    } else if (userInputLower.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    } else {
      return "That sounds interesting! I'd be happy to help you plan this aspect of your trip. Could you provide more details?";
    }
  };

  const renderMessage = ({ item }) => {
    const isBot = item.sender === 'bot';
    
    return (
      <View style={[
        styles.messageBubble, 
        isBot ? styles.botBubble : styles.userBubble
      ]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Travel Assistant</Text>
        <View style={styles.placeholder} />
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      />
      
      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              setInputText('Find me a hotel in Paris');
              setTimeout(() => handleSend(), 100);
            }}
          >
            <Text style={styles.quickActionText}>🏨 Hotels</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              setInputText('I need flight recommendations');
              setTimeout(() => handleSend(), 100);
            }}
          >
            <Text style={styles.quickActionText}>✈️ Flights</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              setInputText('What activities do you recommend?');
              setTimeout(() => handleSend(), 100);
            }}
          >
            <Text style={styles.quickActionText}>🎭 Activities</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              setInputText('Local food recommendations please');
              setTimeout(() => handleSend(), 100);
            }}
          >
            <Text style={styles.quickActionText}>🍽️ Restaurants</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0066cc',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    fontSize: 24,
    color: '#fff',
    width: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 30,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  botBubble: {
    backgroundColor: '#e6f2ff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  userBubble: {
    backgroundColor: '#0066cc',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  quickActions: {
    padding: 10,
  },
  quickActionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickActionText: {
    color: '#333',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#0066cc',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginLeft: 10,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
