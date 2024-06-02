const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.deleteUserByEmail = functions.https.onCall(async (data, context) => {
  // Verificar si el usuario que hace la llamada está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'La petición debe ser autenticada.');
  }

  const email = data.email;
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Es necesario proveer un correo electrónico para eliminar el usuario.');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(user.uid);
    return { success: true, message: `El usuario con el correo ${email} ha sido eliminado exitosamente.` };
  } catch (error) {
    console.log(error);
    throw new functions.https.HttpsError('internal', 'Ocurrió un error al intentar eliminar el usuario.');
  }
});
