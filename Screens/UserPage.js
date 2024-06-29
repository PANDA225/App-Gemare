import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Image,
  BackHandler,
} from "react-native";
import { FAB } from "react-native-paper";
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function UserPage({ navigation, route }) {
  const [state, setState] = useState({ open: false });
  const { area } = route.params;
  const { userName } = route.params;
  const onStateChange = ({ open }) => setState({ open });
  const { open } = state;
  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate("Login");
      })
      .catch((error) => {
        console.error("Error al cerrar sesión:", error);
        Alert.alert("Error", "No se pudo cerrar la sesión correctamente.");
      });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerText}>¡Bienvenido, {userName}!</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateReportPage")}
            style={styles.buttonWithLabel}
          >
            <Image
              source={require("../assets/create_report_icon.png")}
              style={[styles.buttonImage, { tintColor: "#154F3A" }]}
            />
            <Text style={styles.buttonLabel}>Crear Reporte</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ViewReportsPage", { area: area })
            }
            style={styles.buttonWithLabel}
          >
            <Image
              source={require("../assets/view_report_icon.png")}
              style={[styles.buttonImage, { tintColor: "#154F3A" }]}
            />
            <Text style={styles.buttonLabel}>Ver Reportes</Text>
          </TouchableOpacity>
        </View>
        <FAB.Group
          open={open}
          icon={open ? "close" : "plus"}
          color="#FFFFFF"
          backdropColor="#00000000"
          fabStyle={styles.fab}
          actions={[
            {
              icon: "logout",
              label: "Cerrar Sesión",
              onPress: handleSignOut,
              color: "#FFFFFF",
              style: { backgroundColor: "red" },
              labelStyle: styles.fabLabel,
            },
          ]}
          onStateChange={onStateChange}
          style={{ position: "absolute", right: 16, bottom: 16 }}
          theme={{
            colors: {
              accent: "#154F3A",
              primary: "#154F3A",
              backdrop: "transparent",
            },
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginTop: 35,
    backgroundColor: "#FFFFFF",
    padding: 10,
    paddingTop: 20,
  },
  headerText: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "#154F3A",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  fab: {
    backgroundColor: "#154F3A",
  },
  fabLabel: {
    fontWeight: "bold",
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
  },
  buttonContainer: {
    alignItems: "center",
  },
  buttonWithLabel: {
    width: 200,
    marginBottom: 30,
    alignItems: "center",
    borderColor: "#154F3A",
    borderWidth: 2,
    padding: 15,
    borderRadius: 30,
    alignContent: "center",
  },
  buttonImage: {
    width: 150,
    height: 150,
  },
  buttonLabel: {
    textAlign: "center",
    margin: 10,
    color: "#154F3A",
    fontSize: 20,
    fontWeight: "bold",
  },
});
