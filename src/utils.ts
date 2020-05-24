import { Token } from "./models.ts";

export function tokenToDate(token: string, at?: Date): Date {
  return Token.fromString(token, at).toDate();
}
