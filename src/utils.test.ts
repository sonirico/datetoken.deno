import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { format } from "https://deno.land/x/date_fns/format/index.js"
import * as sinon from "https://github.com/sinonjs/sinon/releases/tag/v9.0.2";
import { tokenToDate } from "./utils.ts";

const dateFormat = "yyyy-MM-dd'T'HH:mm:ssxxx";
const nowFaked = 1529311147000; // => 2018-06-18T08:39:07+00:00
const fakeTimer = sinon.useFakeTimers(nowFaked);

Deno.test("utils.tokenToDate", () => {
  Deno.test("now", () => {
    Deno.test("is understood", () => {
      assertEquals(nowFaked, tokenToDate("now").getTime());
    });
  });

  Deno.test("now with offset", () => {
    Deno.test("and leaving the amount unset defaults to 1", () => {
      assertEquals(nowFaked + 1000, tokenToDate("now+s").getTime());
    });

    Deno.test("can add seconds", () => {
      assertEquals(nowFaked + 5000, tokenToDate("now+5s").getTime());
    });

    Deno.test("can subtract seconds", () => {
      assertEquals(nowFaked - 5000, tokenToDate("now-5s").getTime());
    });

    Deno.test("can add minutes", () => {
      assertEquals(nowFaked + 5 * 60 * 1000, tokenToDate("now+5m").getTime());
    });

    Deno.test("can subtract minutes", () => {
      assertEquals(nowFaked - 5 * 60 * 1000, tokenToDate("now-5m").getTime());
    });

    Deno.test("can add hours", () => {
      assertEquals(
        nowFaked + 5 * 60 * 60 * 1000,
        tokenToDate("now+5h").getTime(),
      );
    });

    Deno.test("can subtract hours", () => {
      assertEquals(
        nowFaked - 5 * 60 * 60 * 1000,
        tokenToDate("now-5h").getTime(),
      );
    });

    Deno.test("can add days", () => {
      assertEquals(
        nowFaked + 2 * 24 * 60 * 60 * 1000,
        tokenToDate("now+2d").getTime(),
      );
    });

    Deno.test("can subtract days", () => {
      assertEquals(
        nowFaked - 2 * 24 * 60 * 60 * 1000,
        tokenToDate("now-2d").getTime(),
      );
    });

    Deno.test("can add weeks", () => {
      assertEquals(
        nowFaked + 7 * 24 * 60 * 60 * 1000,
        tokenToDate("now+1w").getTime(),
      );
    });

    Deno.test("can subtract weeks", () => {
      assertEquals(
        nowFaked - 7 * 24 * 60 * 60 * 1000,
        tokenToDate("now-1w").getTime(),
      );
    });

    Deno.test("can add months", () => {
      // 61 = 30 (June) + 31 (July)
      assertEquals(
        nowFaked + 61 * 24 * 60 * 60 * 1000,
        tokenToDate("now+2M").getTime(),
      );
    });

    Deno.test("can subtract months", () => {
      // 61 = 30 (April) + 31 (May)
      assertEquals(
        nowFaked - 61 * 24 * 60 * 60 * 1000,
        tokenToDate("now-2M").getTime(),
      );
    });
  });

  Deno.test("now with markers", () => {
    Deno.test("understands the start of minute", () => {
      const actual = format(tokenToDate("now/m"), dateFormat);
      assertEquals("2018-06-18T08:39:00+00:00", actual);
    });

    Deno.test("understands the end of minute", () => {
      const actual = format(tokenToDate("now@m"), dateFormat);
      const expected = "2018-06-18T08:39:59+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the start of hour", () => {
      const actual = format(tokenToDate("now/h"), dateFormat);
      const expected = "2018-06-18T08:00:00+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the end of hour", () => {
      const actual = format(tokenToDate("now@h"), dateFormat);
      const expected = "2018-06-18T08:59:59+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the start of day", () => {
      const actual = format(tokenToDate("now/d"), dateFormat);
      const expected = "2018-06-18T00:00:00+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the end of day", () => {
      const actual = format(tokenToDate("now@d"), dateFormat);
      const expected = "2018-06-18T23:59:59+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the start of week", () => {
      const actual = format(tokenToDate("now/w"), dateFormat);
      const expected = "2018-06-17T00:00:00+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the end of week", () => {
      const actual = format(tokenToDate("now@w"), dateFormat);
      const expected = "2018-06-23T23:59:59+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the start of the last business week", () => {
      const actual = format(tokenToDate("now-w/bw"), dateFormat);
      const expected = "2018-06-10T00:00:00+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the end of the last business week", () => {
      const actual = format(tokenToDate("now-w@bw"), dateFormat);
      const expected = "2018-06-15T23:59:59+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the start of this business week", () => {
      const actual = format(tokenToDate("now/bw"), dateFormat);
      const expected = "2018-06-17T00:00:00+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the end of this business week", () => {
      /**
       * In this case, now is faked to monday, which means that
       * "business week to date" ranges from 17 to {nowFaked}
       */
      const actual = format(tokenToDate("now@bw"), dateFormat);
      const expected = "2018-06-18T08:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the end of this business week on weekends", () => {
      /**
       * This case covers the schedule of the "business week to date" preset
       * on weekends, which should range from monday to friday (Spanish locale)
       * or, better said, have a length of 5 days.
       */

      // Saturday, 29 September 2018 9:40:25
      const ft = sinon.useFakeTimers(1538214025000);
      const actual = format(tokenToDate("now@bw"), dateFormat);
      const expected = "2018-09-28T23:59:59+00:00";
      ft.restore();
      assertEquals(expected, actual);
    });

    Deno.test("understands the start of month", () => {
      const actual = format(tokenToDate("now/M"), dateFormat);
      const expected = "2018-06-01T00:00:00+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("understands the end of month", () => {
      const actual = format(tokenToDate("now@M"), dateFormat);
      const expected = "2018-06-30T23:59:59+00:00";
      assertEquals(expected, actual);
    });
  });

  Deno.test("now with offset and marker", () => {
    Deno.test("is understood as startOf", () => {
      const actual = format(tokenToDate("now-2d/d"), dateFormat);
      const expected = "2018-06-16T00:00:00+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("is understood as endOf", () => {
      const actual = format(tokenToDate("now-2d@d"), dateFormat);
      const expected = "2018-06-16T23:59:59+00:00";
      assertEquals(expected, actual);
    });
  });

  Deno.test("now with two offsets", () => {
    Deno.test("is understood with two subtracts", () => {
      const actual = format(tokenToDate("now-2d-2h"), dateFormat);
      const expected = "2018-06-16T06:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("is understood with two adds", () => {
      const actual = format(tokenToDate("now+2d+2h"), dateFormat);
      const expected = "2018-06-20T10:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("is understood with a subtract and an add", () => {
      const actual = format(tokenToDate("now-2d+2h"), dateFormat);
      const expected = "2018-06-16T10:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("is understood with an add and a subtract", () => {
      const actual = format(tokenToDate("now+2d-2h"), dateFormat);
      const expected = "2018-06-20T06:39:07+00:00";
      assertEquals(expected, actual);
    });
  });

  Deno.test("using a day of the week as a snap", () => {
    // Guide for readers: 2018-06-18 was Monday.

    Deno.test("last Friday", () => {
      const actual = format(tokenToDate("now/fri"), dateFormat);
      const expected = "2018-06-15T08:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("last Tuesday", () => {
      const actual = format(tokenToDate("now/tue"), dateFormat);
      const expected = "2018-06-12T08:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("last Monday", () => {
      // Since today is Monday, it should snap to today.
      const actual = format(tokenToDate("now/mon"), dateFormat);
      const expected = "2018-06-18T08:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("next Friday", () => {
      const actual = format(tokenToDate("now@fri"), dateFormat);
      const expected = "2018-06-22T08:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("next Sunday", () => {
      const actual = format(tokenToDate("now@sun"), dateFormat);
      const expected = "2018-06-24T08:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("next Monday", () => {
      // Today is Monday, so it should snap to today.
      const actual = format(tokenToDate("now@mon"), dateFormat);
      const expected = "2018-06-18T08:39:07+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("snaps to the start of the day when combined", () => {
      const actual = format(tokenToDate("now-w/mon/d"), dateFormat);
      const expected = "2018-06-11T00:00:00+00:00";
      assertEquals(expected, actual);
    });

    Deno.test("snaps to the end of the day when combined", () => {
      const actual = format(tokenToDate("now-w@fri@d"), dateFormat);
      const expected = "2018-06-15T23:59:59+00:00";
      assertEquals(expected, actual);
    });
  });

  Deno.test("now-1w+3d-6m", () => {
    const actual = tokenToDate("now-1w+3d-6m");
    const delta = (-(7 * 24 * 3600) + 3 * 24 * 3600 - 6 * 60) * 1000;
    assertEquals(nowFaked + delta, actual.getTime());
  });

  Deno.test("starting date can be configured", () => {
    Deno.test("now", () => {
      const delta = -60 * 60 * 1000;
      const oneHourAgo = new Date(nowFaked + delta);
      const actual = tokenToDate("now", oneHourAgo);
      assertEquals(nowFaked + delta, actual.getTime());
    });

    Deno.test("now+2w-20m", () => {
      const delta = (-2 * 7 * 24 * 3600 + 20 * 60) * 1000;
      const oneHourAgo = new Date(nowFaked + delta);
      const actual = tokenToDate("now", oneHourAgo);
      assertEquals(nowFaked + delta, actual.getTime());
    });
  });
});
