import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'; // Importar el icono de Font Awesome

import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../firebase-config';
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
} from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImageViewer from 'react-native-image-zoom-viewer';
import { getStorage, ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker'; // Importamos ImagePicker

const ReportDetailsPage = () => {
  const [commentImageModalVisible, setCommentImageModalVisible] = useState(false);
const toggleCommentImageModal = (imageUri) => {
  setSelectedCommentImage(imageUri); // Establece la URI de la imagen seleccionada
  setCommentImageModalVisible(!commentImageModalVisible); // Muestra u oculta el Modal
};
const clearSelectedImage = () => {
  setSelectedImage(null);
};
const storage = getStorage();
  const navigation = useNavigation();
  const route = useRoute();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Nuevo estado para el indicador de carga
  const [commentError, setCommentError] = useState(false);
  const [report, setReport] = useState(route.params.report);
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
      console.log('La selección de imagen fue cancelada.');
    }
  } catch (error) {
    console.error('Error al seleccionar imagen:', error);
    Alert.alert('Error', 'No se pudo seleccionar la imagen.');
  }
};
const handleCommentSubmit = async () => {
  // Verificar si se ha seleccionado una imagen
  if (selectedImage) {
    setIsSubmitting(true);
    try {
      // Subir la imagen al almacenamiento de Firebase si hay una imagen seleccionada
      let imageUrl = ''; // Variable para almacenar la URL de la imagen en el almacenamiento de Firebase
      if (selectedImage) {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const storageRef = ref(storage, `images/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }
      // Agregar el comentario y la imagen a la base de datos
      const userType = 'Usuario';
      const newComment = {
        id: Date.now(), // Asignar un ID único al comentario
        comment: comment.trim(), // Utilizar el comentario trim() para eliminar espacios en blanco
        userType: userType,
        createdAt: new Date(),
        createdAtString: new Date().toLocaleString(),
        image: imageUrl, // Agregar la URI de la imagen seleccionada al comentario
      };
      // Agregar el nuevo comentario al final de la lista usando concat()
      setComments(prevComments => prevComments.concat(newComment)); // Agregar el nuevo comentario a la lista
      // Limpiar el campo de comentario y reiniciar el estado de error
      setComment('');
      setCommentError(false);
      // Agregar el comentario y la imagen a la base de datos
      await addDoc(collection(db, "comments"), {
        folio: report.folio,
        comment: comment.trim(), // Utilizar el comentario trim() para eliminar espacios en blanco
        userType: userType,
        createdAt: serverTimestamp(),
        image: imageUrl, // Agregar la URI de la imagen seleccionada al comentario en la base de datos
      });
      // Limpiar la imagen seleccionada después de enviar el comentario
      setSelectedImage(null);
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setIsSubmitting(false); // Establecer el estado de carga después de enviar el comentario y la imagen
    }
  } else {
    // Si no se ha seleccionado una imagen, simplemente enviar el comentario sin imagen
    try {
      // Verificar si se ha ingresado un comentario
      if (comment.trim() === '') {
        // Si no se ha ingresado un comentario, salir de la función sin hacer nada
        return;
      }
      // Agregar el comentario a la base de datos
      const userType = 'Usuario';
      const newComment = {
        id: Date.now(), // Asignar un ID único al comentario
        comment: comment.trim(), // Utilizar el comentario trim() para eliminar espacios en blanco
        userType: userType,
        createdAt: new Date(),
        createdAtString: new Date().toLocaleString(),
      };
      // Agregar el nuevo comentario al final de la lista usando concat()
      setComments(prevComments => prevComments.concat(newComment)); // Agregar el nuevo comentario a la lista
      // Limpiar el campo de comentario y reiniciar el estado de error
      setComment('');
      setCommentError(false);
      // Agregar el comentario a la base de datos
      await addDoc(collection(db, "comments"), {
        folio: report.folio,
        comment: comment.trim(), // Utilizar el comentario trim() para eliminar espacios en blanco
        userType: userType,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setIsSubmitting(false); // Establecer el estado de carga después de enviar el comentario
    }
  }
};
  
    useEffect(() => {
      // Suscripción para escuchar los cambios en los comentarios
      const unsubscribeComments = onSnapshot(
        query(collection(db, "comments"), where("folio", "==", report.folio)),
        (snapshot) => {
          const loadedComments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAtString: doc.data().createdAt?.toDate().toLocaleString(),
          })).sort((a, b) => a.createdAt - b.createdAt); // Asegúrate de que el orden es el inverso si quieres los más recientes primero
          setComments(loadedComments);
        },
        (error) => {
          console.error("Error getting documents: ", error);
        }
      );
    
      // Suscripción para escuchar los cambios en el reporte
      const unsubscribeReport = onSnapshot(doc(db, "reports", report.id), (doc) => {
        const updatedReport = { id: doc.id, ...doc.data() };
        setReport(updatedReport); // Asumiendo que tienes un estado `report` y una función `setReport` para actualizarlo
      }, (error) => {
        console.error("Error getting document:", error);
      });
    
      // Limpiar ambas suscripciones cuando el componente se desmonte
      return () => {
        unsubscribeComments();
        unsubscribeReport();
      };
    }, [report.folio, report.id]);
    
    
  

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completado':
        return 'green'; // Verde
      case 'En Proceso':
        return 'orange'; // Naranja
      case 'Pendiente':
        return 'red'; // Rojo
      default:
        return '#FFFFFF'; // Blanco (por defecto)
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back_icon.png')} style={styles.backIcon} />
        </TouchableOpacity>
      </View>
      <Text style={styles.folioTitle}>Reporte No. {report.folio}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado del Reporte</Text>
        
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Estado:</Text>
          <Text style={styles.formValue}>{report.status}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(report.status) }]} />
        </View>
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
            <Image source={{ uri: report.imagen }} style={{ width: 200, height: 200 }} />
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
      {
  report.technical && (
    <View style={styles.technicianSection}>
      <Text style={styles.sectionTitle}>Técnico Asignado</Text>
      <Text>Email del Técnico: {report.technical}</Text>
    </View>
  )
      }
      <View style={styles.commentSection}>
      <Text style={styles.sectionTitle}>Comentarios</Text>

      
      {comments.map((commentObj, index) => (
  <View key={index} style={commentObj.userType === 'Usuario' ? styles.commentBubbleRight : styles.commentBubble}>
    <Text style={styles.commentTitle}>{commentObj.userType || 'Usuario'} dice:</Text>
    <Text style={styles.commentText}>{commentObj.comment}</Text>
    {commentObj.image && (
      <TouchableOpacity onPress={() => toggleCommentImageModal(commentObj.image)}>
  <Image source={{ uri: commentObj.image }} style={{ width: 200, height: 200 }} />
</TouchableOpacity>

    )}
    <Modal visible={commentImageModalVisible} transparent={true}>
  <ImageViewer
    imageUrls={[{ url: selectedCommentImage }]} // Pasa la URI de la imagen seleccionada al componente ImageViewer
    onSwipeDown={() => setCommentImageModalVisible(false)}
    enableSwipeDown={true}
  />
</Modal>
    <Text style={styles.commentTimestamp}>{commentObj.createdAtString}</Text>
  </View>
))}{selectedImage && (
          <View style={styles.selectedImageContainer}>
            
            <TouchableOpacity style={styles.deleteImageButton} onPress={clearSelectedImage}>
    <Icon name="close" size={24} color="#FF0000" alignSelf="flex-end"/>
    <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
  </TouchableOpacity>
          </View>
          
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <TextInput
    style={[styles.commentInput, commentError ? styles.errorInput : null]}
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
        {isSubmitting && (
          <ActivityIndicator size="large" color="#154F3A" />
        )}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#154F3A',
  },
  section: {
    marginBottom: 10,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#154F3A',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  formLabel: {
    flex: 1,
    fontWeight: 'bold',
    color: '#154F3A',
  },
  formValue: {
    flex: 2,
    color: '#333333',
  },
  commentSection: {
    marginTop: 10,
  },
  commentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#154F3A',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: 370,
  },
  commentText: {
     color: '#000000',
    },
  commentTimestamp: {
      fontSize: 12,
      color: '#154F3A',
      marginTop: 5,
      textAlign: 'right', // Alinea la fecha/hora a la derecha
    },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: '#154F3A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#154F3A',
  },
  errorInput: {
    borderColor: 'red',
  },
  commentBubble: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0', // Un ligero fondo diferente para destacar
    alignSelf: 'flex-start', // Alinea a la izquierda
    width: '50%', // Ancho fijo para las burbujas de comentarios
  },

  commentBubbleRight: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff', // Un ligero fondo diferente para destacar
    alignSelf: 'flex-end', // Alinea a la derecha
    width: '50%', // Ancho fijo para las burbujas de comentarios
  },
  technicianSection: {
    marginVertical: 10,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
  },
  selectedImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  selectedImage: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  sendImageButton: {
    backgroundColor: '#154F3A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flexDirection: 'row', // Alinear elementos horizontalmente
    alignItems: 'center', // Centrar elementos verticalmente
    justifyContent: 'center', // Centrar elementos horizontalmente
    marginTop: 10,
  },
  cameraButton: {
    width: 50,
    height: 50,
    marginBottom:10,
    marginLeft:10,
    backgroundColor: '#154F3A',
    paddingVertical: 8, // Ajusta el padding vertical para hacer el botón más pequeño
    paddingHorizontal: 15, // Ajusta el padding horizontal para hacer el botón más pequeño
    borderRadius: 5,
    flexDirection: 'row', // Alinear elementos horizontalmente
    alignItems: 'center', // Centrar elementos verticalmente
    justifyContent: 'center', // Centrar elementos horizontalmente
    
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default ReportDetailsPage;
