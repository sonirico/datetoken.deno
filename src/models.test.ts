import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std/testing/asserts.ts";
import { format } from "https://deno.land/x/date_fns/format/index.js"
import * as sinon from "https://github.com/sinonjs/sinon/releases/tag/v9.0.2";
import { ModifierExpression, NowExpression, SnapExpression } from "./ast.ts";
import { Token as TokenModel } from "./models.ts";
import { Token, TokenType } from "./token.ts";
import { InvalidTokenError } from "./errors.ts";

const dateFormat = "yyyy-MM-dd'T'HH:mm:ssxxx";
const nowFaked: number = 1529311147000;
// 1529311147 => 2018-06-18T08:39:07+00:00
const fakeTimer = sinon.useFakeTimers(nowFaked);

Deno.test("Token model", () => {
  Deno.test("toString()", () => {
    const model = new TokenModel([
      new NowExpression(new Token(TokenType.NOW, "now")),
      new ModifierExpression(new Token(TokenType.PLUS, "+"), 2, "+", "h"),
      new ModifierExpression(new Token(TokenType.MINUS, "-"), 1, "-", "s"),
      new SnapExpression(new Token(TokenType.SLASH, "/"), "bw", "/"),
      new ModifierExpression(new Token(TokenType.MINUS, "-"), 99, "-", "M"),
      new ModifierExpression(new Token(TokenType.MINUS, "-"), 2, "-", "m"),
      new SnapExpression(new Token(TokenType.AT, "@"), "d", "@"),
    ]);
    assertEquals("now+2h-1s/bw-99M-2m@d", model.toString());
  });

  Deno.test("toJSON()", () => {
    const model = new TokenModel([
      new NowExpression(new Token(TokenType.NOW, "now")),
      new ModifierExpression(new Token(TokenType.PLUS, "+"), 2, "+", "h"),
      new ModifierExpression(new Token(TokenType.MINUS, "-"), 1, "-", "s"),
      new SnapExpression(new Token(TokenType.SLASH, "/"), "bw", "/"),
      new ModifierExpression(new Token(TokenType.MINUS, "-"), 99, "-", "M"),
      new ModifierExpression(new Token(TokenType.MINUS, "-"), 2, "-", "m"),
      new SnapExpression(new Token(TokenType.AT, "@"), "d", "@"),
    ]);
    const expected = [
      { type: "now" },
      { type: "amount", amount: 2, modifier: "h", operator: "+" },
      { type: "amount", amount: 1, modifier: "s", operator: "-" },
      { type: "snap", modifier: "bw", operator: "/" },
      { type: "amount", amount: 99, modifier: "M", operator: "-" },
      { type: "amount", amount: 2, modifier: "m", operator: "-" },
      { type: "snap", modifier: "d", operator: "@" },
    ];
    assertEquals(expected, model.toJSON());
  });

  Deno.test("<now> toDate()", () => {
    const model = new TokenModel(
      [new NowExpression(new Token(TokenType.NOW, "now"))],
    );
    assertEquals(false, model.isSnapped);
    assertEquals(false, model.isModified);
    assertEquals("now", model.toString());
    assertEquals(nowFaked, model.toDate());
  });

  Deno.test("<now/d> toDate()", () => {
    const model = new TokenModel([
      new NowExpression(new Token(TokenType.NOW, "now")),
      new SnapExpression(new Token(TokenType.SLASH, "/"), "d", "/"),
    ]);
    assertEquals(true, model.isSnapped);
    assertEquals(false, model.isModified);
    assertEquals("now/d", model.toString());
    assertEquals(
      "2018-06-18T00:00:00+00:00",
      format(model.toDate(), dateFormat),
    );
  });

  Deno.test("<now/d@d/d@d> toDate()", () => {
    const model = new TokenModel([
      new NowExpression(new Token(TokenType.NOW, "now")),
      new SnapExpression(new Token(TokenType.SLASH, "/"), "d", "/"),
      new SnapExpression(new Token(TokenType.AT, "@"), "d", "@"),
      new SnapExpression(new Token(TokenType.SLASH, "/"), "d", "/"),
    ]);
    assertEquals(true, model.isSnapped);
    assertEquals(false, model.isModified);
    assertEquals("now/d@d/d", model.toString());
    assertEquals(
      "2018-06-18T00:00:00+00:00",
      format(model.toDate(), dateFormat),
    );
  });

  Deno.test("<+5s>, 'now' is optional, only one amount modifier", () => {
    const model = new TokenModel(
      [new ModifierExpression(new Token(TokenType.PLUS, "+"), 5, "+", "s")],
    );
    assertEquals(false, model.isSnapped);
    assertEquals(true, model.isModified);
    assertEquals("+5s", model.toString());
    assertEquals(nowFaked + 5 * 1000, model.toDate().getTime());
    assertEquals(
      "2018-06-18T08:39:12+00:00",
      format(model.toDate().getTime(), dateFormat),
    );
  });

  Deno.test("</d>, 'now' is optional, only one snap modifier", () => {
    const model = new TokenModel(
      [new SnapExpression(new Token(TokenType.SLASH, "/"), "d", "/")],
    );
    assertEquals("/d", model.toString());
    assertEquals(
      "2018-06-18T00:00:00+00:00",
      format(model.toDate(), dateFormat),
    );
  });

  Deno.test("fromString()", () => {
    Deno.test("with no input yields error", () => {
      assertEquals(
        () => {
          TokenModel.fromString("");
        },
        InvalidTokenError,
        "Invalid token",
      );
    });

    Deno.test("with random input yields error", () => {
      assertEquals(
        () => {
          TokenModel.fromString("yoquesetioxd");
        },
        InvalidTokenError,
        'Illegal operator: "yoquesetioxd"',
      );
    });

    Deno.test("now is optional", () => {
      const token = TokenModel.fromString("/d");
      assertEquals(true, token.isSnapped);
      assertEquals(false, token.isModified);
      assertEquals(1, token.nodes.length);
      assertEquals(
        "2018-06-18T00:00:00+00:00",
        format(token.toDate(), dateFormat),
      );
    });

    Deno.test("starting date can be configured", () => {
      const oneHourAgo = new Date(nowFaked - 1000 * 60 * 60);
      const model = TokenModel.fromString("now", oneHourAgo);
      assertEquals(false, model.isSnapped);
      assertEquals(true, model.isModified);
      assertEquals(
        "2018-06-18T07:39:07+00:00",
        format(model.toDate().getTime(), dateFormat),
      );
    });
  });
});
