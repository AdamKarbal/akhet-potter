// test_khet_ai.mjs
// Usage: node test_khet_ai.mjs

import { setup, nextMove } from "./akhet-potter.js";

// ----------------------------
// Utils
// ----------------------------

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

function isValidCell(x) {
  return Number.isInteger(x) && x >= 0 && x < 100;
}

function isValidOrientation(o) {
  return o === 0 || o === 9 || o === 90 || o === 99;
}

function validateExternalAction(a) {
  assert(a && typeof a === "object", "Action doit être un objet");
  assert(typeof a.action === "string", "Action.action invalide");
  assert(isValidCell(a.cell), `Cell invalide: ${a.cell}`);

  switch (a.action) {
    case "ROTATE":
      assert(
        a.result === "CLOCKWISE" || a.result === "ANTICLOCKWISE",
        `ROTATE.result invalide: ${a.result}`
      );
      break;

    case "MOVE":
      assert(isValidCell(a.result), `MOVE.result invalide: ${a.result}`);
      break;

    case "EXCHANGE":
      assert(isValidCell(a.result), `EXCHANGE.result invalide: ${a.result}`);
      break;

    case "PLACE":
      assert(a.result && typeof a.result === "object", "PLACE.result invalide");
      assert(
        isValidCell(a.result.destination),
        `PLACE.destination invalide: ${a.result.destination}`
      );
      assert(
        isValidOrientation(a.result.orientation),
        `PLACE.orientation invalide: ${a.result.orientation}`
      );
      break;

    default:
      throw new Error(`Action inconnue: ${a.action}`);
  }
}

// ----------------------------
// Mirroring helpers
// ----------------------------

function mirrorCell(cell) {
  return 99 - cell;
}

function mirrorRotationResult(result) {
  if (result === "CLOCKWISE") return "ANTICLOCKWISE";
  if (result === "ANTICLOCKWISE") return "CLOCKWISE";
  return result;
}

function mirrorOrientation(orientation) {
  if (orientation === 0) return 99;
  if (orientation === 99) return 0;
  if (orientation === 9) return 90;
  if (orientation === 90) return 9;
  return orientation;
}

function mirrorExternalAction(action) {
  if (!action) return null;

  switch (action.action) {
    case "ROTATE":
      return {
        action: "ROTATE",
        cell: mirrorCell(action.cell),
        result: mirrorRotationResult(action.result),
      };

    case "MOVE":
      return {
        action: "MOVE",
        cell: mirrorCell(action.cell),
        result: mirrorCell(action.result),
      };

    case "EXCHANGE":
      return {
        action: "EXCHANGE",
        cell: mirrorCell(action.cell),
        result: mirrorCell(action.result),
      };

    case "PLACE":
      return {
        action: "PLACE",
        cell: mirrorCell(action.cell),
        result: {
          destination: mirrorCell(action.result.destination),
          orientation: mirrorOrientation(action.result.orientation),
        },
      };

    default:
      return action;
  }
}

// ----------------------------
// Main test
// ----------------------------

async function main() {
  const initialPositions = {
    sphinx: 0,
    pharaoh: 4,
    scarab: { position: 13, orientation: 9 },
  };

  console.log("=== TEST: setup(first) ===");

  const t0 = nowMs();
  const ok = await setup(initialPositions, true);
  const t1 = nowMs();

  console.log("setup returned:", ok, "time:", t1 - t0, "ms");

  assert(ok === true, "setup doit retourner true");
  assert(t1 - t0 < 1000, "setup doit être < 1000ms");

  console.log("\n=== TEST: nextMove loop ===");

  let opponentAction = null;
  const N = 30;

  for (let i = 0; i < N; i++) {
    const start = nowMs();

    const myAction = await nextMove(opponentAction);

    const end = nowMs();
    const duration = end - start;

    const playerLabel = (i % 2 === 0) ? 'P1' : 'P2';

    console.log(
      `#${String(i).padStart(2, "0")} ${playerLabel} action=`,
      myAction,
      "time:",
      duration,
      "ms"
    );

    validateExternalAction(myAction);
    assert(duration < 200, "nextMove dépasse 200ms");

    // simulate opponent properly (mirror perspective)
    opponentAction = mirrorExternalAction(myAction);
  }

  console.log("\nOK ✅ Aucun crash, actions valides, timings respectés.");
}

main().catch((e) => {
  console.error("FAIL ❌", e);
  process.exit(1);
});