# ArDrive IPFS tool

## Overview

This tool is a created do demonstrate how to upload a folder to ArDrive using custom tags, as well as how to search for folders that exist on the Arweave network by using those custom tags.

This project uses the Pinata API and SDK for IPFS hashing and pinning, but it can easily be modified to use a different service.

This code is meant for demonstration purposes only, it is not intended for use in production.

## Getting Started

- Create an account with [Pinata](https://www.pinata.cloud/)

- Clone the repository or download the zip file and extract the files locally

- Open a terminal in the project root folder and install dependencies with `yarn install`

- Create a .env file in the root folder and fill it with following items:
    - PinataAPIKey=<Your Pinata API Key>
    - PinataAPISecret=<Your Pinata API Secret>
    - driveName=<A name for the ArFS drive you want to use for ipfs content. Defaults to 'ipfsContent'>

- Place an Arweave wallet Keyfile in the root folder of the project and name it 'keyFile.json'. This will be used to fund transactions and determine the owner of all files you upload. If you are new to Arweave, you can create a wallet and generate your key file [here](https://arweave.app/add)
    - IMPORTANT!! YOUR KEYFILE IS YOUR PRIVATE KEYS! DO NOT SHARE OR EXPOSE YOUR KEYFILE!!

## Usage

All of the utility functions in this project are combined into two primary functions to achieve the overarching goals. 

HashAndUpload.js hashes a folder into the ipfs network and then uploads the folder to the Arweave network using that ipfs hash as a custom searchable tag.

DownloadAndHash.js downloads a folder from the Arweave network and then hashes it back into the ipfs network. As long as no changes were made to the files since the initial upload, the ipfs hash will be the same, allowing you to re-pin the folder if it was lost from the ipfs network.

### HashAndUpload.js

HashAndUpload takes in a single argument, the relative filepath from your working directory (where you are when you call the function) to the folder you want to upload.

The function takes that and passes it into the function HashFolder:

HashFolder takes the filepath and uses it to get the name of the folder, and sets that as metadata for Pinata. It then uses Pinata to hash the folder into ipfs and pin the content to your account.

It then returns the ipfs hash to be used by the next function UploadFolder

UploadFolder takes two arguments, first the filepath to your content folder, HashAndUpload uses the same folder that was used for HashFolder. The second is the ipfs hash returned from HashFolder.

This function will again get the folder name from its path to be used later. It then checks to see if an ArFS drive exists in your wallet with the name set in your .env file. If no drive name is set, 'ipfsContent' will be used by default.

The check is conducted by making a GraphQL query to arweave.net for transactions where 'owners' matches the public address of your wallet, and the transaction includes a tag declaring "Entity-Type" to "drive". This will return a list of all ArFS drives created by your wallet. Only the first 100 results are currently returned, if you have more than 100 drives, this query should be edited to allow for pagination or more advanced query parameters to narrow the results.

If no results are found, null is returned

If multiple drives are found, they are looped through and the transaction is fetched from the Arweave network in order to get more information about each drive. Once a drive is found with a name that matches your driveName, and then returns that transaction data.

Back in the UploadFolder function, if the result it gets back from checking for the drive is null, it will then create a new public drive and abort the rest of the process. Wait a few minutes to make sure the new drive propogates through the network before attempting to run the function again.

Once drive information is obtained, that information is used to check for folders that exist inside that drive by making another GraphQL query for transactions that belong to you, have the 'Entity-Type' folder, and have the 'Parent-Folder-Id' tag that matches the 'rootFolderId' tag of your drive. Again, only the first 100 results are returned so you may need to modify this query to allow for pagination.

An array of all folder names in your drive are returned to the UploadFolder function.

Once a list of folders is found, they are looped through to see if one exists with the name of the folder you are currently trying to upload. If one already exists, the process is aborted. Consider renaming the folder you are trying to upload and starting over.

Once we have all of the drive information and know that there are no conflicting folders, your local folder is wrapped using the wrapFileOrFOlder method from the ArDrive core SDK. This bundles all of the files into an ArFS folder and sets custom metadata tags to include the ipfs hash from earlier. It is then uploaded to Arweave using the uploadAllEntities method, also from the ArDrive core SDK, to complete the process.

### DownloadAndHash.js

This function specifically targets folders that you have previously uploaded using this project, because it looks for the custom tags we set while uploading a folder.

The function takes in an ipfs hash, and the name for a folder you want created and files downloaded into. The ArFS folder containing your files is found by making a GraphQL query for transactions with the 'Entity-Type' 'folder' and the custom tag 'ipfsHash' equal to the passed in hash. There is no limit on results for this query, but there should only be 1 result. If there are more, something has gone wrong somewhere, or someone else has uploaded a folder with the same ipfs hash. The process is aborted in order to allow you to troubleshoot.

Assuming there is only one result, the Folder-Id is returned and is then used to find all of the files in that folder. This is done with another GraphQL query for transactions with 'Entity-Type' 'file' and the 'Parent-Folder-Id' matching the previously found folder id.

This query does implement pagination to allow for folders with a large number of files to be downloaded. Each page of the query will allow for 10 failures and retries before aborting the process. 

The file name is grabbed from the metadata of each file, and is passed into an array of objects along with its transactionID and returned to the main function.

That information is then passed into the DownloadFiles function, which gets each file from Arweave using the transactionID, and saves it to a folder with the folderName originally passed in. Each file is given the name pulled from the file's metadata when originally uploaded.

Once all of the files are downloaded, they are fed back into Pinata for an ipfs hash, and a check is made to make sure the new hash is identical to the one originally passed in.