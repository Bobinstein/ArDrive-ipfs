import { config } from "dotenv";
import pinataSDK from "@pinata/sdk";
import { basename, dirname } from 'path';

config()

const pinataApiKey = process.env.PinataAPIKey;
const pinataApiSecret = process.env.PinataAPISecret;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

function getFolderName(filePath) {
  return basename(dirname(filePath));
}

export default async function HashFolder(folderPath) {

  const folderName = getFolderName(folderPath)
    const options = {
      pinataMetadata: {
        name: folderName,
      },
    };
    
    try {
      const result = await pinata.pinFromFS(folderPath, options);
      console.log(result);
      return result.IpfsHash;
    } catch (error) {
      console.log(`Error while pinning folder to IPFS: ${error}`);
    }
  }