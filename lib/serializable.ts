import type { JSONValue } from 'postgres';
/** Explicit JSONB values prevent strings being encoded twice by the driver. */
export function jsonValue(value:unknown):JSONValue { return JSON.parse(JSON.stringify(value)) as JSONValue; }
