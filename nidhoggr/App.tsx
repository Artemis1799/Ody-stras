import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { CreateEventScreen } from "./src/screens/addEvent";
import { EventListScreen } from "./src/screens/eventList";
import { CreatePointScreen } from "./src/screens/createPoint";
import { PointPhotosScreen } from "./src/screens/pointPhotos";
import { MapScreen } from "./src/screens/map";

import PointsScreen from "./src/screens/points";
import EventScreen from "./src/screens/Event";

import { SQLiteProvider } from "expo-sqlite";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SQLiteProvider
      databaseName="base.db"
      assetSource={{ assetId: require("./data/base.db") }}
      onInit={async (db) => {
        console.log("Initialisation de la base…");

        // Création des tables si elles n'existent pas
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS Equipement (
            UUID TEXT PRIMARY KEY,
            Type TEXT,
            Description TEXT,
            Unite TEXT,
            Stock_total FLOAT,
            Stock_restant FLOAT
          );
        `);

        // Vérifier si la table est vide
        const rows = await db.getAllAsync(
          "SELECT COUNT(*) as count FROM Equipement"
        );
        if (rows[0].count === 0) {
          console.log("Insertion des équipements par défaut…");

          await db.runAsync(
            `INSERT INTO Equipement (UUID, Type, Description, Unite, Stock_total, Stock_restant)
             VALUES
            ('21ddc970-e5eb-4105-830b-80e1161eea72', 'Glissières béton armé (GBA)', '60 cm de large – Longueur de 2 mètres ou 1 mètre', 'U', 0, 0),
            ('1ce53d08-b85a-4fb0-8e0b-dfba5b2fb17b', 'Blocs de béton', 'Bloc de taille 0,6m x 0,6m x 1m ou 0,6m x 0,6m x 2,5m', 'U', 0, 0),
            ('60655695-a8ec-4e88-8d9f-0c770cb84a1a', 'Barrières Vauban', 'Barrières de 2 mètres', 'U', 0, 0),
            ('7f05e6b6-1bb9-4c9a-bd4a-04aaba995cd1', 'Barrières Héras', 'Barrières de 3,5 mètres', 'U', 0, 0),
            ('d712a245-2786-4696-8788-96c9a705eb0b', 'Obstacles', 'Existent avec un voile d’occultation', 'U', 0, 0),
            ('c464a420-df26-478d-bdb8-e3c9301afab9', 'Engins de blocage', 'Engins routiers et matériels, ensembles mobiles pour permettre le passage des secours, utilisés pour bloquer les rues. Les longueurs peuvent être de 8m / 9,35m / 9,5m / 11m / 16m', 'U', 0, 0)
            `
          );

          console.log("Équipements insérés !");
        } else {
          console.log("Équipements déjà présents.");
        }
      }}
    >
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Events" component={EventListScreen} />
          <Stack.Screen name="AddEvent" component={CreateEventScreen} />
          <Stack.Screen name="Event" component={EventScreen} />
          <Stack.Screen name="AddPoint" component={CreatePointScreen} />
          <Stack.Screen name="AddPhoto" component={PointPhotosScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}

/*
  <Stack.Screen name="Points" component={PointsScreen} />
  <Stack.Screen name="PointDetails" component={PointDetailsScreen} />
  <Stack.Screen name="SimulateScreen" component={SimulateScreen} />
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
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
});
