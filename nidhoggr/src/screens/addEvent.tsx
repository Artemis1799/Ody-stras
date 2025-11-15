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
import { v4 as uuidv4 } from "uuid";
import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";

export function CreateEventScreen() {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [dateDebut, setDateDebut] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const db = useSQLiteContext();

  const handleSubmit = async () => {
    console.log({ nom, description, dateDebut });
    try {
      const insert = await db.runAsync(
        "INSERT INTO Evenement (UUID, Nom, Description, Date_debut, Status) VALUES (?, ?, ?, ?, ?)",
        [uuid.v4(), nom, description, dateDebut.toISOString(), "A_ORGANISER"]
      );
      alert("Événement créé : " + insert);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../ressources/header.png")}
          style={styles.headerImage}
        />
        <Ionicons name="person-circle-outline" size={28} color="white" />
      </View>

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
          <Text style={styles.buttonText}>Valider</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerImage: {
    width: "40%",
    height: 30,
    alignSelf: "center",
  },
  header: {
    backgroundColor: "#9EC54D",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 10,
    paddingLeft: 30,
    paddingRight: 14,
  },
  headerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    marginTop: 10,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateInput: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#A6CE39",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 25,
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "500",
  },
});
