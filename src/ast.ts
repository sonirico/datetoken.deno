import * as dateFn from "https://deno.land/x/date_fns/index.js"
import { Token, TokenType } from "./token.ts";

const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export interface Expression {
  token: Token;

  operate(date?: Date): Date;

  toString(): string;

  toJSON(): object;
}

export class NowExpression implements Expression {
  public token: Token;

  constructor(token: Token) {
    this.token = token;
  }

  public operate(date: Date): Date {
    return date;
  }

  public toString(): string {
    return this.token.literal;
  }

  public toJSON(): object {
    return { type: "now" };
  }
}

export class ModifierExpression implements Expression {
  public token: Token;
  public amount: number;
  public operator: string;
  public modifier: string;

  constructor(
    token: Token,
    amount: number = 1,
    operator: string,
    modifier: string,
  ) {
    this.token = token;
    this.amount = amount;
    this.operator = operator;
    this.modifier = modifier;
  }

  public operate(date: Date): Date {
    // Lazy enough for not typing nested objects
    switch (this.operator) {
      case TokenType.PLUS:
        switch (this.modifier) {
          case "s":
            return dateFn.addSeconds(date, this.amount);
          case "m":
            return dateFn.addMinutes(date, this.amount);
          case "h":
            return dateFn.addHours(date, this.amount);
          case "d":
            return dateFn.addDays(date, this.amount);
          case "w":
            return dateFn.addWeeks(date, this.amount);
          case "M":
            return dateFn.addMonths(date, this.amount);
        }
        break;
      case TokenType.MINUS:
        switch (this.modifier) {
          case "s":
            return dateFn.subSeconds(date, this.amount);
          case "m":
            return dateFn.subMinutes(date, this.amount);
          case "h":
            return dateFn.subHours(date, this.amount);
          case "d":
            return dateFn.subDays(date, this.amount);
          case "w":
            return dateFn.subWeeks(date, this.amount);
          case "M":
            return dateFn.subMonths(date, this.amount);
        }
        break;
    }
    return date;
  }

  public toString(): string {
    return `${this.operator}${this.amount}${this.modifier}`;
  }

  public toJSON(): object {
    return {
      type: "amount",
      amount: this.amount,
      modifier: this.modifier,
      operator: this.operator,
    };
  }
}

export class SnapExpression implements Expression {
  public token: Token;
  public modifier: string;
  public operator: string;

  constructor(token: Token, modifier: string, operator: string) {
    this.token = token;
    this.modifier = modifier;
    this.operator = operator;
  }

  public operate(date: Date): Date {
    // Lazy enough for not to type nested objects
    switch (this.operator) {
      case TokenType.SLASH:
        switch (this.modifier) {
          case "s":
            return dateFn.startOfSecond(date);
          case "m":
            return dateFn.startOfMinute(date);
          case "h":
            return dateFn.startOfHour(date);
          case "d":
            return dateFn.startOfDay(date);
          case "w":
          case "bw":
            return dateFn.startOfWeek(date);
          case "mon":
          case "tue":
          case "wed":
          case "thu":
          case "fri":
          case "sat":
          case "sun": {
            const weekDayOrdinal = daysOfWeek.indexOf(this.modifier);
            const todayOrdinal = dateFn.getDay(date);
            // Unfortunately JavaScript gets modular algebra wrong.
            // -1 mod 7 ≡ 6, but for JavaScript, -1 % 7 = -1. So to get a 6,
            // you have to do stuff like this.
            const delta = (((todayOrdinal - weekDayOrdinal) % 7) + 7) % 7;
            return dateFn.subDays(date, delta);
          }
          case "M":
            return dateFn.startOfMonth(date);
        }
        break;
      case TokenType.AT:
        switch (this.modifier) {
          case "s":
            return dateFn.endOfSecond(date);
          case "m":
            return dateFn.endOfMinute(date);
          case "h":
            return dateFn.endOfHour(date);
          case "d":
            return dateFn.endOfDay(date);
          case "w":
            return dateFn.endOfWeek(date);
          case "M":
            return dateFn.endOfMonth(date);
          case "bw": {
            if (dateFn.isThisWeek(date) && !dateFn.isWeekend(date)) {
              return date;
            }
            return dateFn.endOfDay(dateFn.addDays(dateFn.startOfWeek(date), 5));
          }
          case "mon":
          case "tue":
          case "wed":
          case "thu":
          case "fri":
          case "sat":
          case "sun": {
            const weekDayOrdinal = daysOfWeek.indexOf(this.modifier);
            const todayOrdinal = dateFn.getDay(date);
            // Unfortunately JavaScript gets modular algebra wrong.
            // -1 mod 7 ≡ 6, but for JavaScript, -1 % 7 = -1. So to get a 6,
            // you have to do stuff like this.
            const delta = (((weekDayOrdinal - todayOrdinal) % 7) + 7) % 7;
            return dateFn.addDays(date, delta);
          }
        }
        break;
    }
    return date;
  }

  public toString(): string {
    return `${this.operator}${this.modifier}`;
  }

  public toJSON(): object {
    return { type: "snap", modifier: this.modifier, operator: this.operator };
  }
}

export namespace AmountModifiers {
  const values: string[] = ["s", "m", "h", "d", "w", "M"];

  export const valuesString = `(${values.map((v) => `"${v}"`).join(",")})`;

  export function checkModifier(modifier: string) {
    return values.includes(modifier);
  }
}
export namespace SnapModifiers {
  const values: string[] = [
    "s",
    "m",
    "h",
    "d",
    "w",
    "bw",
    "M",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun",
  ];

  export const valuesString = `(${values.map((v) => `"${v}"`).join(",")})`;

  export function checkModifier(modifier: string) {
    return values.includes(modifier);
  }
}

export function newNowExpression() {
  return new NowExpression(new Token(TokenType.NOW, "now"));
}
