import HashFolder from "./utils/HashFolder.js";
import UploadFolder from "./utils/UploadFolder.js";

export default async function HashAndUpload(folderPath) {
  // Hashes folder
  const ipfsHash = await HashFolder(folderPath);

  // Uploads Folder
  const UploadResults = await UploadFolder(folderPath, ipfsHash);
  console.log(UploadResults);
}
