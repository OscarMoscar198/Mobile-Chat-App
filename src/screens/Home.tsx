import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { auth, database } from "../config/firebase";
import { signOut } from "firebase/auth";
import colors from "../theme/colors";
import { SafeAreaView } from 'react-native';

const catImageUrl =
  "https://cdna.artstation.com/p/assets/images/images/050/089/394/large/steven-lo-ji-1.jpg?1654031250";

const Home = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <FontAwesome
          name="search"
          size={24}
          color={colors.gray}
          style={{ marginLeft: 15 }}
        />
      ),
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={handleSignOut} style={{ marginRight: 15 }}>
            <FontAwesome name="sign-out" size={24} color={colors.gray} />
          </TouchableOpacity>
          <Image
            source={{ uri: catImageUrl }}
            style={{
              width: 40,
              height: 40,
              marginRight: 15,
            }}
          />
        </View>
      ),
    });
  }, [navigation]);

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate("Login" as never);
      })
      .catch((error) => {
        Alert.alert("Error", error.message);
      });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(database, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  const handleUserPress = (user: any) => {
    navigation.navigate("PrivateChat", {
      userId: user.uid,
      userEmail: user.email,
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleUserPress(item)}>
              <View style={styles.userItem}>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate("Chat" as never)}
          style={styles.chatButton}
        >
          <Entypo name="chat" size={24} color={colors.lightGray} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  userEmail: {
    fontSize: 16,
  },
  chatButton: {
    backgroundColor: colors.primary,
    height: 50,
    width: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    marginRight: 20,
    marginBottom: 50,
    position: "absolute",
    right: 20,
    bottom: 20,
  },
});
