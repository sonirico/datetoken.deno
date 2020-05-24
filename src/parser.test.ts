import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import {
  Expression,
  ModifierExpression,
  NowExpression,
  SnapExpression,
} from "./ast.ts";
import { Lexer } from "./lexer.ts";
import { Parser } from "./parser.ts";

Deno.test("Parser", () => {
  function checkParserErrors(
    actualNodes: Expression[],
    expectedNodes: any[],
  ) {
    assertEquals(expectedNodes.length, actualNodes.length);
    for (let i = 0, len = expectedNodes.length; i < len; i++) {
      const actual = actualNodes[i];
      const expected = expectedNodes[i];
      assertEquals(true, actual instanceof expected.klazz);
      switch (expected.klazz) {
        case ModifierExpression:
          assertEquals(expected.amount, (actual as ModifierExpression).amount);
          assertEquals(
            expected.modifier,
            (actual as ModifierExpression).modifier,
          );
          assertEquals(
            expected.operator,
            (actual as ModifierExpression).operator,
          );
          break;
        case SnapExpression:
          assertEquals(expected.modifier, (actual as SnapExpression).modifier);
          assertEquals(expected.operator, (actual as SnapExpression).operator);
          break;
      }
    }
  }

  Deno.test("parse", () => {
    const input = "now-1h/h@M+2w/bw+2d/thu-3s-49d/m+5d@mon";
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const nodes = parser.parse();
    const expected = [
      { klazz: NowExpression },
      { klazz: ModifierExpression, amount: 1, modifier: "h", operator: "-" },
      { klazz: SnapExpression, modifier: "h", operator: "/" },
      { klazz: SnapExpression, modifier: "M", operator: "@" },
      { klazz: ModifierExpression, amount: 2, modifier: "w", operator: "+" },
      { klazz: SnapExpression, modifier: "bw", operator: "/" },
      { klazz: ModifierExpression, amount: 2, modifier: "d", operator: "+" },
      { klazz: SnapExpression, modifier: "thu", operator: "/" },
      { klazz: ModifierExpression, amount: 3, modifier: "s", operator: "-" },
      { klazz: ModifierExpression, amount: 49, modifier: "d", operator: "-" },
      { klazz: SnapExpression, modifier: "m", operator: "/" },
      { klazz: ModifierExpression, amount: 5, modifier: "d", operator: "+" },
      { klazz: SnapExpression, modifier: "mon", operator: "@" },
    ];
    checkParserErrors(nodes, expected);
  });
  Deno.test("parse errors", () => {
    const input = "now*2n";
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    parser.parse();
    const errors = parser.getErrors();
    assertEquals(2, errors.length);
    assertEquals('Illegal operator: "*"', errors[0]);
    assertEquals('Illegal operator: "n"', errors[1]);
  });

  Deno.test("parse random string", () => {
    const input = "yoquesetioxd";
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    parser.parse();
    const errors = parser.getErrors();
    assertEquals('Illegal operator: "yoquesetioxd"', errors[0]);
  });

  Deno.test("parse nothing", () => {
    const input = undefined;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    parser.parse();
    const errors = parser.getErrors();
    assertEquals("Invalid token", errors[0]);
  });
});
