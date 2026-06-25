export interface RoadmapItem {
    title: string;
    body: string;
    status: string; // "Todo", "In Progress", "Done"
}

export async function fetchRoadmapData(): Promise<RoadmapItem[] | null> {
    const token = process.env.GITHUB_PAT;
    if (!token) {
        console.warn("[GITHUB] GITHUB_PAT is not set. Falling back to static data.");
        return null;
    }

    const query = `
    query {
      organization(login: "crediblemark-official") {
        projectV2(number: 1) {
          title
          items(first: 100) {
            nodes {
              content {
                ... on DraftIssue {
                  title
                  body
                }
                ... on Issue {
                  title
                  body
                }
              }
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

    try {
        const response = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                "Authorization": `bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        const json = await response.json();
        
        if (json.errors) {
            console.error("[GITHUB] GraphQL Errors:", json.errors);
            return null;
        }

        const nodes = json.data?.organization?.projectV2?.items?.nodes || [];
        
        const items: RoadmapItem[] = nodes.map((node: any) => {
            let status = "Todo";
            // Find the Status field value
            const fieldValues = node.fieldValues?.nodes || [];
            for (const fv of fieldValues) {
                if (fv.field?.name === "Status" && fv.name) {
                    status = fv.name;
                    break;
                }
            }

            return {
                title: node.content?.title || "Untitled",
                body: node.content?.body || "",
                status
            };
        });

        return items;
    } catch (error) {
        console.error("[GITHUB] Error fetching project data:", error);
        return null;
    }
}
