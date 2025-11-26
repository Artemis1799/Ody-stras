import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { CreateEventScreen } from "./src/screens/addEvent";
import { EventListScreen } from "./src/screens/eventList";
import { CreatePointScreen } from "./src/screens/createPoint";
import { PointPhotosScreen } from "./src/screens/pointPhotos";
import { MapScreen } from "./src/screens/map";
import SimulateScreen from "./src/screens/simulateScreen";

import PointsScreen from "./src/screens/points";
import EventScreen from "./src/screens/Event";

import { setupDatabase } from "./database/database";
import { SQLiteProvider } from "expo-sqlite";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import exportEventScreen from "./src/screens/exportEvent";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SQLiteProvider
      databaseName="base.db"
      assetSource={{ assetId: require("./data/base.db") }}
      onInit={async (db) => {
        console.log("Initialisation de la base…");
        await setupDatabase(db);
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
          <Stack.Screen name="Points" component={PointsScreen} />
          {/*<Stack.Screen name="SimulateScreen" component={SimulateScreen} />*/}
          <Stack.Screen name="ExportEvent" component={exportEventScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}

/*
  <Stack.Screen name="PointDetails" component={PointDetailsScreen} />
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
