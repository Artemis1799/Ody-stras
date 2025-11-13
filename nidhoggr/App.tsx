import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="AddEvent" component={AddEventScreen} />
        <Stack.Screen name="Points" component={PointsScreen} />
        <Stack.Screen name="PointDetails" component={PointDetailsScreen} />
        <Stack.Screen name="SimulateScreen" component={SimulateScreen} />
        <Stack.Screen name="AddPoint" component={AddPointScreen} />
        <Stack.Screen name="AddPhoto" component={AddPhotoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
