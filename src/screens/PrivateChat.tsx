import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
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
import * as DocumentPicker from "expo-document-picker";
import { Audio, Video } from "expo-av";
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
          video: doc.data().video,
          audio: doc.data().audio,
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
      const { _id, createdAt, text, user, image, video, audio } = messages[0];
      setMessages((previousMessages: any) =>
        GiftedChat.append(previousMessages, messages)
      );
      addDoc(collection(database, "privateChats", chatId, "messages"), {
        _id,
        createdAt,
        text,
        user,
        image: image || null,
        video: video || null,
        audio: audio || null,
      });
    },
    [userId]
  );

  const pickMedia = async (mediaType: ImagePicker.MediaTypeOptions) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your media!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const fileName = asset.uri.split("/").pop();
      const storageRef = ref(storage, `chat_media/${fileName}`);
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
          image:
            mediaType === ImagePicker.MediaTypeOptions.Images
              ? downloadURL
              : null,
          video:
            mediaType === ImagePicker.MediaTypeOptions.Videos
              ? downloadURL
              : null,
        },
      ]);
    }
  };

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
    });

    if (result.type === "success") {
      const response = await fetch(result.uri);
      const blob = await response.blob();
      const fileName = result.name;
      const storageRef = ref(storage, `chat_audio/${fileName}`);
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
          audio: downloadURL,
        },
      ]);
    }
  };

  const renderMessageVideo = (props) => {
    const { currentMessage } = props;
    return (
      <View style={{ padding: 10 }}>
        <Video
          source={{ uri: currentMessage.video }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="cover"
          shouldPlay
          isLooping
          style={{ width: 200, height: 200 }}
        />
      </View>
    );
  };

  const renderActions = (props: Readonly<ActionsProps>) => (
    <Actions
      {...props}
      options={{
        ["Choose Image From Library"]: () =>
          pickMedia(ImagePicker.MediaTypeOptions.Images),
        ["Choose Video From Library"]: () =>
          pickMedia(ImagePicker.MediaTypeOptions.Videos),
        ["Choose Audio From Library"]: pickAudio,
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
      renderMessageVideo={renderMessageVideo}
    />
  );
};

export default PrivateChat;
