import Arweave from "arweave";
// Override non-fatal errors with queries
console.error = function() {};

// Initialize an Arweave instance
const arweave = Arweave.init({
  host: "arweave.net", // Hostname or IP address for a Arweave host
  port: 80, // Port
  protocol: "http", // Network protocol http or https
});

export default async function CheckForDrive(walletAddress, driveName) {
    // Create a GraphQL query to check if a public drive exists for a given public wallet address
    const queryObject = {
      query: `
        {
          transactions(
            first: 50,
            owners: ["${walletAddress}"],
            tags: [
              {
                name: "Entity-Type",
                values: ["drive"]
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
        }`
    };
  
    try {
      // Post the GraphQL query to the Arweave network
      const result = await arweave.api.post('/graphql', queryObject);
      // Check if the public drive exists
      if (result.data.data.transactions.edges.length > 0) {
        console.log(`Public drives exist for the wallet address "${walletAddress}".`);
    
        // Loop through the results
        for (const edge of result.data.data.transactions.edges) {
          // Get the transaction ID
          const transactionId = edge.node.id;
    
          try {
            // Retrieve the data of the transaction
            const response = await arweave.transactions.getData(transactionId, {decode: true, string: true});
            // Parse the data as JSON
            const data = JSON.parse(response);
    
            // Log the name value from the JSON
            console.log(`Name: ${data.name}`);
    
            // If the name value matches 'ipfsContent', return the entire contents of the JSON as 'driveData'
            if (data.name === driveName) {
              // console.log(`Drive Data: ${JSON.stringify(data, null, 2)}`);
              const driveData = data;
              return driveData;
            }
          } catch (error) {
            // Do nothing
          }
        }
      } else {
        console.log(`Public drive does not exist for the wallet address "${walletAddress}".`);
      }
    } catch (error) {
       console.log(`Error executing GraphQL query: ${error}`);
    }

    // If no matching drive data was found, return null
    return null;
}

// Use the function
// CheckForDrive('cF0H0SKdnaDTqWKY9iJKBktTpdEWgb3GnlndE7ABv0Q', 'Public').then(driveData => {
//   if (driveData) {
//     console.log(`drive found: ${driveData}`);
//   } else {
//     console.log('No matching drive data found.');
//   }
// });
