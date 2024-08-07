import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Alert, SectionList, ScrollView } from 'react-native';
import { FIRESTORE_DB, FIREBASE_Auth } from '../../FirebaseConfig';
import { collection, getDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ListItem, Icon, Text, Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const ProfileScreen = () => {
  const [listings, setListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profileType, setProfileType] = useState(''); // Add state for profileType

  const navigation = useNavigation();
  const storage = getStorage();

  useEffect(() => {
    const unsubscribeAuth = FIREBASE_Auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserProfile(user);
        const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || '');
          setContactNumber(data.contactNumber || '');
          setAddress(data.address || '');
          setProfileImage(data.photoURL || '');
          setWhatsappNumber(data.whatsappNumber || '');
          setEmail(data.email || '');
          setProfileType(data.profileType || ''); // Set profileType based on user data
        }

        // Fetch user's listings
        const userQuery = query(collection(FIRESTORE_DB, 'rentals'), where('postedBy', '==', user.uid));
        const unsubscribeListings = onSnapshot(userQuery, (snapshot) => {
          const listingsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setListings(listingsList);
        });

        // Fetch user's payment history
        const paymentQuery = query(collection(FIRESTORE_DB, 'payments'), where('userId', '==', user.uid));
        const unsubscribePayments = onSnapshot(paymentQuery, (snapshot) => {
          const paymentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPaymentHistory(paymentsList);
        });

        // Fetch user's reviews
        const reviewsQuery = query(collection(FIRESTORE_DB, 'reviews'), where('userId', '==', user.uid));
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
          const reviewsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReviews(reviewsList);
        });

        return () => {
          unsubscribeListings();
          unsubscribePayments();
          unsubscribeReviews();
        };
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);



  const handleModifyListing = (item) => {
    navigation.navigate('EditListing', { item });
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen', { profileData: { name, contactNumber, address } });
  };

  const handleViewPaymentHistory = () => {
    navigation.navigate('PaymentHistory', { paymentHistory });
  };

  const handleViewReviews = () => {
    navigation.navigate('ReviewsAndRatingsScreen', { reviews });
  };

  const handleSupport = () => {
    navigation.navigate('SupportScreen');
  };

  const getBlobFromUri = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };
  

  const uploadProfileImage = async (uri) => {
    try {
      const blob = await getBlobFromUri(uri);
      const storageRef = ref(storage, `profilePictures/${userProfile.uid}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Uploaded image URL:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error during image upload:', error);
      throw error;
    }
  };


  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult);

      if (!permissionResult.granted) {
        alert("You've refused to allow this app to access your photos!");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3] });
      console.log('Picker result:', pickerResult);

      if (!pickerResult.cancelled && pickerResult.assets.length > 0) {
        const pickedImage = pickerResult.assets[0];
        const { uri } = pickedImage;
        console.log('Picked image URI:', uri);

        if (!uri) {
          console.error('URI is undefined or null.');
          Alert.alert('Error', 'Failed to pick image. Please try again.');
          return;
        }

        setProfileImage(uri);

        const imageUrl = await uploadProfileImage(uri);
        await updateProfileImage(imageUrl);
      }
    } catch (error) {
      console.error('Error during image upload:', error);
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  const updateProfileImage = async (imageUrl) => {
    try {
      const userDocRef = doc(FIRESTORE_DB, 'users', userProfile.uid);
      await updateDoc(userDocRef, { photoURL: imageUrl });
      setUserProfile({ ...userProfile, photoURL: imageUrl });
      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile image.');
    }
  };
  

  const renderProfileSection = () => (
    <View style={styles.profileContainer}>
      {userProfile && (
        <>
          <Image source={{ uri: profileImage || userProfile.photoURL }} style={styles.profileImage} />
          <TouchableOpacity style={styles.editIconContainer} onPress={handleImageUpload}>
            <Icon name="edit" color="#00ADEF" />
          </TouchableOpacity>
          <Text h4 style={styles.username}>{userProfile.displayName}</Text>
          <Text style={styles.email}>{userProfile.email}</Text>
        </>
      )}
      <Text h4 style={styles.header}>Profile Information</Text>
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Contact Number:</Text>
          <Text style={styles.infoValue}>{contactNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address:</Text>
          <Text style={styles.infoValue}>{address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>WhatsApp Number:</Text>
          <Text style={styles.infoValue}>{whatsappNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>
      </View>
      <Button title="Edit Profile" buttonStyle={styles.editButton} onPress={handleEditProfile} />
    </View>
  );

  const renderListings = () => (
    <SectionList
      sections={[
        { title: 'My Listings', data: listings },
      ]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ListItem
          title={item.title}
          subtitle={`Price: PKR ${item.price}`}
          bottomDivider
          rightElement={
            <TouchableOpacity onPress={() => handleModifyListing(item)}>
              <Icon name="edit" />
            </TouchableOpacity>
          }
        />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <ListItem containerStyle={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{title}</Text>
        </ListItem>
      )}
    />
  );

  const renderPaymentHistory = () => (
    <View style={styles.favoritesContainer}>
      <TouchableOpacity style={styles.favoritesOption} onPress={handleViewPaymentHistory}>
        <Icon name="credit-card" type="material" color="#00ADEF" />
        <Text style={styles.favoritesText}>Payment History</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviews = () => (
    <View style={styles.favoritesContainer}>
      <TouchableOpacity style={styles.favoritesOption} onPress={handleViewReviews}>
        <Icon name="star" type="material" color="#00ADEF" />
        <Text style={styles.favoritesText}>Reviews</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSupport = () => (
    <Button title="Support" buttonStyle={styles.editButton} onPress={handleSupport} />
  );

  return (
    <ScrollView style={styles.container}>
      {renderProfileSection()}
      {/* {renderListings()} */}
      {renderPaymentHistory()}
      {renderReviews()}
      {renderSupport()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    width: '95%',
    marginHorizontal: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 0,
    marginTop: 15,
    borderWidth: 3,
    borderColor: '#00ADEF',
  },
  editIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    marginBottom: 8,
    color: '#00ADEF',
    marginLeft: 10,
  },
  infoContainer: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#00ADEF',
    marginTop: 12,
  },
  favoritesContainer: {
    paddingVertical: 5,
    width: '95%',
    marginHorizontal: '3%',
    marginBottom: 10,
  },
  favoritesOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  favoritesText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF5722',
  },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
  },
  sectionHeaderText: {
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
