import "server-only";

import { Client, TablesDB } from "node-appwrite";

function getEnvValue(name, fallbackName) {
  return process.env[name] || (fallbackName ? process.env[fallbackName] : "");
}

function requireEnv(name, fallbackName) {
  const value = getEnvValue(name, fallbackName);

  if (!value) {
    const fallbackLabel = fallbackName ? ` or ${fallbackName}` : "";
    throw new Error(`Missing environment variable: ${name}${fallbackLabel}`);
  }

  return value;
}

export function getAppwriteConfig() {
  return {
    endpoint: requireEnv("APPWRITE_ENDPOINT", "NEXT_PUBLIC_APPWRITE_ENDPOINT"),
    projectId: requireEnv(
      "APPWRITE_PROJECT_ID",
      "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    ),
    apiKey: requireEnv("APPWRITE_API_KEY"),
    databaseId: requireEnv("APPWRITE_DATABASE_ID"),
    groupsTableId: requireEnv("APPWRITE_GROUPS_TABLE_ID"),
    responsesTableId: requireEnv("APPWRITE_RESPONSES_TABLE_ID"),
  };
}

export function createAdminTables() {
  const config = getAppwriteConfig();
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  return {
    config,
    tables: new TablesDB(client),
  };
}
