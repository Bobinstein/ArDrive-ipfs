import { config } from "dotenv";
import pinataSDK from "@pinata/sdk";
import { basename, dirname } from "path";

config();

const pinataApiKey = process.env.PinataAPIKey;
const pinataApiSecret = process.env.PinataAPISecret;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

function getFolderName(filePath) {
  return basename(dirname(filePath));
}

export default async function HashFolder(folderPath) {
  // Gets name of folder to be hashed from its path
  const folderName = getFolderName(folderPath);
  // Sets Pinata upload options
  const options = {
    pinataMetadata: {
      name: folderName,
    },
  };

  try {
    // Sends folder to Pinata for hashing
    const result = await pinata.pinFromFS(folderPath, options);
    console.log(result);
    return result.IpfsHash;
  } catch (error) {
    console.log(`Error while pinning folder to IPFS: ${error}`);
  }
}
