import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Dimensions, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../consts/colors';

const { width } = Dimensions.get('screen');

const ListingDetails = ({ route, navigation }) => {
  const { item } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Customize status bar */}
      <StatusBar
        translucent={false}
        backgroundColor={COLORS.white}
        barStyle="dark-content"
      />

      <ScrollView>
        <View style={styles.container}>
          <Image source={{ uri: item.image }} style={styles.image} />

          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>${item.price} / month</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.location}><Icon name="location-pin" size={20} color={COLORS.grey} /> {item.location}</Text>
            
            {/* Additional Details */}
            <View style={styles.facilitiesContainer}>
              <View style={styles.facility}>
                <Icon name="hotel" size={18} />
                <Text style={styles.facilityText}>2 Beds</Text>
              </View>
              <View style={styles.facility}>
                <Icon name="bathtub" size={18} />
                <Text style={styles.facilityText}>2 Baths</Text>
              </View>
              <View style={styles.facility}>
                <Icon name="aspect-ratio" size={18} />
                <Text style={styles.facilityText}>100m²</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  image: {
    width: '100%',
    height: width * 0.8,
    borderRadius: 15,
  },
  detailsContainer: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginVertical: 10,
  },
  description: {
    fontSize: 16,
    color: COLORS.grey,
    marginVertical: 10,
  },
  location: {
    fontSize: 16,
    color: COLORS.grey,
    marginVertical: 10,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  facility: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  facilityText: {
    marginLeft: 5,
    color: COLORS.grey,
    fontSize: 16,
  },
});

export default ListingDetails;
