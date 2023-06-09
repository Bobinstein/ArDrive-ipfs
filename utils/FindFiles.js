import Arweave from "arweave";

const arweave = Arweave.init({
  host: "arweave.net",
  port: 80,
  protocol: "http",
});
// Sets the max number of tries a page of results will be attempted before aborting
const MAX_RETRIES = 10;

async function getFilesMetadataInFolder(folderId, cursor) {
  // Queries for pages of file info
  const query = {
    query: `query {
      transactions(
        first: 100,
        after: "${cursor}",
        sort: HEIGHT_DESC,
        tags: [
          { name: "Parent-Folder-Id", values: ["${folderId}"] },
          { name: "Entity-Type", values: ["file"] }
        ]
      ) {
        pageInfo {
          hasNextPage
        }
        edges {
          cursor
          node {
            id
            tags {
              name
              value
            }
          }
        }
      }
    }`,
  };
  const response = await arweave.api.post("/graphql", query);
  return response.data.data;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function FindFiles(folderId) {
  let cursor = "";
  let filesData = [];
  let retryCount = 0;

  while (true) {
    try {
      // Attempts to query Arweave for file information with pagination
      let result = await getFilesMetadataInFolder(folderId, cursor);
      if (result.transactions.edges.length === 0) {
        break;
      }

      // Push the required data for file download to the filesData array
      for (let edge of result.transactions.edges) {
        let id = edge.node.id;
        let nameTag = edge.node.tags.find((tag) => tag.name === "File-Name");
        let name = nameTag ? nameTag.value : id;
        filesData.push({ id, name });
      }

      // Gets cursor for pagination
      let lastEdge = result.transactions.edges.slice(-1)[0];
      cursor = lastEdge.cursor;

      // Reset the retry count after a successful query
      retryCount = 0;
    } catch (error) {
      // Adds to retry count to prevent an infinite error loop
      retryCount++;
      console.log(`Error in GraphQL query. Retry attempt: ${retryCount}`);
      if (retryCount > MAX_RETRIES) {
        throw new Error("Max retries exceeded. Aborting FindFiles process.");
      }

      // Wait 1 second before retrying after failed query
      await delay(1000);
    }
  }

  return filesData;
}
