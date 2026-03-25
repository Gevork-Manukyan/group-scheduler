# Group Scheduler

A small Next.js app for collecting date-specific availability from a group and showing which dates work for everyone.

## What it does

- Create a group with a name and either a date range or specific dates
- Share one link with the group
- Let each person submit a display name and mark which dates they are busy
- Switch between list and calendar layouts on the shared group page
- Show common dates and per-date availability counts
- Let the same browser update its response later without full authentication

## Tech

- Next.js App Router
- Appwrite for storage
- Next.js route handlers for all server-side Appwrite writes and reads

## Environment variables

Copy `.env.example` to `.env` and fill in the values.

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
APPWRITE_GROUPS_TABLE_ID=
APPWRITE_RESPONSES_TABLE_ID=
```

Notes:

- `NEXT_PUBLIC_APPWRITE_ENDPOINT` and `NEXT_PUBLIC_APPWRITE_PROJECT_ID` are reused on the server, so you do not need duplicate server versions unless you want them.
- `APPWRITE_API_KEY` must have database read/write access for the tables below.

## Appwrite setup

Create one database and two tables.

### 1. Groups table

Table ID: use the value you place in `APPWRITE_GROUPS_TABLE_ID`

Required columns:

- `name`: `varchar`, required, size 80
- `dates`: `varchar`, array enabled, size 10

### 2. Responses table

Table ID: use the value you place in `APPWRITE_RESPONSES_TABLE_ID`

Required columns:

- `groupId`: `varchar`, required, size 36
- `name`: `varchar`, required, size 50
- `availableDates`: `varchar`, array enabled, size 10
- `editToken`: `varchar`, required, size 36

Required index:

- Create a `key` index on `groupId`

Current Appwrite tables note:

- The Appwrite tables UI currently does not let array columns also be marked as `required`.
- For this app, that is okay. The server already validates that groups include at least one date and that submitted availability only contains valid dates from the group.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## How editing works

There is no user account system.

When someone submits availability, the app stores a response row in Appwrite and saves a small edit token in that browser's local storage. That same browser can later revisit the shared link and update its response.
