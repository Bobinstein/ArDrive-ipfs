import GetFolderFromHash from "./utils/GetFolderFromHash.js";
import FindFiles from "./utils/FindFiles.js";
import DownloadFiles from "./utils/DownloadFiles.js";
import HashFolder from "./utils/HashFolder.js";

export default async function DownloadAndHash(Hash, folderName) {
  // Gets a folder from your IPFS hash
  const FolderID = await GetFolderFromHash(Hash);

  // Finds all files in that folder
  const files = await FindFiles(FolderID.value);

  // Downloads the files
  await DownloadFiles(folderName, files);

  // Hashes into ipfs
  const newHash = await HashFolder(`./${folderName}/`, folderName);

  // Checks that hashes match
  if (newHash != Hash) {
    console.log("Something has gone wrong, the hashes do not match");
    return;
  } else {
    console.log(
      `${Hash} has successfully been added back to the ipfs network.`
    );
  }
}

