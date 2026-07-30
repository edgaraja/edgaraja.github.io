// Runs the AI's search off the main thread. Loads the same engine files the
// real page does, in the same order -- chess.js's own top-level code
// detects the absence of `document` here and skips straight past all DOM
// setup, leaving just the pure board/search state each file already
// initializes (see the `typeof document !== "undefined"` guard in chess.js).
importScripts("chess.js", "bitboard.js", "ai.js", "getcapture.js");

onmessage = function (e) {
    const data = e.data;
    boardPosition = data.boardPosition;
    whiteToMove = data.whiteToMove;
    lastMove = data.lastMove;
    WhiteKingPos = data.WhiteKingPos;
    BlackKingPos = data.BlackKingPos;
    pieceCount = data.pieceCount;
    positionHistory = data.positionHistory;

    // rootMoveSubset/deadline/hardDeadline are only present when this worker
    // is part of a root-splitting pool (chess.js's requestAiMove); a plain
    // single-worker dispatch omits them, giving playAi2() its original,
    // unrestricted behavior.
    const move = playAi2(
        data.rootMoveSubset
            ? { rootMoveSubset: data.rootMoveSubset, deadline: data.deadline, hardDeadline: data.hardDeadline }
            : undefined
    );
    postMessage({ move, lastSearchDepth, lastSearchScore, lastSearchTimeMs, lastSearchUnstable, lastSearchNodes });
};
