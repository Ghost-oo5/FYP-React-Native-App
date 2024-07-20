import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ImageBackground, Image } from 'react-native';
import { FIRESTORE_DB, FIREBASE_Auth } from '../../FirebaseConfig';
import { collection, addDoc, onSnapshot, orderBy, doc, getDoc, updateDoc, query } from 'firebase/firestore';
import { format } from 'date-fns';

const ChatRoom = ({ route, navigation }) => {
  const { conversation } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userNames, setUserNames] = useState({});
  const [userPhotos, setUserPhotos] = useState({});

  const auth = FIREBASE_Auth;
  const user = auth.currentUser;
  const senderId = user?.uid;
  const senderName = user?.displayName || 'User';

  const fetchUserNamesAndPhotos = async () => {
    try {
      const userIds = [conversation.senderId, conversation.receiverId];
      const userNamesMap = {};
      const userPhotosMap = {};

      for (const userId of userIds) {
        const userRef = doc(FIRESTORE_DB, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          userNamesMap[userId] = userSnap.data().name;
          userPhotosMap[userId] = userSnap.data().photoURL;
        }
      }

      setUserNames(userNamesMap);
      setUserPhotos(userPhotosMap);
    } catch (error) {
      console.error("Error fetching user names: ", error);
      setError("Failed to load user names.");
    }
  };

  useEffect(() => {
    if (!conversation || !conversation.id) {
      setError('Invalid conversation data');
      setLoading(false);
      return;
    }

    fetchUserNamesAndPhotos();

    const q = query(
      collection(FIRESTORE_DB, 'chats', conversation.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const messages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            _id: doc.id,
            text: data.text,
            createdAt: data.createdAt?.toDate() || new Date(),
            user: {
              _id: data.user._id,
              name: userNames[data.user._id] || 'Unknown User',
              photoURL: userPhotos[data.user._id] || null,
            },
          };
        });

        setMessages(messages);
      } catch (error) {
        console.error("Error fetching messages: ", error);
        setError("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Snapshot error: ", error);
      setError("Failed to load messages.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversation?.id, userNames, userPhotos]);

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const newMessage = {
      text: inputMessage,
      createdAt: new Date(),
      user: {
        _id: senderId,
        name: senderName,
      },
    };

    try {
      await addDoc(collection(FIRESTORE_DB, 'chats', conversation.id, 'messages'), newMessage);

      const conversationDocRef = doc(FIRESTORE_DB, 'chats', conversation.id);
      await updateDoc(conversationDocRef, {
        lastMessage: inputMessage,
        lastMessageTime: new Date(),
      });

      setInputMessage('');
    } catch (error) {
      console.error("Error sending message: ", error);
      setError("Failed to send message.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageBubble, item.user._id === senderId ? styles.userBubble : styles.agentBubble]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>{format(item.createdAt, 'p')}</Text>
    </View>
  );

  const handleProfilePictureClick = (userId) => {
    navigation.navigate('ViewUserProfile', { userId });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={require('../assets/bg.jpg')} style={styles.background}>
      <View style={styles.container}>
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          style={styles.messageList}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type your message..."
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  agentBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#6c757d',
  },
  messageText: {
    color: '#fff',
  },
  messageTime: {
    color: '#fff',
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ChatRoom;
