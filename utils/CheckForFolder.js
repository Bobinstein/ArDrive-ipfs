import Arweave from "arweave";
// Override non-fatal errors with queries
console.error = function () {};

// Initialize an Arweave instance
const arweave = Arweave.init({
  host: "arweave.net", // Hostname or IP address for a Arweave host
  port: 80, // Port
  protocol: "http", // Network protocol http or https
});
export default async function checkForFolder(walletAddress, driveData) {
  // Create a GraphQL query to check if a public folder exists for a given public wallet address and drive
  const queryObject = {
    query: `
        {
          transactions(
            first: 100,
            owners: ["${walletAddress}"],
            tags: [
              {
                name: "Entity-Type",
                values: ["folder"]
              },
              {
                name: "Parent-Folder-Id",
                values: ["${driveData.rootFolderId}"]
              }
            ]
          ) 
          {
            edges {
              node {
                id
                owner {
                  address
                }
                tags {
                  name
                  value
                }
              }
            }
          }
        }`,
  };

  // Post the GraphQL query to the Arweave network
  const result = await arweave.api.post("/graphql", queryObject);
  // Check if the public folder exists
  if (result.data.data.transactions.edges.length > 0) {
    // console.log(`Public folders exist in the root of the drive for the wallet address "${walletAddress}".`);

    // Create an array to store the folder names
    const folderNames = [];

    // Loop through the results
    for (const edge of result.data.data.transactions.edges) {
      // Get the transaction ID
      const transactionId = edge.node.id;

      // Retrieve the data of the transaction
      const response = await arweave.transactions.getData(transactionId, {
        decode: true,
        string: true,
      });
      // Parse the data as JSON
      const data = JSON.parse(response);

      // Push the name value from the JSON into the array
      folderNames.push(data.name);
    }

    // Return the array of folder names
    return folderNames;
  } else {
    console.log(
      `No public folders exist in the root of the drive for the wallet address "${walletAddress}".`
    );
    return [];
  }
}
