import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { GiftedChat, Actions, ActionsProps } from "react-native-gifted-chat";
import {
  collection,
  addDoc,
  orderBy,
  query,
  onSnapshot,
} from "firebase/firestore";
import { auth, database, storage } from "../config/firebase";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import colors from "../theme/colors";

const PrivateChat = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userEmail } = route.params as {
    userId: string;
    userEmail: string;
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 10 }}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="close" size={24} color={colors.gray} />
        </TouchableOpacity>
      ),
      headerTitle: () => <Text>{userEmail}</Text>,
    });
  }, [navigation, userEmail]);

  useLayoutEffect(() => {
    const chatId = getPrivateChatId(auth.currentUser?.uid, userId);
    const collectionRef = collection(
      database,
      "privateChats",
      chatId,
      "messages"
    );
    const q = query(collectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setMessages(
        querySnapshot.docs.map((doc) => ({
          _id: doc.data()._id,
          createdAt: doc.data().createdAt.toDate(),
          text: doc.data().text,
          user: doc.data().user,
          image: doc.data().image,
        }))
      );
    });
    return unsubscribe;
  }, [userId]);

  const getPrivateChatId = (userA: string, userB: string): string => {
    return userA < userB ? `${userA}_${userB}` : `${userB}_${userA}`;
  };

  const onSend = useCallback(
    (messages = []) => {
      const chatId = getPrivateChatId(auth.currentUser?.uid, userId);
      const { _id, createdAt, text, user, image } = messages[0];
      setMessages((previousMessages: any) =>
        GiftedChat.append(previousMessages, messages)
      );
      addDoc(collection(database, "privateChats", chatId, "messages"), {
        _id,
        createdAt,
        text,
        user,
        image: image || null,
      });
    },
    [userId]
  );

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const fileName = asset.uri.split("/").pop();
      const storageRef = ref(storage, `chat_images/${fileName}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      onSend([
        {
          _id: Date.now().toString(),
          createdAt: new Date(),
          text: "",
          user: {
            _id: auth.currentUser?.uid ?? "0",
            name: auth.currentUser?.email ?? "Unknown User",
          },
          image: downloadURL,
        },
      ]);
    }
  };

  const renderActions = (props: Readonly<ActionsProps>) => (
    <Actions
      {...props}
      options={{
        ["Choose From Library"]: pickImage,
      }}
      icon={() => <AntDesign name="plus" size={24} color={colors.gray} />}
    />
  );

  return (
    <GiftedChat
      messages={messages}
      showAvatarForEveryMessage={false}
      showUserAvatar={false}
      onSend={(messages) => onSend(messages as any)}
      messagesContainerStyle={{ backgroundColor: "#fff" }}
      user={{
        _id: auth?.currentUser?.uid ?? "0",
        name: auth?.currentUser?.email ?? "Unknown User",
      }}
      renderActions={renderActions}
    />
  );
};

export default PrivateChat;