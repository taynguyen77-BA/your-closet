import { uploadImage } from './repository';
export { getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage, getFirebaseStatus } from './config';
export const clothingImagesService = { upload: uploadImage };
