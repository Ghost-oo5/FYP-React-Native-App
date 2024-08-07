import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, ImageBackground, SafeAreaView, Modal } from 'react-native';
import { FIRESTORE_DB, FIREBASE_Auth } from '../../FirebaseConfig';
import { collection, addDoc, onSnapshot, orderBy, doc, getDoc, updateDoc, query } from 'firebase/firestore';
import { format } from 'date-fns';
import * as Notifications from 'expo-notifications';

const ChatRoom = ({ route, navigation }) => {
  const { conversation } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState({});
  const [conversationPartner, setConversationPartner] = useState({});
  const [lastNotifiedMessageId, setLastNotifiedMessageId] = useState('');
  const [showBookingRequest, setShowBookingRequest] = useState(false);
  const [bookingRequestMessage, setBookingRequestMessage] = useState('');

  const auth = FIREBASE_Auth;
  const user = auth.currentUser;
  const senderId = user?.uid;

  const fetchUserDetails = useCallback(async () => {
    try {
      const userIds = [conversation.senderId, conversation.receiverId];
      const userDetailsMap = {};

      for (const userId of userIds) {
        const userRef = doc(FIRESTORE_DB, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          userDetailsMap[userId] = { ...userSnap.data(), _id: userId };
        }
      }

      setUserDetails(userDetailsMap);

      const partnerId = senderId === conversation.senderId ? conversation.receiverId : conversation.senderId;
      setConversationPartner(userDetailsMap[partnerId] || { name: 'Unknown', photoURL: null, _id: partnerId });

    } catch (error) {
      console.error("Error fetching user details: ", error);
      setError("Failed to load user details.");
    }
  }, [conversation.senderId, conversation.receiverId, senderId]);

  useEffect(() => {
    if (!conversation || !conversation.id) {
      setError('Invalid conversation data');
      setLoading(false);
      return;
    }

    fetchUserDetails();

    const q = query(
      collection(FIRESTORE_DB, 'chats', conversation.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const fetchedMessages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            _id: doc.id,
            text: data.text,
            createdAt: data.createdAt?.toDate() || new Date(),
            user: {
              _id: data.user._id,
              name: userDetails[data.user._id]?.name || 'Unknown User',
              photoURL: userDetails[data.user._id]?.photoURL || null,
            },
          };
        });

        setMessages(fetchedMessages);

        if (querySnapshot.docs.length > 0) {
          const latestMessage = querySnapshot.docs[querySnapshot.docs.length - 1].data();
          if (latestMessage.user._id !== senderId && latestMessage.id !== lastNotifiedMessageId) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: `New message from ${userDetails[latestMessage.user._id]?.name || 'User'}`,
                body: latestMessage.text,
              },
              trigger: null,
            });

            setLastNotifiedMessageId(latestMessage.id);
          }
        }
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

    navigation.setOptions({ headerShown: false });

    return () => unsubscribe();
  }, [conversation?.id, fetchUserDetails, userDetails, senderId, lastNotifiedMessageId, navigation]);

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const senderName = userDetails[senderId]?.name || 'User';

    const newMessage = {
      text: inputMessage,
      createdAt: new Date(),
      user: {
        _id: senderId,
        name: senderName,
      },
      recipientId: senderId === conversation.senderId ? conversation.receiverId : conversation.senderId,
      timestamp: new Date(),
      senderName: senderName,
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

  const sendBookingRequest = async () => {
    try {
      const recipientId = senderId === conversation.senderId ? conversation.receiverId : conversation.senderId;
      const bookingRequest = {
        requesterId: senderId,
        recipientId: recipientId,
        status: 'pending',
        message: bookingRequestMessage,
        createdAt: new Date(),
      };
  
      console.log('Booking request to be sent:', bookingRequest);
  
      // Add booking request to bookingRequests collection
      const docRef1 = await addDoc(collection(FIRESTORE_DB, 'bookingRequests'), bookingRequest);
      console.log('Booking request added to bookingRequests with ID:', docRef1.id);
  
      // Add booking request to tenantBookingRequests collection
      const docRef2 = await addDoc(collection(FIRESTORE_DB, 'tenantBookingRequests'), bookingRequest);
      console.log('Booking request added to tenantBookingRequests with ID:', docRef2.id);
  
      alert('Booking request sent successfully!');
      setBookingRequestMessage('');
      setShowBookingRequest(false);
    } catch (error) {
      console.error("Error sending booking request: ", error.message);
      setError(`Failed to send booking request: ${error.message}`);
    }
  };
  

  const renderItem = ({ item }) => (
    <View style={[styles.messageBubble, item.user._id === senderId ? styles.userBubble : styles.agentBubble]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>{format(item.createdAt, 'p')}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground source={require('../assets/bg.jpg')} style={styles.background}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{ uri: conversationPartner.photoURL }}
            style={styles.profilePicture}
          />
          <TouchableOpacity onPress={() => {
            if (conversationPartner._id) {
              navigation.navigate('ViewUserProfile', { userId: conversationPartner._id });
            } else {
              console.error("No user ID available for conversation partner");
            }
          }}>
            <Text style={styles.receiverName}>
              {conversationPartner.name}
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          style={styles.messageList}
        />
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => setShowBookingRequest(!showBookingRequest)} style={styles.optionsButton}>
            <Text style={styles.optionsButtonText}>⋮</Text>
          </TouchableOpacity>
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
        <Modal
          transparent={true}
          visible={showBookingRequest}
          onRequestClose={() => setShowBookingRequest(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Booking Request</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your booking request message"
                value={bookingRequestMessage}
                onChangeText={setBookingRequestMessage}
              />
              <TouchableOpacity style={styles.modalButton} onPress={sendBookingRequest}>
                <Text style={styles.modalButtonText}>Send Request</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowBookingRequest(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#00ADEF',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  receiverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  agentBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  sendButton: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#00ADEF',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  optionsButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#00ADEF',
    borderRadius: 20,
    marginRight: 5,
  },
  optionsButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 10,
  },
  modalButton: {
    padding: 10,
    backgroundColor: '#00ADEF',
    borderRadius: 10,
    marginVertical: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default ChatRoom;
