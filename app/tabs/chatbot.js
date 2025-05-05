import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';
import { Text, TextInput, IconButton, Chip, Avatar, ActivityIndicator, Surface, Snackbar } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { sendMessageToAI, formatConversationForAI } from '../../lib/openRouterService';
import { useAuth } from '../../contexts/AuthContext';

// Sample initial messages
const initialMessages = [
  {
    id: '1',
    text: 'Hello! I\'m your AI travel assistant powered by Gemini. How can I help you plan your perfect trip today?',
    sender: 'bot',
    timestamp: new Date(),
  },
];

export default function ChatbotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const flatListRef = useRef(null);
  const typingDotAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation for typing indicator
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDotAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(typingDotAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      typingDotAnimation.setValue(0);
    }
  }, [isTyping]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
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
    setIsTyping(true);

    try {
      // Get updated messages including the new user message
      const updatedMessages = [...messages, userMessage];
      
      // Format messages for OpenRouter API
      const formattedMessages = formatConversationForAI(updatedMessages);
      
      console.log('Sending message to OpenRouter API...');
      
      // Call OpenRouter API with Gemini model
      const aiResponse = await sendMessageToAI(formattedMessages);
      
      console.log('Received response from OpenRouter API:', aiResponse);
      
      // Add AI response to chat
      const botResponse = {
        id: Date.now().toString(),
        text: aiResponse.content,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      // Add a small delay to make the typing indicator more realistic
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setErrorMessage('Sorry, I encountered an error. Please try again.');
      setIsError(true);
      
      // Fallback to local response generation if API fails
      const fallbackResponse = {
        id: Date.now().toString(),
        text: generateBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Simple bot response generator as a fallback
  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) {
      return "Hello! How can I help with your travel plans today?";
    } else if (input.includes('hotel') || input.includes('stay')) {
      return "I can help you find hotels. What's your destination and budget?";
    } else if (input.includes('flight') || input.includes('fly')) {
      return "Looking for flights? I can help with that. Where are you flying from and to?";
    } else if (input.includes('restaurant') || input.includes('food') || input.includes('eat')) {
      return "Hungry? I can recommend some great local restaurants. What cuisine are you in the mood for?";
    } else if (input.includes('weather')) {
      return "The weather forecast is looking good for your destination. Would you like more details?";
    } else if (input.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    } else {
      const fallbackResponses = [
        "That's an interesting question about travel. Can you tell me more about what you're looking for?",
        "I'd recommend checking out the local attractions when you arrive at your destination.",
        "Have you considered adding some flexibility to your travel dates? It can often lead to better deals.",
        "Remember to check visa requirements well in advance of your trip.",
        "Travel insurance is always a good idea, especially for international trips."
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  const renderMessage = ({ item }) => {
    const isBot = item.sender === 'bot';
    
    return (
      <View style={[
        styles.messageBubble, 
        isBot ? styles.botBubble : styles.userBubble
      ]}>
        {isBot && (
          <Avatar.Icon 
            size={32} 
            icon="robot" 
            style={styles.botAvatar}
            color="#fff"
          />
        )}
        <Surface style={[
          styles.messageContent,
          isBot ? styles.botMessageContent : styles.userMessageContent
        ]}>
          <Text style={[
            styles.messageText,
            isBot ? styles.botMessageText : styles.userMessageText
          ]}>
            {item.text}
          </Text>
          
          {/* Message timestamp */}
          <Text style={styles.timestampText}>
            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </Surface>
      </View>
    );
  };

  const renderQuickAction = (icon, label, onPress, iconFamily = 'material') => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      {iconFamily === 'material' ? (
        <MaterialIcons name={icon} size={24} color="#0066cc" style={styles.quickActionIcon} />
      ) : (
        <MaterialCommunityIcons name={icon} size={24} color="#0066cc" style={styles.quickActionIcon} />
      )}
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const handleQuickAction = (category) => {
    let prompt = '';
    
    switch(category) {
      case 'hotels':
        prompt = 'What are some good hotels to stay in Paris?';
        break;
      case 'flights':
        prompt = 'How can I find the best flight deals to Tokyo?';
        break;
      case 'restaurants':
        prompt = 'Recommend some local restaurants in Barcelona.';
        break;
      case 'attractions':
        prompt = 'What are the must-see attractions in New York City?';
        break;
      case 'transport':
        prompt = 'What\'s the best way to get around in London?';
        break;
      case 'shopping':
        prompt = 'Where are the best shopping areas in Milan?';
        break;
      default:
        prompt = 'I need travel recommendations.';
    }
    
    setInputText(prompt);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Travel Assistant</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      />
      
      {isTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.dot, {opacity: typingDotAnimation}]} />
            <Animated.View style={[styles.dot, {opacity: typingDotAnimation, marginHorizontal: 4}]} />
            <Animated.View style={[styles.dot, {opacity: typingDotAnimation}]} />
          </View>
          <Text style={styles.typingText}>Gemini is thinking...</Text>
        </View>
      )}
      
      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          {renderQuickAction('apartment', 'Hotels', () => handleQuickAction('hotels'))}
          {renderQuickAction('flight', 'Flights', () => handleQuickAction('flights'))}
          {renderQuickAction('restaurant', 'Food', () => handleQuickAction('restaurants'))}
          {renderQuickAction('place', 'Attractions', () => handleQuickAction('attractions'))}
          {renderQuickAction('directions-bus', 'Transport', () => handleQuickAction('transport'))}
          {renderQuickAction('shopping-cart', 'Shopping', () => handleQuickAction('shopping'))}
        </ScrollView>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          mode="outlined"
          outlineColor="#ddd"
          activeOutlineColor="#0066cc"
          dense
          disabled={isTyping}
          right={
            <TextInput.Icon 
              icon="send" 
              color={inputText.trim() && !isTyping ? "#0066cc" : "#ccc"}
              disabled={!inputText.trim() || isTyping}
              onPress={handleSend}
            />
          }
        />
      </View>
      
      <Snackbar
        visible={isError}
        onDismiss={() => setIsError(false)}
        action={{
          label: 'Dismiss',
          onPress: () => setIsError(false),
        }}
        duration={3000}
      >
        {errorMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingTop: 60,
    paddingBottom: 15,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 15,
    paddingBottom: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botAvatar: {
    backgroundColor: '#0066cc',
    marginRight: 8,
  },
  messageContent: {
    padding: 12,
    borderRadius: 18,
    elevation: 1,
  },
  botMessageContent: {
    backgroundColor: '#e6f2ff',
    borderBottomLeftRadius: 5,
  },
  userMessageContent: {
    backgroundColor: '#0066cc',
    borderBottomRightRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botMessageText: {
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginBottom: 10,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066cc',
  },
  typingText: {
    color: '#666',
    fontSize: 14,
  },
  timestampText: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  quickActions: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickActionsScroll: {
    paddingVertical: 5,
  },
  quickAction: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  quickActionIcon: {
    marginBottom: 5,
  },
  quickActionLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  inputContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    backgroundColor: '#fff',
  },
});
