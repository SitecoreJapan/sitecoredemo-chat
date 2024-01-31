import { GetResutlsByQUery } from "@/interfaces/search";
import { ChatCompletionCreateParams } from "openai/resources/chat";

export async function runFunction(name: string, args: any) {
  switch (name) {
    case "knowledge_search":
      return {
        systemPrompt: `You are an intelligent assistant that helps users find the answer to their question, 
        the response from the function is the contextual knowledge that you have, 
        use it to answer the user's enquiry
        Your answer should be in JSON format and should be in the following format
        {
          type: "knowledge_search",
          answer: "The answer to the user's question",
        }`,
        content: await knowledge_search(args["query"]),
      };
    case "get_top_stories":
      return {
        systemPrompt: `You are an intelligent assistant that helps get a the top stories from the news, 
        the response from the function is the top stories
        present it to the user
        {
          type: "top_stories",
          data: [
            {
              Title: "The Title of the story",
              image: "The image of the story if it exists",
              url: "The url of the story",
            }
          ]
        }`,
        content: await get_top_stories(),
      };
    case "get_story":
      return {
        systemPrompt: `You are an intelligent assistant that helps get a specific story from the news, 
            the response from the function is the story
            present it to the user
            Your answer should be in JSON format and should be in the following format
            {
              type: "story",
              summary: "The summary of the story",
            }`,
        content: await get_story(args["id"]),
      };
    default:
      return null;
  }
}

export const functions: ChatCompletionCreateParams.Function[] = [
  {
    name: "knowledge_search",
    description:
      "This is an excellent tool for users looking for any information. The plugin provides high-quality and up to date information from the knowledge base. The user can write an enquiry or question and the plugin will retrieve the answer by searching through the latest version of the knowledgebase. ALWAYS use for any questions the user asks",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "the query to search for",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_top_stories",
    description:
      "Get the top stories from News. Also returns the News URL to each story.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "The number of stories to return. Defaults to 10.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_story",
    description:
      "Get a story from News. Also returns the News URL to the story.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The ID of the story",
        },
      },
      required: ["id"],
    },
  },
];

async function get_top_stories(limit: number = 10) {
  const response = await fetch(
    "https://hacker-news.firebaseio.com/v0/topstories.json"
  );
  const ids = await response.json();
  const stories = await Promise.all(
    ids.slice(0, limit).map((id: number) => get_story(id))
  );

  return stories;
}

async function get_story(id: number) {
  const response = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
  );
  const data = await response.json();
  return {
    ...data,
    hnUrl: `https://news.ycombinator.com/item?id=${id}`,
  };
}

export async function knowledge_search(query: string) {
  console.log("query", query);
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = GetResutlsByQUery(query);

  const response = await fetch(process.env.NEXT_PUBLIC_SEARCH_DISCOVER || "", {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  });

  const responseJson = await response.json();

  const data = responseJson.widgets[0].content;
  return data;
}
