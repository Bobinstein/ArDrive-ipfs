import Arweave from "arweave";
import fs from "fs";
import path from "path";

const arweave = Arweave.init({ host: "arweave.net", port: 80, protocol: "http" });

async function downloadFile(transactionId, filePath) {
  try {
    const uint8ArrayData = await arweave.transactions.getData(transactionId, { decode: true });
    const bufferData = Buffer.from(uint8ArrayData);
    fs.writeFileSync(filePath, bufferData);
    console.log(`File downloaded: ${filePath}`);
  } catch (error) {
    console.error(`Error downloading file: ${error}`);
  }
}

export default async function DownloadFiles(folderName, filesData) {
  // Ensure the directory exists, create it if not
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName, { recursive: true });
  }

  // Loop through the files and download each one
  for (const file of filesData) {
    // Download the JSON data for each file
    const jsonData = await arweave.transactions.getData(file.id, { decode: true, string: true });
    const fileData = JSON.parse(jsonData);

    // Use the "name" field in the JSON to name the file
    const fileName = fileData.name;

    // Get the file using the 'dataTxId' field in the JSON
    const dataTxId = fileData.dataTxId;

    const filePath = path.join(folderName, fileName);
    await downloadFile(dataTxId, filePath);
  }

  console.log("All files downloaded.");
}
