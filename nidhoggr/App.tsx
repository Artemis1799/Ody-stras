import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { EventListScreen } from "./src/screens/eventList";
import { CreatePointScreen } from "./src/screens/createPoint";
import { PointPhotosScreen } from "./src/screens/pointPhotos";
import { MapScreen } from "./src/screens/map";
import WelcomeScreen from "./src/screens/HomeScreen";
import SimulateScreen from "./src/screens/simulateScreen";
import PointsScreen from "./src/screens/points";
import EventScreen from "./src/screens/Event";

import { setupDatabase, deleteDatabase } from "./database/database";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import exportEventScreen from "./src/screens/exportEvent";
import ImportEventScreen from "./src/screens/importEvent";
import { ThemeProvider, useTheme } from "./src/utils/ThemeContext";
import React, { useEffect, useState } from "react";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

const Stack = createNativeStackNavigator();

// New component to handle initial navigation based on settings
function AppContent() {
  const { isLoading, skipVideo } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading) {
      // If skipVideo is true, navigate directly to Events screen
      if (skipVideo) {
        // Use navigation.reset to make 'Events' the new root of the navigation stack
        // This prevents going back to the WelcomeScreen
        navigation.reset({
          index: 0,
          routes: [{ name: "Events" as never }], // Type assertion for navigation compatibility
        });
      }
      // If skipVideo is false, 'Home' (WelcomeScreen) will be rendered by default
    }
  }, [isLoading, skipVideo, navigation]);

  if (isLoading) {
    return null; // Or a splash screen/loading indicator
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={skipVideo ? "Events" : "Home"}
    >
      <Stack.Screen name="Home" component={WelcomeScreen} />
      <Stack.Screen
        name="Events"
        component={EventListScreen}
        options={{ animation: "fade" }}
      />
      <Stack.Screen name="Event" component={EventScreen} />
      <Stack.Screen name="AddPoint" component={CreatePointScreen} />
      <Stack.Screen name="AddPhoto" component={PointPhotosScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Points" component={PointsScreen} />
      {/*<Stack.Screen name="SimulateScreen" component={SimulateScreen} />*/}
      <Stack.Screen name="ExportEvent" component={exportEventScreen} />
      <Stack.Screen name="ImportEvent" component={ImportEventScreen} />
    </Stack.Navigator>
  );
}
//      <Stack.Screen name="AddEvent" component={CreateEventScreen} />

export default function App() {
  const [isAudioReady, setIsAudioReady] = useState(false);

  useEffect(() => {
    async function configureAudio() {
      try {
        // Configure Audio to mix with others
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.warn("Audio config error:", e);
      } finally {
        setIsAudioReady(true);
      }
    }
    configureAudio();
  }, []);

  if (!isAudioReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <SQLiteProvider
        databaseName="base.db"
        //assetSource={{ assetId: require("./data/base.db") }}
        onInit={async (db) => {
          console.log("Initialisation de la base…");
          //await deleteDatabase(db);
          await setupDatabase(db);
        }}
      >
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </SQLiteProvider>
    </ThemeProvider>
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
