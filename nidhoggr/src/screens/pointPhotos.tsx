import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";

export function PointPhotosScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const db = useSQLiteContext();

  const pointId = route.params?.pointId;
  const [photos, setPhotos] = useState([]);

  const loadPhotos = async () => {
    try {
      const result = await db.getAllAsync(
        `SELECT Photo.* FROM Photo
         JOIN Image_Point ON Photo.UUID = Image_Point.Image_ID
         WHERE Image_Point.Point_ID = ?`,
        [pointId]
      );

      setPhotos(
        result.map((p) => ({
          id: p.UUID,
          base64: p.Picture,
        }))
      );
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
        alert("Permission caméra refusée");
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: true,
      });

      if (res.canceled) return;

      const base64 = res.assets[0].base64;
      const photoId = uuid.v4();

      await db.runAsync(
        `INSERT INTO Photo (UUID, Picture, Picture_name)
         VALUES (?, ?, ?)`,
        [photoId, base64, `${photoId}.jpg`]
      );

      await db.runAsync(
        `INSERT INTO Image_Point (Image_ID, Point_ID)
         VALUES (?, ?)`,
        [photoId, pointId]
      );

      setPhotos((prev) => [...prev, { id: photoId, base64 }]);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Photos */}
      <ScrollView contentContainerStyle={styles.photoContainer}>
        {photos.map((photo) => (
          <Image
            key={photo.id}
            source={{ uri: `data:image/jpeg;base64,${photo.base64}` }}
            style={styles.photo}
          />
        ))}
      </ScrollView>

      {/* Camera */}
      <TouchableOpacity style={styles.addButton} onPress={takePhoto}>
        <Text style={styles.addButtonText}>📸 Prendre une photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 20 },
  photoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
  },
  photo: { width: 110, height: 110, borderRadius: 8 },
  addButton: {
    backgroundColor: "#8DC63F",
    padding: 15,
    borderRadius: 12,
    margin: 20,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 18 },
});
