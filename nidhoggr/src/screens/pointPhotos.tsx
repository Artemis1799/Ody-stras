import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";
import { Picture, pointPhotoParams } from "../../types/types";
import { getPhotosForPoint, insert } from "../../database/queries";
import { Strings } from "../../types/strings";
import { Header } from "../components/header";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";

export function PointPhotosScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const route = useRoute();
  const db = useSQLiteContext();

  const { pointId } = route.params as pointPhotoParams;
  const [photos, setPhotos] = useState<Picture[]>([]);

  const loadPhotos = async () => {
    try {
      const result: Picture[] = await getPhotosForPoint(db, pointId);
      setPhotos(result);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        alert(Strings.pointPhotos.cameraPermissionDenied);
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: true,
      });

      if (res.canceled) return;

      const base64 = res.assets[0].base64;
      const photoId = uuid.v4();
      if (base64) {
        await insert<Picture>(db, "Picture", {
          UUID: photoId,
          PointID: pointId,
          Picture: base64,
        });

        setPhotos((prev) => [
          ...prev,
          { UUID: photoId, Picture: base64, PointID: pointId },
        ]);
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* Photos */}
      <ScrollView contentContainerStyle={styles.photoContainer}>
        {photos.map((photo) => (
          <Image
            key={photo.UUID}
            source={{ uri: `data:image/jpeg;base64,${photo.Picture}` }}
            style={styles.photo}
          />
        ))}
      </ScrollView>

      {/* Camera */}
      <TouchableOpacity style={styles.addButton} onPress={takePhoto}>
        <Text style={styles.addButtonText}>
          {Strings.pointPhotos.takePhoto}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
