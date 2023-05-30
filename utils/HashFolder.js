import { config } from "dotenv";
import pinataSDK from "@pinata/sdk";
import { NFTStorage, File } from "nft.storage";
import { basename, dirname } from "path";
import fs from "fs";
import path from "path";

config();

const pinataApiKey = process.env.PinataAPIKey;
const pinataApiSecret = process.env.PinataAPISecret;
const nftAPIToken = process.env.nftAPIToken;
const ipfsProvider = process.env.ipfsProvider;

const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);
const client = new NFTStorage({ token: nftAPIToken });

function getFolderName(filePath) {
  return basename(dirname(filePath));
}

async function pinFolderToNFTStorage(folderPath) {
  const dir = await fs.promises.opendir(folderPath);
  const files = [];
  for await (const dirent of dir) {
    if (dirent.isFile()) {
      files.push(new File([fs.readFileSync(path.join(folderPath, dirent.name))], dirent.name));
    }
  }
  const cid = await client.storeDirectory(files);
  return cid;
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
    let result;
    switch(ipfsProvider) {
      case "Pinata":
        // Sends folder to Pinata for hashing
        result = await pinata.pinFromFS(folderPath, options);
        console.log(result);
        return result.IpfsHash;
      case "nftStorage":
        // Sends folder to NFT.Storage for hashing
        result = await pinFolderToNFTStorage(folderPath);
        console.log(result);
        return result;
      default:
        console.log("Invalid IPFS provider specified.");
        return null;
    }
  } catch (error) {
    console.log(`Error while pinning folder to IPFS: ${error}`);
  }
}
