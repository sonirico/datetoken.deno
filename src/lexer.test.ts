import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { TokenType, Token } from "./token.ts";
import { Lexer } from "./lexer.ts";

type TestTable = [TokenType, string][];

function assertToken(
  actual: Token,
  expectedType: TokenType,
  expectedLiteral: string,
) {
  assertEquals(expectedType, actual.type);
  assertEquals(expectedLiteral, actual.literal);
}

function assertTokens(payload: string, table: TestTable) {
  const lexer = new Lexer(payload);
  for (const [expectedType, expectedLiteral] of table) {
    const actual = lexer.nextToken();
    assertToken(actual, expectedType, expectedLiteral);
  }
}

Deno.test("Lexer", () => {
  Deno.test("Lexer no word", () => {
    const input = undefined;
    const lexer = new Lexer(input);
    assertEquals(true, lexer.isInvalid());
  });

  Deno.test("Lexer invalid word", () => {
    const input = "yoquesetio";
    const lexer = new Lexer(input);
    const actual = lexer.nextToken();
    assertToken(actual, TokenType.ILLEGAL, "yoquesetio");
  });

  Deno.test("Lexer.nextToken tokenize ok", () => {
    const input = "now-1h/h@M+2w/bw+2d/mon-3s-49d/m";
    assertTokens(input, [
      [TokenType.NOW, "now"],
      [TokenType.MINUS, "-"],
      [TokenType.NUMBER, "1"],
      [TokenType.MODIFIER, "h"],
      [TokenType.SLASH, "/"],
      [TokenType.MODIFIER, "h"],
      [TokenType.AT, "@"],
      [TokenType.MODIFIER, "M"],
      [TokenType.PLUS, "+"],
      [TokenType.NUMBER, "2"],
      [TokenType.MODIFIER, "w"],
      [TokenType.SLASH, "/"],
      [TokenType.MODIFIER, "bw"],
      [TokenType.PLUS, "+"],
      [TokenType.NUMBER, "2"],
      [TokenType.MODIFIER, "d"],
      [TokenType.SLASH, "/"],
      [TokenType.MODIFIER, "mon"],
      [TokenType.MINUS, "-"],
      [TokenType.NUMBER, "3"],
      [TokenType.MODIFIER, "s"],
      [TokenType.MINUS, "-"],
      [TokenType.NUMBER, "49"],
      [TokenType.MODIFIER, "d"],
      [TokenType.SLASH, "/"],
      [TokenType.MODIFIER, "m"],
      [TokenType.END, ""],
    ]);
  });
  Deno.test("Lexer.nextToken tokenize illegal", () => {
    const input = "now*2h";
    assertTokens(input, [
      [TokenType.NOW, "now"],
      [TokenType.ILLEGAL, "*"],
      [TokenType.NUMBER, "2"],
      [TokenType.MODIFIER, "h"],
    ]);
  });
});
