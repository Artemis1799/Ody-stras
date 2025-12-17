import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";
import { useNavigation } from "@react-navigation/native";
import { insert } from "../../database/queries";
import { Evenement } from "../../types/types";
import { Header } from "../components/header";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";

export function CreateEventScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [dateDebut, setDateDebut] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const db = useSQLiteContext();

  const handleSubmit = async () => {
    console.log({ nom, description, dateDebut });
    try {
      await insert<Evenement>(db, "Evenement", {
        UUID: uuid.v4(),
        Nom: nom,
        Description: description,
        Date_debut: dateDebut.toISOString(),
        Status: "A_ORGANISER",
      });
      navigation.goBack();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.form}>
        <Text style={styles.label}>Nom d’événement</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez le nom..."
          value={nom}
          onChangeText={setNom}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Entrez une description..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Date de début</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{dateDebut.toLocaleDateString("fr-FR")}</Text>
          <Ionicons name="calendar-outline" size={22} color="black" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateDebut}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDateDebut(selectedDate);
            }}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonTextBlack}>Valider</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
