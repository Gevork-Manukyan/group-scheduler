import "server-only";

import { AppwriteException, ID, Query } from "node-appwrite";

import { createAdminTables } from "@/lib/appwrite";
import {
  HttpError,
  buildGroupSnapshot,
  validateGroupInput,
  validateResponseInput,
} from "@/lib/scheduler";

async function getGroupRow(groupId) {
  const { config, tables } = createAdminTables();

  try {
    return await tables.getRow({
      databaseId: config.databaseId,
      tableId: config.groupsTableId,
      rowId: groupId,
    });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return null;
    }

    throw error;
  }
}

async function listResponsesForGroup(groupId) {
  const { config, tables } = createAdminTables();
  const responseList = await tables.listRows({
    databaseId: config.databaseId,
    tableId: config.responsesTableId,
    queries: [Query.equal("groupId", groupId), Query.limit(200)],
  });

  return responseList.rows;
}

export async function createGroup(input) {
  const { config, tables } = createAdminTables();
  const groupData = validateGroupInput(input);
  const groupRow = await tables.createRow({
    databaseId: config.databaseId,
    tableId: config.groupsTableId,
    rowId: ID.unique(),
    data: groupData,
  });

  return buildGroupSnapshot(groupRow, []);
}

export async function getGroupSnapshot(groupId) {
  const groupRow = await getGroupRow(groupId);

  if (!groupRow) {
    return null;
  }

  const responses = await listResponsesForGroup(groupId);

  return buildGroupSnapshot(groupRow, responses);
}

async function getEditableResponseOrThrow(groupId, responseId, editToken) {
  const { config, tables } = createAdminTables();

  try {
    const responseRow = await tables.getRow({
      databaseId: config.databaseId,
      tableId: config.responsesTableId,
      rowId: responseId,
    });

    if (responseRow.groupId !== groupId || responseRow.editToken !== editToken) {
      throw new HttpError("This saved response can no longer be edited.", 403);
    }

    return responseRow;
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      throw new HttpError("This saved response can no longer be edited.", 403);
    }

    throw error;
  }
}

export async function saveGroupResponse(groupId, input) {
  const { config, tables } = createAdminTables();
  const groupRow = await getGroupRow(groupId);

  if (!groupRow) {
    throw new HttpError("Group not found.", 404);
  }

  const responseData = validateResponseInput(input, groupRow.dates);

  if (responseData.responseId || responseData.editToken) {
    if (!responseData.responseId || !responseData.editToken) {
      throw new HttpError("A saved response is missing edit credentials.", 400);
    }

    await getEditableResponseOrThrow(
      groupId,
      responseData.responseId,
      responseData.editToken,
    );

    await tables.updateRow({
      databaseId: config.databaseId,
      tableId: config.responsesTableId,
      rowId: responseData.responseId,
      data: {
        name: responseData.name,
        availableDates: responseData.availableDates,
      },
    });

    return {
      editor: {
        responseId: responseData.responseId,
        editToken: responseData.editToken,
      },
      group: await getGroupSnapshot(groupId),
    };
  }

  const editToken = crypto.randomUUID();
  const responseRow = await tables.createRow({
    databaseId: config.databaseId,
    tableId: config.responsesTableId,
    rowId: ID.unique(),
    data: {
      groupId,
      name: responseData.name,
      availableDates: responseData.availableDates,
      editToken,
    },
  });

  return {
    editor: {
      responseId: responseRow.$id,
      editToken,
    },
    group: await getGroupSnapshot(groupId),
  };
}
