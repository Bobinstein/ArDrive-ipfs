import { config } from "dotenv";
import HashFolder from "./HashFolder.js";
import {
  readJWKFile,
  wrapFileOrFolder,
  arDriveFactory,
} from "ardrive-core-js";
import checkForFolder from "./CheckForFolder.js";
import CheckForDrive from "./CheckForDrive.js";
import { basename, dirname } from 'path';

config();

// Read wallet from file
const myWallet = readJWKFile("./keyFile.json");
const driveName = process.env.driveName;
// Construct ArDrive class
const arDrive = arDriveFactory({ wallet: myWallet });
// console.log(arDrive.wallet)

const address = await myWallet.getAddress();
const walletAddress = address.address;



function getFolderName(filePath) {
  return basename(dirname(filePath));
}



export default async function UploadFolder(folderPath) {
  try {
    // gets folder name from path
    const folderName = getFolderName(folderPath)

    // Upload folder to IPFS and get the IPFS hash
    const ipfsHash = await HashFolder(folderPath, folderName);

    // Check if a public drive exists with the same name as the one set in .env
    const ipfsDrive = await CheckForDrive(walletAddress, driveName);


    // If the drive does not exist, create it
    if (ipfsDrive === null) {
      console.log("creating Drive. Wait 3-5 minutes before running again to ensure it propogates on the network.");
      const createDriveResult = await arDrive.createPublicDrive({
        driveName: "ipfsContent",
      });
      // aborts the process and returns the result of creating the drive.
      return createDriveResult
    } else {
      // Check if a subfolder with the passed in folderName exists in the drive
      const folders = await checkForFolder(walletAddress, ipfsDrive);

      if (folders.includes(folderName)) {
        // Folder already exists
        console.log(`This folder already exists. Aborting process`);
        return null;
      } else {
        try {
          // bundles the folder for a single upload
          const wrappedFolder = wrapFileOrFolder(
            folderPath,
            "application/json",
            {
              // Sets the ipfs hash as custom metadata and JSON tags for easy searching
              metaDataJson: { ["ipfsHash"]: ipfsHash },
              metaDataGqlTags: {
                ["ipfsHash"]: ipfsHash,
              },
            }
          );
          // console.log(`wrapped folder content:`)
          console.log(wrappedFolder);
          // Upload to Ardrive
          const results = await arDrive.uploadAllEntities({
            entitiesToUpload: [
              {
                wrappedEntity: wrappedFolder,
                destFolderId: ipfsDrive.rootFolderId,
              },
            ],
          });
          console.log(
            `Folder uploaded to Arweave with transaction ID: ${results}`
          );
          console.log(`Fees paid: ${JSON.stringify(results.fees)}`)

          return results;
        } catch (error) {
          console.log(`Error: ${error}`);
        }
      }
    }
  } catch (error) {
    console.log(`Error while uploading folder to Arweave: ${error}`);
  }
}
