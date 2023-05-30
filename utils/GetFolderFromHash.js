import Arweave from "arweave";
// Override non-fatal errors with queries
console.error = function () {};

// Initialize an Arweave instance
const arweave = Arweave.init({
  host: "arweave.net", // Hostname or IP address for a Arweave host
  port: 80, // Port
  protocol: "http", // Network protocol http or https
});

export default async function GetFolderFromHash(ipfsHash) {
  // gql query for folder
  const query = {
    query: `
          query {
            transactions(
              tags: [
                { name: "Entity-Type", values: ["folder"] },
                { name: "ipfsHash", values: ["${ipfsHash}"] }
              ]
            ) {
              edges {
                node {
                  id
                  tags {
                    name
                    value
                  }
                }
              }
            }
          }
        `,
  };

  try {
    // post the query
    const result = await arweave.api.post("/graphql", query);
    const nodes = result.data.data.transactions.edges;

    if (nodes.length > 1) {
      console.log("There are multiple folders, This is Odd");
      return "error";
    } else if (nodes.length == 1) {
      // Filter down to the Folder-ID of your folder
      console.log(nodes[0]);
      const array = nodes[0].node.tags;
      const folderId = array.filter((tag) => tag.name === "Folder-Id");
      return folderId[0];
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}