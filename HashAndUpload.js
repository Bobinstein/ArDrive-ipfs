import HashFolder from "./utils/HashFolder.js";
import UploadFolder from "./utils/UploadFolder.js";


export default async function HashAndUpload(folderPath){

    // Hashes folder
    await HashFolder(folderPath)

    // Uploads Folder
    const UploadResults = await UploadFolder(folderPath)
    console.log(UploadResults)
}
