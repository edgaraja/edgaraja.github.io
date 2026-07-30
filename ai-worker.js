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

    // Forwards each completed depth's result to the main thread as it
    // happens (ai.js calls this once per iterative-deepening pass) -- gives
    // chess.js's dispatchSearchRound a stream of "progress" messages ahead
    // of the final one, tagged so it can tell the two apart. Cleared right
    // after playAi2 returns so a stale closure from this call never fires
    // during some later, unrelated dispatch to this same reused worker.
    onSearchProgress = function (info) {
        postMessage({
            type: "progress",
            depth: info.depth,
            score: info.score,
            move: info.move,
            nodes: info.nodes,
            timeMs: info.timeMs,
        });
    };

    // rootMoveSubset is only present when this worker is part of a
    // root-splitting pool (chess.js's requestAiMove) -- deadline/hardDeadline
    // are sent independently of it, since the player-turn background-eval
    // dispatch (chess.js's runBackgroundEval) sends its own 10-second budget
    // WITHOUT a rootMoveSubset, to get playAi2's original full-move-list
    // search capped at that budget instead of a pool slice's. Omitted
    // fields just fall back to playAi2's own internal defaults, same as
    // passing no options at all.
    const move = playAi2({
        rootMoveSubset: data.rootMoveSubset,
        deadline: data.deadline,
        hardDeadline: data.hardDeadline,
        skipBook: data.skipBook,
    });
    onSearchProgress = null;
    postMessage({ type: "done", move, lastSearchDepth, lastSearchScore, lastSearchTimeMs, lastSearchUnstable, lastSearchNodes });
};
