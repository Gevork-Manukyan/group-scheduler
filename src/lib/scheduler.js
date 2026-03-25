const GROUP_NAME_LIMIT = 80;
const PARTICIPANT_NAME_LIMIT = 50;
export const MAX_GROUP_RANGE_DAYS = 60;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function isRealDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeDates(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const uniqueDates = new Set();

  for (const value of values) {
    const date = sanitizeText(value);

    if (!isRealDate(date)) {
      continue;
    }

    uniqueDates.add(date);
  }

  return [...uniqueDates].sort();
}

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateFromInput(value) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function shiftDateInputValue(value, days) {
  if (!isRealDate(value)) {
    return value;
  }

  const date = getDateFromInput(value);
  date.setDate(date.getDate() + days);

  return getLocalDateInputValue(date);
}

export function formatDateLabel(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function buildDateRange(startDate, endDate) {
  const normalizedStart = sanitizeText(startDate);
  const normalizedEnd = sanitizeText(endDate);

  if (!isRealDate(normalizedStart) || !isRealDate(normalizedEnd)) {
    throw new HttpError("Choose a valid start and end date.");
  }

  if (normalizedStart > normalizedEnd) {
    throw new HttpError("The end date must be on or after the start date.");
  }

  const dates = [];
  const cursor = getDateFromInput(normalizedStart);
  const lastDate = getDateFromInput(normalizedEnd);

  while (cursor <= lastDate) {
    dates.push(getLocalDateInputValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  if (dates.length > MAX_GROUP_RANGE_DAYS) {
    throw new HttpError(
      `Date ranges can include up to ${MAX_GROUP_RANGE_DAYS} days.`,
    );
  }

  return dates;
}

function validateDates(
  values,
  { allowEmpty = false, max = MAX_GROUP_RANGE_DAYS } = {},
) {
  if (!Array.isArray(values)) {
    throw new HttpError("Dates must be provided as a list.");
  }

  const rawValues = values.map((value) => sanitizeText(value)).filter(Boolean);
  const normalized = normalizeDates(rawValues);

  if (normalized.length !== rawValues.length) {
    throw new HttpError("One or more dates are missing or invalid.");
  }

  if (!allowEmpty && normalized.length === 0) {
    throw new HttpError("Add at least one date.");
  }

  if (normalized.length > max) {
    throw new HttpError(`You can include up to ${max} dates per group.`);
  }

  return normalized;
}

export function validateGroupInput(input) {
  const name = sanitizeText(input?.name);

  if (!name) {
    throw new HttpError("Enter a group name.");
  }

  if (name.length > GROUP_NAME_LIMIT) {
    throw new HttpError(
      `Group names must be ${GROUP_NAME_LIMIT} characters or less.`,
    );
  }

  if (input?.startDate || input?.endDate) {
    return {
      name,
      dates: buildDateRange(input?.startDate, input?.endDate),
    };
  }

  return {
    name,
    dates: validateDates(input?.dates),
  };
}

export function validateResponseInput(input, allowedDates) {
  const name = sanitizeText(input?.name);

  if (!name) {
    throw new HttpError("Enter your display name.");
  }

  if (name.length > PARTICIPANT_NAME_LIMIT) {
    throw new HttpError(
      `Display names must be ${PARTICIPANT_NAME_LIMIT} characters or less.`,
    );
  }

  let availableDates = [];

  if (Array.isArray(input?.busyDates)) {
    const busyDates = validateDates(input?.busyDates, {
      allowEmpty: true,
      max: allowedDates.length,
    });

    if (!busyDates.every((date) => allowedDates.includes(date))) {
      throw new HttpError("Busy dates must use dates from this group.");
    }

    availableDates = allowedDates.filter((date) => !busyDates.includes(date));
  } else {
    availableDates = validateDates(input?.availableDates || [], {
      allowEmpty: true,
      max: allowedDates.length,
    });

    if (!availableDates.every((date) => allowedDates.includes(date))) {
      throw new HttpError("Availability must use dates from this group.");
    }
  }

  return {
    name,
    availableDates,
    responseId: sanitizeText(input?.responseId),
    editToken: sanitizeText(input?.editToken),
  };
}

export function buildGroupSnapshot(groupRow, responseRows) {
  const responses = responseRows
    .map((response) => {
      const availableDates = normalizeDates(response.availableDates);
      const busyDates = groupRow.dates.filter(
        (date) => !availableDates.includes(date),
      );

      return {
        id: response.$id,
        name: response.name,
        availableDates,
        busyDates,
        availableCount: availableDates.length,
        busyCount: busyDates.length,
        updatedAt: response.$updatedAt,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const totalParticipants = responses.length;
  const dateCounts = new Map(groupRow.dates.map((date) => [date, 0]));

  for (const response of responses) {
    for (const date of response.availableDates) {
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
    }
  }

  const dateSummaries = groupRow.dates.map((date) => {
    const availableCount = dateCounts.get(date) || 0;

    return {
      date,
      label: formatDateLabel(date),
      availableCount,
      busyCount: totalParticipants - availableCount,
      allAvailable: totalParticipants > 0 && availableCount === totalParticipants,
    };
  });

  return {
    id: groupRow.$id,
    name: groupRow.name,
    dates: groupRow.dates,
    createdAt: groupRow.$createdAt,
    responseCount: totalParticipants,
    commonDates: dateSummaries.filter((summary) => summary.allAvailable),
    dateSummaries,
    responses,
  };
}
