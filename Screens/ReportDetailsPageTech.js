import React, { useState, useEffect } from "react";
import {
  Modal,
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import { useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../firebase-config";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import ImageViewer from "react-native-image-zoom-viewer";
import {
  getStorage,
  ref,
  deleteObject,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import * as ImagePicker from "expo-image-picker";

const ReportDetailsPageTech = () => {
  const clearSelectedImage = () => {
    setSelectedImage(null);
  };
  const [commentImageModalVisible, setCommentImageModalVisible] =
    useState(false);
  const toggleCommentImageModal = (imageUri) => {
    setSelectedCommentImage(imageUri);
    setCommentImageModalVisible(!commentImageModalVisible);
  };
  const storage = getStorage();
  const navigation = useNavigation();
  const route = useRoute();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState(false);
  const [report, setReport] = useState(route.params.report);
  const [reportState, setReportState] = useState(report);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCommentImage, setSelectedCommentImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.cancelled) {
        setSelectedImage(result.assets[0].uri);
      } else {
        console.log("La selección de imagen fue cancelada.");
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };
  useEffect(() => {
    const unsubscribeComments = onSnapshot(
      query(collection(db, "comments"), where("folio", "==", report.folio)),
      (snapshot) => {
        const loadedComments = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAtString: doc.data().createdAt?.toDate().toLocaleString(),
          }))
          .sort((a, b) => a.createdAt - b.createdAt);
        setComments(loadedComments);
      },
      (error) => {
        console.error("Error al obtener el documento: ", error);
      }
    );

    const unsubscribeReport = onSnapshot(
      doc(db, "reports", report.id),
      (doc) => {
        const updatedReport = { id: doc.id, ...doc.data() };
        setReport(updatedReport);
        setReportState(updatedReport);
      },
      (error) => {
        console.error("Error al obtener el documento: ", error);
      }
    );
    return () => {
      unsubscribeComments();
      unsubscribeReport();
    };
  }, [report.folio, report.id]);
  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
  };

  const confirmStatusChange = async () => {
    if (selectedStatus !== "") {
      try {
        const reportRef = doc(db, "reports", reportState.id);
        let notificationStatus = false;
        if (selectedStatus === "Completado") {
          notificationStatus = true;
          const currentDate = new Date();
          const date = currentDate.toLocaleDateString("es-MX");
          const time = currentDate.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          });
          await updateDoc(reportRef, {
            status: selectedStatus,
            notificationStatus: notificationStatus,
            dateFinish: date,
            timeFinish: time,
          });
        } else {
          await updateDoc(reportRef, {
            status: selectedStatus,
            notificationStatus: notificationStatus,
          });
        }
        setReportState((prevState) => ({
          ...prevState,
          status: selectedStatus,
        }));
        setSelectedStatus("");
      } catch (error) {
        console.error("Error al actualizar el estado del reporte: ", error);
      }
    }
  };

  const handleCommentSubmit = async () => {
    if (selectedImage) {
      setIsSubmitting(true);
      try {
        let imageUrl = "";
        if (selectedImage) {
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          const storageRef = ref(storage, `images/${Date.now()}.jpg`);
          await uploadBytes(storageRef, blob);
          imageUrl = await getDownloadURL(storageRef);
        }
        const userType = "Administrador";
        const newComment = {
          id: Date.now(),
          comment: comment.trim(),
          userType: userType,
          createdAt: new Date(),
          createdAtString: new Date().toLocaleString(),
          image: imageUrl,
        };
        setComments((prevComments) => prevComments.concat(newComment));
        setComment("");
        setCommentError(false);
        await addDoc(collection(db, "comments"), {
          folio: report.folio,
          comment: comment.trim(),
          userType: userType,
          createdAt: serverTimestamp(),
          image: imageUrl,
        });
        setSelectedImage(null);
      } catch (error) {
        console.error("Error al gregar el documento: ", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        if (comment.trim() === "") {
          return;
        }
        const userType = "Administrador";
        const newComment = {
          id: Date.now(),
          comment: comment.trim(),
          userType: userType,
          createdAt: new Date(),
          createdAtString: new Date().toLocaleString(),
        };
        setComments((prevComments) => prevComments.concat(newComment));
        setComment("");
        setCommentError(false);
        await addDoc(collection(db, "comments"), {
          folio: report.folio,
          comment: comment.trim(),
          userType: userType,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error al agregar el documento: ", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  useEffect(() => {
    const unsubscribeComments = onSnapshot(
      query(collection(db, "comments"), where("folio", "==", report.folio)),
      (snapshot) => {
        const loadedComments = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAtString: doc.data().createdAt?.toDate().toLocaleString(),
          }))
          .sort((a, b) => a.createdAt - b.createdAt);
        setComments(loadedComments);
      },
      (error) => {
        console.error("Error al recuperar el documento: ", error);
      }
    );

    const unsubscribeReport = onSnapshot(
      doc(db, "reports", report.id),
      (doc) => {
        const updatedReport = { id: doc.id, ...doc.data() };
        setReport(updatedReport);
      },
      (error) => {
        console.error("Error al recuperar el documento: ", error);
      }
    );
    return () => {
      unsubscribeComments();
      unsubscribeReport();
    };
  }, [report.folio, report.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Completado":
        return "green";
      case "En Proceso":
        return "orange";
      case "Pendiente":
        return "red";
      default:
        return "#FFFFFF";
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require("../assets/back_icon.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.folioTitle}>Reporte No. {report.folio}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado del Reporte</Text>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Estado:</Text>
          <Picker
            selectedValue={
              selectedStatus !== "" ? selectedStatus : reportState.status
            }
            style={styles.picker}
            onValueChange={(itemValue) => handleStatusChange(itemValue)}
          >
            <Picker.Item label="Pendiente" value="Pendiente" />
            <Picker.Item label="En Proceso" value="En Proceso" />
            <Picker.Item label="Completado" value="Completado" />
          </Picker>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(reportState.status) },
            ]}
          />
        </View>
        {selectedStatus !== "" && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={confirmStatusChange}
          >
            <Text style={styles.buttonText}>Confirmar Cambio</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles del Reporte</Text>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Fecha:</Text>
          <Text style={styles.formValue}>{report.date}</Text>
        </View>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Hora:</Text>
          <Text style={styles.formValue}>{report.time}</Text>
        </View>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>No. Tarjeta:</Text>
          <Text style={styles.formValue}>{report.no_card}</Text>
        </View>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Área:</Text>
          <Text style={styles.formValue}>{report.area}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles del Equipo</Text>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Datos del Equipo:</Text>
          <Text style={styles.formValue}>{report.computerData}</Text>
        </View>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Servicio a Realizar:</Text>
          <Text style={styles.formValue}>{report.servicePerformed}</Text>
        </View>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Imagen:</Text>
          {report.imagen ? (
            <TouchableOpacity onPress={toggleModal}>
              <Image
                source={{ uri: report.imagen }}
                style={{ width: 200, height: 200 }}
              />
            </TouchableOpacity>
          ) : (
            <Text style={styles.formValue}>No hay imagen disponible</Text>
          )}
          <Modal visible={modalVisible} transparent={true}>
            <ImageViewer
              imageUrls={[{ url: report.imagen }]}
              onSwipeDown={() => setModalVisible(false)}
              enableSwipeDown={true}
            />
          </Modal>
        </View>
      </View>
      {report.technical && (
        <View style={styles.technicianSection}>
          <Text style={styles.sectionTitle}>Técnico Asignado</Text>
          <Text>Email del Técnico: {report.technical}</Text>
        </View>
      )}
      <View style={styles.commentSection}>
        <Text style={styles.sectionTitle}>Comentarios</Text>
        {comments.map((commentObj, index) => (
          <View
            key={index}
            style={
              commentObj.userType === "Técnico"
                ? styles.commentBubbleRight
                : styles.commentBubble
            }
          >
            <Text style={styles.commentTitle}>
              {commentObj.userType || "Usuario"} dice:
            </Text>
            <Text style={styles.commentText}>{commentObj.comment}</Text>
            {commentObj.image && (
              <TouchableOpacity
                onPress={() => toggleCommentImageModal(commentObj.image)}
              >
                <Image
                  source={{ uri: commentObj.image }}
                  style={{ width: 200, height: 200 }}
                />
              </TouchableOpacity>
            )}
            <Modal visible={commentImageModalVisible} transparent={true}>
              <ImageViewer
                imageUrls={[{ url: selectedCommentImage }]}
                onSwipeDown={() => setCommentImageModalVisible(false)}
                enableSwipeDown={true}
              />
            </Modal>
            <Text style={styles.commentTimestamp}>
              {commentObj.createdAtString}
            </Text>
          </View>
        ))}
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <TouchableOpacity
              style={styles.deleteImageButton}
              onPress={clearSelectedImage}
            >
              <Icon
                name="close"
                size={24}
                color="#FF0000"
                alignSelf="flex-end"
              />
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={[
              styles.commentInput,
              commentError ? styles.errorInput : null,
            ]}
            value={comment}
            onChangeText={(text) => {
              setComment(text);
              if (commentError) setCommentError(false);
            }}
            placeholder="Escribe un comentario..."
            multiline
          />
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <FontAwesomeIcon name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {isSubmitting && <ActivityIndicator size="large" color="#154F3A" />}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleCommentSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    marginTop: 20,
  },
  backButton: {
    zIndex: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  folioTitle: {
    marginTop: 20,
    fontSize: 35,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#154F3A",
  },
  section: {
    marginBottom: 10,
    borderColor: "#E5E5E5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#154F3A",
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  formLabel: {
    flex: 1,
    fontWeight: "bold",
    color: "#154F3A",
  },
  formValue: {
    flex: 2,
    color: "#333333",
  },
  commentSection: {
    marginTop: 10,
  },
  commentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#154F3A",
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: 370,
  },
  commentText: {
    color: "#000000",
  },
  commentTimestamp: {
    fontSize: 12,
    color: "#154F3A",
    marginTop: 5,
    textAlign: "right",
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: "#154F3A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#154F3A",
  },
  errorInput: {
    borderColor: "red",
  },
  commentBubble: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
    width: "50%",
  },
  commentBubbleRight: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    alignSelf: "flex-end",
    width: "50%",
  },
  technicianSection: {
    marginVertical: 10,
    borderColor: "#E5E5E5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
  },
  picker: {
    position: "absolute",
    height: 50,
    width: 150,
  },
  selectedImageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  selectedImage: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  sendImageButton: {
    backgroundColor: "#154F3A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  cameraButton: {
    width: 50,
    height: 50,
    marginBottom: 10,
    marginLeft: 10,
    backgroundColor: "#154F3A",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
  },
});
export default ReportDetailsPageTech;
