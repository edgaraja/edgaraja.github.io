var lightColor = "#EEEED2";
var darkColor = "#769656";
var defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
// container/gameRow are DOM-only, so they (and everything else that touches
// document/window) are created further below, inside a `typeof document !==
// "undefined"` guard -- this file also gets loaded into a Worker (no DOM at
// all) via ai-worker.js's importScripts, to run search off the main thread.
var container = null;
var gameRow = null;
var buttonRow = null;
var boardPosition = [];
var whiteToMove = true;
var nextMoves = [];
var isWhiteRookMoved1 = false;
var isWhiteRookMoved2 = false;
var isWhiteKingMoved = false;
var isBlackRookMoved1 = false;
var isBlackRookMoved2 = false;
var isBlackKingMoved = false;
var moveCntr = 0;
var attackedPosition = [];
let WhiteKingPos;
let BlackKingPos;
let pieceCount = 0;
var playAsW = false;
var playAsB = false;
var halfMoveClock = 0;
var positionHistory = new Map();
var gameOver = false;
// One entry per applied move (player's or AI's alike -- movePiece is the
// single choke point both go through), each holding everything needed to
// put the game back exactly as it was right before that move. Undo pops
// from here rather than replaying moveToBoard/unmakeMove in reverse --
// those are search-only machinery (tied to makeMoveStackDepth and the
// incremental __liveBB/__liveEval hooks), not meant for arbitrary
// user-driven rewinding of the real game state.
var undoStack = [];
var undoButton = null;
// One SAN string per applied move, in exact 1:1 lockstep with undoStack --
// both only ever grow (by one, inside movePiece) or get truncated together
// (restoreSnapshot's undo path), so moveHistorySAN.length === undoStack.length
// always holds.
var moveHistorySAN = [];
var moveHistoryPanel = null;
// Pre-move state. premoveSelectedSquare/premoveCandidates are transient --
// a piece has been picked during the AI's think time but no destination
// confirmed yet. pendingPremove is the confirmed, queued move ({pos,
// posTo, promotedType}, promotedType null for non-promotions) that fires
// automatically (tryFirePremove) once it's genuinely the player's turn
// again -- see movePiece's end-of-turn handling.
var premoveSelectedSquare = null;
var premoveCandidates = [];
var pendingPremove = null;
var evalBarWhiteFill = null;
var evalBarLabel = null;
var boardFlipped = false;
var rankLabelEls = [];
var fileLabelEls = [];
var searchInfoLabel = null;
// One worker per pool slot for root-splitting parallel search (see
// requestAiMove below): navigator.hardwareConcurrency isn't available
// inside a Worker's own realm the same way it matters here, so this is only
// ever meaningfully read on the main thread, where it decides how many
// workers to actually create.
let aiWorkerPool = [];
let aiThinking = false;
// One pending-reject slot per pool worker, indexed the same way
// aiWorkerPool is -- lets a specific worker's onerror reject only its own
// in-flight request instead of guessing which request was in flight.
let pendingAiRejects = [];

const None = 0;
const Pawn = 1;
const Knight = 2;
const Bishop = 3;
const Rook = 4;
const Queen = 5;
const King = 6;

const White = 8;
const Black = 16;

class Move {
    constructor(piece, pos, posTo, attPiece, isCastle, castleType, isPromoted, promotedTo, isEnp, enpTo) {
        this.piece = piece;
        this.pos = pos;
        this.posTo = posTo;
        this.attPiece = attPiece;
        this.isCastle = isCastle;
        this.isPromoted = isPromoted;
        this.castleType = castleType;
        this.promotedTo = promotedTo;
        this.isEnp = isEnp;
        this.enpTo = enpTo;
        this.moveScoreGuess = 0;
    }
}
// Every board square and every Move's piece-related field (`piece`,
// `attPiece`, `promotedTo`) is one of these packed numbers, not an object --
// color|type|moved-bit in a single byte, read with raw bitmasks instead of
// object property access. `None`/`Pawn`..`King` (0-6) and `White`/`Black`
// (8/16) are unchanged from their original values and already occupy
// disjoint bit ranges, so `color | type` was already a unique byte per
// (color, type) combination before this existed; MOVED_BIT (32) adds the
// one piece of per-square mutable state (castling rights) that isn't
// encoded in color/type alone. 0 doubles as both `None` and the universal
// "empty square" sentinel -- every emptiness check in this engine is
// `((x) & 7) == None`, never a nullish check, so a plain `0` is a safe,
// unambiguous empty value.
const TYPE_MASK = 7;    // bits 0-2: None=0..King=6
const COLOR_MASK = 24;  // bits 3-4: White=8, Black=16
const MOVED_BIT = 32;   // bit 5

function pieceType(b) { return b & TYPE_MASK; }
function pieceColor(b) { return b & COLOR_MASK; }
function hasMoved(b) { return (b & MOVED_BIT) !== 0; }
function makePiece(color, type, moved) { return color | type | (moved ? MOVED_BIT : 0); }

var lastMove = new Move(((None) | (None) | ((false) ? 32 : 0)), 0, 0, 0, false, null, false, null, false, null);

function createBoard() {
    var board = document.createElement("div");
    board.style.width = "600px";
    board.style.height = "600px";
    board.style.display = "flex";
    board.style.margin = "0 auto";
    board.style.flexWrap = "wrap";

    let pos = 56;

    for (let file = 0; file < 8; file++) {
        for (let rank = 0; rank < 8; rank++) {
            var tile = document.createElement("div");
            tile.setAttribute("id", pos);
            tile.style.width = "75px";
            tile.style.height = "75px";
            tile.style.display = "flex";
            tile.style.justifyContent = "center";
            tile.style.alignItems = "center";
            tile.style.position = "relative";
            var isLight = (file + rank) % 2 == 0;

            if (isLight) {
                tile.style.background = lightColor;
                tile.setAttribute("tileColor", "light");
            } else {
                tile.style.background = darkColor;
                tile.setAttribute("tileColor", "dark");
            }
            board.appendChild(tile);
            pos += 1;
        }
        pos -= 16;
    }

    function makeLabel(width, height) {
        var label = document.createElement("div");
        label.style.width = width;
        label.style.height = height;
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.justifyContent = "center";
        label.style.color = "#ddd";
        label.style.fontFamily = "sans-serif";
        label.style.fontSize = "14px";
        return label;
    }

    var rankLabels = document.createElement("div");
    rankLabels.style.display = "flex";
    rankLabels.style.flexDirection = "column";
    for (let i = 0; i < 8; i++) {
        var rankLabel = makeLabel("22px", "75px");
        rankLabels.appendChild(rankLabel);
        rankLabelEls.push(rankLabel);
    }

    var fileLabels = document.createElement("div");
    fileLabels.style.display = "flex";
    for (let i = 0; i < 8; i++) {
        var fileLabel = makeLabel("75px", "22px");
        fileLabels.appendChild(fileLabel);
        fileLabelEls.push(fileLabel);
    }

    var boardAndFiles = document.createElement("div");
    boardAndFiles.style.display = "flex";
    boardAndFiles.style.flexDirection = "column";
    boardAndFiles.appendChild(board);
    boardAndFiles.appendChild(fileLabels);

    var boardWithLabels = document.createElement("div");
    boardWithLabels.style.display = "flex";
    boardWithLabels.appendChild(rankLabels);
    boardWithLabels.appendChild(boardAndFiles);

    gameRow.appendChild(boardWithLabels);
}

// Keeps the a-h / 1-8 labels in sync with boardFlipped. Labels are plain
// text with no square identity to preserve, so it's simplest to just
// recompute their text rather than reordering elements the way the tiles
// themselves are (via CSS `order` in applyBoardOrientation).
function updateBoardLabels() {
    for (let r = 0; r < 8; r++) {
        rankLabelEls[r].textContent = boardFlipped ? String(r + 1) : String(8 - r);
    }
    for (let c = 0; c < 8; c++) {
        fileLabelEls[c].textContent = String.fromCharCode(97 + (boardFlipped ? 7 - c : c));
    }
}

function createEvalBar() {
    var wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.marginRight = "12px";

    var bar = document.createElement("div");
    bar.style.width = "34px";
    bar.style.height = "600px";
    bar.style.background = "#3a3a3a";
    bar.style.border = "1px solid #222";
    bar.style.position = "relative";
    bar.style.overflow = "hidden";
    bar.style.flexShrink = "0";

    var whiteFill = document.createElement("div");
    whiteFill.style.position = "absolute";
    whiteFill.style.left = "0";
    whiteFill.style.bottom = "0";
    whiteFill.style.width = "100%";
    whiteFill.style.height = "50%";
    whiteFill.style.background = lightColor;
    whiteFill.style.transition = "height 0.3s ease";
    bar.appendChild(whiteFill);

    var label = document.createElement("div");
    label.style.marginTop = "6px";
    label.style.fontSize = "13px";
    label.style.fontFamily = "sans-serif";
    label.style.fontWeight = "bold";
    label.style.color = "#eee";
    label.textContent = "0.0";

    wrapper.appendChild(bar);
    wrapper.appendChild(label);
    gameRow.appendChild(wrapper);

    evalBarWhiteFill = whiteFill;
    evalBarLabel = label;
}

// Maps a static eval (in pawns, White's perspective) to a white-share
// percentage using the same style of sigmoid lichess/chess.com use for
// their eval bars: small edges move the bar noticeably, large ones
// saturate smoothly instead of slamming straight to 0%/100%.
function evalToWhitePercent(score) {
    var winFrac = 2 / (1 + Math.exp(-0.4 * score)) - 1; // -1..1
    var percent = 50 + 50 * winFrac;
    return Math.max(2, Math.min(98, percent));
}

// Driven entirely by the engine's own search result (lastSearchScore, from
// White's perspective) rather than an instant static Evaluate() call -- a
// raw material+PST snapshot recomputed after every ply was cheap but not
// very meaningful next to what the AI actually calculated. Only ever
// called from playAiTurn, right when a search finishes; a null score (book
// move, or no search yet) just leaves the bar showing whatever it last did.
function updateEvalBar(score) {
    if (!evalBarWhiteFill || score === null || score === undefined) return;
    var whitePercent = evalToWhitePercent(score);
    evalBarWhiteFill.style.height = whitePercent + "%";
    evalBarLabel.textContent = score >= 0 ? "+" + score.toFixed(1) : score.toFixed(1);
}

// Re-flows the 64 tiles into their visual slots via the CSS `order`
// property, keyed off boardFlipped. Tile identity (id, click handlers,
// piece classes, any dynamically-added children like the promotion menu)
// never changes — only which grid slot each tile renders in — so nothing
// else in the game logic needs to know or care about orientation.
function applyBoardOrientation() {
    for (let i = 0; i < 64; i++) {
        const engineRank = Math.floor(i / 8);
        const engineCol = i % 8;
        const visualRow = boardFlipped ? engineRank : 7 - engineRank;
        const visualCol = boardFlipped ? 7 - engineCol : engineCol;
        document.getElementById(i).style.order = visualRow * 8 + visualCol;
    }
}

function createFlipButton() {
    var btn = document.createElement("button");
    btn.textContent = "Flip Board";
    btn.style.margin = "0";
    btn.style.padding = "8px 20px";
    btn.style.fontSize = "16px";
    btn.style.cursor = "pointer";
    btn.style.background = "#769656";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.addEventListener("mouseenter", function () {
        btn.style.background = "#5a7a3a";
    });
    btn.addEventListener("mouseleave", function () {
        btn.style.background = "#769656";
    });
    btn.addEventListener("click", function () {
        boardFlipped = !boardFlipped;
        applyBoardOrientation();
        updateBoardLabels();
    });
    buttonRow.appendChild(btn);
}

// Only wired up for the two player-vs-AI entry points (playAsWhite/
// playAsBlack below) -- AivsAi() never calls this, so the pure AI-vs-AI
// page has no undo affordance at all, which makes sense since there's no
// human move on that page to take back.
function createUndoButton() {
    var btn = document.createElement("button");
    btn.textContent = "Undo";
    btn.style.margin = "0";
    btn.style.padding = "8px 20px";
    btn.style.fontSize = "16px";
    btn.style.background = "#a0452e";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.addEventListener("mouseenter", function () {
        if (!btn.disabled) btn.style.background = "#7d3623";
    });
    btn.addEventListener("mouseleave", function () {
        btn.style.background = "#a0452e";
    });
    btn.addEventListener("click", undoMove);
    buttonRow.appendChild(btn);
    undoButton = btn;
    setUndoEnabled(false);
}

// Toggles both the real disabled state (so a click while empty/mid-search
// can't even reach undoMove) and the visual cue -- disabled alone wouldn't
// show through here since the button already sets its own explicit
// background/color inline, overriding the browser's default dimming.
function setUndoEnabled(enabled) {
    if (!undoButton) return;
    undoButton.disabled = !enabled;
    undoButton.style.opacity = enabled ? "1" : "0.5";
    undoButton.style.cursor = enabled ? "pointer" : "not-allowed";
}

// Shows the AI's own search depth and evaluation from its last move — unlike
// the eval bar (instant static eval, no search), this reflects what the
// engine actually calculated. Updated from playAi2() itself (ai.js), since
// only it knows its own depth/score; stays blank until the AI has moved at
// least once.
function createSearchInfoLabel() {
    var label = document.createElement("div");
    label.style.textAlign = "center";
    label.style.color = "#ddd";
    label.style.fontFamily = "sans-serif";
    label.style.fontSize = "14px";
    label.style.minHeight = "1.2em"; // reserve its row's height before the AI's first move, so nothing else shifts when it fills in
    container.appendChild(label);
    searchInfoLabel = label;
}

function getAttackedPosition(boardPos, color) {
    return bbGetAttackedPosition(boardPos, color);
}

// Like getAttackedPosition, but reports which piece type is the cheapest
// attacker of just this one square (or None), via the same per-square scan
// isSquareAttacked below uses instead of a whole-board attack map. See
// bbSquareAttackerType's own comment for why King is checked last.
function squareAttackerType(boardPos, square, byColor) {
    return bbSquareAttackerType(boardPos, square, byColor);
}

// Like getAttackedPosition, but answers "is this one square attacked by
// byColor?" by scanning outward from `square` and stopping at the first
// piece found in each direction, instead of building an attack map for
// every square on the board. Used on the legality-check hot path, where
// getAttackedPosition's full-board scan was the dominant search cost.
function isSquareAttacked(boardPos, square, byColor) {
    return bbIsSquareAttacked(boardPos, square, byColor);
}

function showAttackedPosition(attPos) {
    for (let i = 0; i < 64; i++) {
        let tileTo = document.getElementById(i);
        if (attPos[i] != None) {
            tileTo.classList.add("BGRED");
        } else {
            tileTo.classList.remove("BGRED");
        }
    }
}

// Set once per getAllMoves/getAllCaptureMoves/getMoves call (see below),
// read by isMoveValid's fast path. Safe as module-level state because move
// generation in this codebase is always fully synchronous and depth-first —
// a given getAllMoves call completes and returns its whole move list before
// anything else (including a recursive search call one ply deeper) runs, so
// there's no way for two calls' cached values to interleave.
let currentKingInCheck = false;
let currentPinnedMap = null;

// For the side-to-move's king at kingPos: walks all 8 directions outward
// (same ray-walking bounds as isSquareAttacked/getAttackedPosition) looking
// for "one friendly piece, then an enemy slider of the matching type, with
// nothing else in between" — the classic absolute-pin pattern. For each
// pinned piece, records the full set of squares it may still move to
// (every square from the king outward through and including the pinner)
// without exposing the king.
function computePinnedPieces(boardPos, kingPos, kingColor) {
    return bbComputePinnedPieces(boardPos, kingPos, kingColor);
}

function isMoveValidForCastle(move, WKPos, BKPos, Bpos) {
    let kingPos;
    let color;
    if (((move.piece) & 24) == White) {
        kingPos = WKPos;
        color = Black;
    } else {
        kingPos = BKPos;
        color = White;
    }
    // King cannot castle out of check
    if (isSquareAttacked(Bpos, kingPos, color)) {
        return false;
    }
    // King cannot pass through an attacked square
    const intermediatePos = move.castleType === "s" ? move.pos + 1 : move.pos - 1;
    if (isSquareAttacked(Bpos, intermediatePos, color)) {
        return false;
    }
    return isMoveValid(move, WKPos, BKPos, Bpos);
}

function isMoveValid(move, WKPos, BKPos, Bpos) {
    // Fast path: if the king isn't currently in check, moving a piece that
    // isn't pinned can never expose it — skip simulating the move and
    // rescanning the board entirely. King moves, en passant (its rare
    // discovered-check-via-double-pawn-removal case), and pinned pieces
    // still need the full check below.
    if (!currentKingInCheck && ((move.piece) & 7) !== King && !move.isEnp && currentPinnedMap) {
        const allowed = currentPinnedMap.get(move.pos);
        if (!allowed) return true;
        return allowed.has(move.posTo);
    }

    // Slow path (king moves, en passant, pinned-piece moves, every move
    // while in check): answer "is my king attacked after this move?"
    // directly against bitboards, via a small per-move overlay -- no mailbox
    // clone, no full bitboard rebuild. See bbWouldBeAttackedAfterMove.
    let color;
    let kingPos;
    if (((move.piece) & 24) == White) {
        color = Black;
        kingPos = ((move.piece) & 7) == King ? move.posTo : WKPos;
    } else {
        color = White;
        kingPos = ((move.piece) & 7) == King ? move.posTo : BKPos;
    }
    return !bbWouldBeAttackedAfterMove(Bpos, move, kingPos, color);
}

function isChecked(kingPos, attPos) {
    if (attPos[kingPos] != None) {
        return true;
    }
    return false;
}

function moveToBoard(move, boardPos) {
    let newBoardPos = boardPos.slice();
    if (!move.isCastle && !move.isPromoted && !move.isEnp) {
        newBoardPos[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
        newBoardPos[move.posTo] = move.piece;
    } else if (move.isEnp) {
        newBoardPos[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
        newBoardPos[move.posTo] = move.piece;
        newBoardPos[move.enpTo] = ((None) | (None) | ((false) ? 32 : 0));
    } else if (move.isCastle) {
        if (move.castleType == "l") {
            newBoardPos[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
            newBoardPos[move.posTo] = move.piece;
            newBoardPos[move.posTo + 1] = newBoardPos[move.posTo - 2];
            newBoardPos[move.posTo - 2] = ((None) | (None) | ((false) ? 32 : 0));
        } else if (move.castleType == "s") {
            newBoardPos[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
            newBoardPos[move.posTo] = move.piece;
            newBoardPos[move.posTo - 1] = newBoardPos[move.posTo + 1];
            newBoardPos[move.posTo + 1] = ((None) | (None) | ((false) ? 32 : 0));
        }
    } else if (move.isPromoted == true) {
        newBoardPos[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
        newBoardPos[move.posTo] = move.promotedTo;
    }

    return newBoardPos;
}

// Shared placeholder for "this square is empty," reused everywhere makeMove
// vacates a square instead of recomputing it per move. `((None) | (// None) | ((false) ? 32 : 0))` reduces to plain `0`, same as `None` itself -- kept as a
// named alias purely for readability at vacate-a-square call sites.
const EMPTY_PIECE = ((None) | (None) | ((false) ? 32 : 0));

// A move is applied and unmade at most a few dozen plies deep in this
// engine's search (iterative deepening runs to depth 40, check extensions
// add up to 8 more, quiescence adds a bounded amount further bounded by
// remaining material) -- and makeMove/unmakeMove pairs are always strictly
// nested (SearchNode/SearchAllCapture's try/finally guarantees every
// makeMove's matching unmakeMove runs before the enclosing function
// returns, i.e. before any sibling move at the same or a shallower depth
// gets its own makeMove). That makes a depth-indexed pool of REUSED undo
// slots safe: makeMove never needs to allocate a fresh {squares,pieces}
// object and two arrays on every single move made during search, since the
// slot for a given depth is never "in use" by two calls at once. The pool
// grows on demand (no hard depth ceiling to misjudge and hit) but only
// needs to grow a handful of times per session -- after that, every slot at
// every depth actually reached gets reused for the rest of the game.
let makeMoveStackDepth = 0;
const undoPool = [];
function getUndoSlot(depth) {
    while (undoPool.length <= depth) {
        undoPool.push({
            squares: [0, 0, 0, 0], pieces: [null, null, null, null], count: 0,
            // Flat replay log of every (bitboard-bucket-reference, square) XOR
            // makeMove performed on board.__liveBB, in order. unmakeMove just
            // replays it -- XOR is its own inverse, so re-toggling the exact
            // same (bucket, square) pairs always restores the prior state,
            // regardless of which move-type branch produced them. 12 is the
            // worst case (castling: king + rook each touch piece/color/all at
            // 2 squares = 6 + 6).
            bbRefs: new Array(12), bbSquares: new Array(12), bbCount: 0,
        });
    }
    return undoPool[depth];
}

// Toggles bit `sq` in bitboard bucket `bb` (one of board.__liveBB's 15
// {lo,hi} buckets) and records the touch into `undo` so unmakeMove can
// replay it later.
function touchBB(undo, bb, sq) {
    if (sq < 32) bb.lo ^= (1 << sq);
    else bb.hi ^= (1 << (sq - 32));
    undo.bbRefs[undo.bbCount] = bb;
    undo.bbSquares[undo.bbCount] = sq;
    undo.bbCount++;
}

function colorOccupancyBB(liveBB, color) {
    return color === White ? liveBB.white : liveBB.black;
}

// Applies `move` to `board` IN PLACE (unlike moveToBoard, which clones) and
// returns an undo record that unmakeMove can use to restore `board` to its
// exact pre-move state. Used only by the search's make/unmake recursion
// (ai.js) -- move generation/isMoveValid keep using the clone-based
// moveToBoard above, since those simulate-then-discard a board and never
// need to undo anything.
//
// The undo record always snapshots board[sq] DIRECTLY (never move.piece /
// move.attPiece) before writing anything, because move.piece isn't a
// trustworthy record of "what was actually on this square before the move"
// for every move type: getKingMoves/getRookMoves (and their getcapture.js
// capture-only mirrors) set the piece's moved-bit up front, before
// generating any of that piece's moves (including castling), so move.piece
// for a king/rook move already reflects the moved-bit's value AFTER the
// move, not the square's true prior state. Reading the board directly
// sidesteps that uniformly, for every move type.
//
// Mirrors moveToBoard's four branches exactly, so behavior stays identical
// to the clone-based path -- including the same castling quirk moveToBoard
// already has: the relocated rook keeps its own prior isMoved value (never
// forced true), since castling rights are enforced entirely via the king's
// own isMoved.
function makeMove(move, board) {
    const undo = getUndoSlot(makeMoveStackDepth++);
    const bb = board.__liveBB;
    undo.bbCount = 0;
    if (!move.isCastle && !move.isPromoted && !move.isEnp) {
        undo.count = 2;
        undo.squares[0] = move.pos; undo.pieces[0] = board[move.pos];
        undo.squares[1] = move.posTo; undo.pieces[1] = board[move.posTo];
        board[move.pos] = EMPTY_PIECE;
        board[move.posTo] = move.piece;

        const moverPieceBB = bb.piece[((move.piece) & 24)][((move.piece) & 7)];
        const moverColorBB = colorOccupancyBB(bb, ((move.piece) & 24));
        touchBB(undo, moverPieceBB, move.pos);
        touchBB(undo, moverColorBB, move.pos);
        touchBB(undo, bb.all, move.pos);
        const captured = undo.pieces[1];
        if (((captured) & 7) !== None) {
            touchBB(undo, bb.piece[((captured) & 24)][((captured) & 7)], move.posTo);
            touchBB(undo, colorOccupancyBB(bb, ((captured) & 24)), move.posTo);
            touchBB(undo, bb.all, move.posTo);
        }
        touchBB(undo, moverPieceBB, move.posTo);
        touchBB(undo, moverColorBB, move.posTo);
        touchBB(undo, bb.all, move.posTo);
    } else if (move.isEnp) {
        undo.count = 3;
        undo.squares[0] = move.pos; undo.pieces[0] = board[move.pos];
        undo.squares[1] = move.posTo; undo.pieces[1] = board[move.posTo];
        undo.squares[2] = move.enpTo; undo.pieces[2] = board[move.enpTo];
        board[move.pos] = EMPTY_PIECE;
        board[move.posTo] = move.piece;
        board[move.enpTo] = EMPTY_PIECE;

        const moverPieceBB = bb.piece[((move.piece) & 24)][((move.piece) & 7)];
        const moverColorBB = colorOccupancyBB(bb, ((move.piece) & 24));
        touchBB(undo, moverPieceBB, move.pos);
        touchBB(undo, moverColorBB, move.pos);
        touchBB(undo, bb.all, move.pos);
        const captured = undo.pieces[2];
        touchBB(undo, bb.piece[((captured) & 24)][((captured) & 7)], move.enpTo);
        touchBB(undo, colorOccupancyBB(bb, ((captured) & 24)), move.enpTo);
        touchBB(undo, bb.all, move.enpTo);
        touchBB(undo, moverPieceBB, move.posTo);
        touchBB(undo, moverColorBB, move.posTo);
        touchBB(undo, bb.all, move.posTo);
    } else if (move.isCastle) {
        const rookFrom = move.castleType === "l" ? move.posTo - 2 : move.posTo + 1;
        const rookTo = move.castleType === "l" ? move.posTo + 1 : move.posTo - 1;
        undo.count = 4;
        undo.squares[0] = move.pos; undo.pieces[0] = board[move.pos];
        undo.squares[1] = move.posTo; undo.pieces[1] = board[move.posTo];
        undo.squares[2] = rookFrom; undo.pieces[2] = board[rookFrom];
        undo.squares[3] = rookTo; undo.pieces[3] = board[rookTo];
        board[move.pos] = EMPTY_PIECE;
        board[move.posTo] = move.piece;
        board[rookTo] = board[rookFrom];
        board[rookFrom] = EMPTY_PIECE;

        const colorBB = colorOccupancyBB(bb, ((move.piece) & 24));
        const kingPieceBB = bb.piece[((move.piece) & 24)][((move.piece) & 7)];
        touchBB(undo, kingPieceBB, move.pos);
        touchBB(undo, colorBB, move.pos);
        touchBB(undo, bb.all, move.pos);
        touchBB(undo, kingPieceBB, move.posTo);
        touchBB(undo, colorBB, move.posTo);
        touchBB(undo, bb.all, move.posTo);
        const rookPiece = undo.pieces[2];
        const rookPieceBB = bb.piece[((rookPiece) & 24)][((rookPiece) & 7)];
        touchBB(undo, rookPieceBB, rookFrom);
        touchBB(undo, colorBB, rookFrom);
        touchBB(undo, bb.all, rookFrom);
        touchBB(undo, rookPieceBB, rookTo);
        touchBB(undo, colorBB, rookTo);
        touchBB(undo, bb.all, rookTo);
    } else if (move.isPromoted == true) {
        undo.count = 2;
        undo.squares[0] = move.pos; undo.pieces[0] = board[move.pos];
        undo.squares[1] = move.posTo; undo.pieces[1] = board[move.posTo];
        board[move.pos] = EMPTY_PIECE;
        board[move.posTo] = move.promotedTo;

        const moverColorBB = colorOccupancyBB(bb, ((move.piece) & 24));
        touchBB(undo, bb.piece[((move.piece) & 24)][((move.piece) & 7)], move.pos);
        touchBB(undo, moverColorBB, move.pos);
        touchBB(undo, bb.all, move.pos);
        const captured = undo.pieces[1];
        if (((captured) & 7) !== None) {
            touchBB(undo, bb.piece[((captured) & 24)][((captured) & 7)], move.posTo);
            touchBB(undo, colorOccupancyBB(bb, ((captured) & 24)), move.posTo);
            touchBB(undo, bb.all, move.posTo);
        }
        touchBB(undo, bb.piece[((move.promotedTo) & 24)][((move.promotedTo) & 7)], move.posTo);
        touchBB(undo, moverColorBB, move.posTo);
        touchBB(undo, bb.all, move.posTo);
    }

    // Optional forward dependency on ai.js, same guarded pattern already
    // used by generatePieces's invalidateBitboardCache call: keeps this
    // file loadable standalone (onMakeMove simply won't exist if ai.js
    // hasn't loaded), while letting ai.js maintain its own incremental
    // material+PST+phase state (board.__liveEval) in lockstep with every
    // move, the same way __liveBB is maintained above.
    if (typeof onMakeMove === "function") onMakeMove(board, move);

    return undo;
}

// Restores `board` to exactly the state makeMove found it in, using the
// undo record makeMove returned. Pure dispatch -- every square touched by
// the move gets its pre-move reference written straight back, no
// recomputation, so there's nothing here that can derive a "close enough"
// wrong answer the way re-deriving from move.piece/move.attPiece could.
function unmakeMove(undo, board) {
    for (let i = 0; i < undo.count; i++) {
        board[undo.squares[i]] = undo.pieces[i];
    }
    for (let i = 0; i < undo.bbCount; i++) {
        const bucket = undo.bbRefs[i], sq = undo.bbSquares[i];
        if (sq < 32) bucket.lo ^= (1 << sq);
        else bucket.hi ^= (1 << (sq - 32));
    }
    // Mirrors the onMakeMove hook above -- called BEFORE the decrement so
    // makeMoveStackDepth still matches the value used by this same move's
    // onMakeMove call (see ai.js's liveEvalPool indexing).
    if (typeof onUnmakeMove === "function") onUnmakeMove(board);
    makeMoveStackDepth--;
}

function fileAt(pos) {
    return Math.floor(pos / 8) + 1;
}

function rankAt(pos) {
    return (pos % 8) + 1;
}

function diff(a, b) {
    return Math.abs(a - b);
}

function showPiece(boardPos) {
    for (let i = 0; i < boardPos.length; i++) {
        const pos = document.getElementById(i);
        pos.classList.remove("WhiteKing");
        pos.classList.remove("WhiteQueen");
        pos.classList.remove("WhiteRook");
        pos.classList.remove("WhiteKnight");
        pos.classList.remove("WhiteBishop");
        pos.classList.remove("WhitePawn");
        pos.classList.remove("BlackKing");
        pos.classList.remove("BlackQueen");
        pos.classList.remove("BlackRook");
        pos.classList.remove("BlackKnight");
        pos.classList.remove("BlackBishop");
        pos.classList.remove("BlackPawn");
        pos.removeAttribute("color");
        pos.removeAttribute("type");
        if (((boardPos[i]) & 24) == White) {
            if (((boardPos[i]) & 7) == King) {
                pos.classList.add("WhiteKing");
            } else if (((boardPos[i]) & 7) == Queen) {
                pos.classList.add("WhiteQueen");
            } else if (((boardPos[i]) & 7) == Rook) {
                pos.classList.add("WhiteRook");
            } else if (((boardPos[i]) & 7) == Knight) {
                pos.classList.add("WhiteKnight");
            } else if (((boardPos[i]) & 7) == Bishop) {
                pos.classList.add("WhiteBishop");
            } else if (((boardPos[i]) & 7) == Pawn) {
                pos.classList.add("WhitePawn");
            }
        } else if (((boardPos[i]) & 24) == Black) {
            if (((boardPos[i]) & 7) == King) {
                pos.classList.add("BlackKing");
            } else if (((boardPos[i]) & 7) == Queen) {
                pos.classList.add("BlackQueen");
            } else if (((boardPos[i]) & 7) == Rook) {
                pos.classList.add("BlackRook");
            } else if (((boardPos[i]) & 7) == Knight) {
                pos.classList.add("BlackKnight");
            } else if (((boardPos[i]) & 7) == Bishop) {
                pos.classList.add("BlackBishop");
            } else if (((boardPos[i]) & 7) == Pawn) {
                pos.classList.add("BlackPawn");
            }
        }
        pos.setAttribute("color", ((boardPos[i]) & 24));
        pos.setAttribute("type", ((boardPos[i]) & 7));
    }
}

function generatePieces(FEN) {
    // Guarded: chess.js's own top-level code calls generatePieces(defaultFEN)
    // before bitboard.js (loaded after chess.js) has defined this — harmless,
    // since nothing can have cached boardPosition's bitboards yet at that
    // first call anyway. Later calls (e.g. loading a new position) run after
    // bitboard.js exists and correctly invalidate any stale cache entry.
    if (typeof invalidateBitboardCache === "function") invalidateBitboardCache(boardPosition);
    let pos = 56;
    let flag = 0;
    for (i = 0; i < FEN.length; i++) {
        if (flag == 0) {
            if (FEN[i] == "K") {
                boardPosition[pos] = ((White) | (King) | ((false) ? 32 : 0));
                WhiteKingPos = pos;
                pos++;
                pieceCount++;
            } else if (FEN[i] == "Q") {
                boardPosition[pos] = ((White) | (Queen) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "R") {
                boardPosition[pos] = ((White) | (Rook) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "N") {
                boardPosition[pos] = ((White) | (Knight) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "B") {
                boardPosition[pos] = ((White) | (Bishop) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "P") {
                boardPosition[pos] = ((White) | (Pawn) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "k") {
                boardPosition[pos] = ((Black) | (King) | ((false) ? 32 : 0));
                BlackKingPos = pos;
                pos++;
                pieceCount++;
            } else if (FEN[i] == "q") {
                boardPosition[pos] = ((Black) | (Queen) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "r") {
                boardPosition[pos] = ((Black) | (Rook) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "n") {
                boardPosition[pos] = ((Black) | (Knight) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "b") {
                boardPosition[pos] = ((Black) | (Bishop) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "p") {
                boardPosition[pos] = ((Black) | (Pawn) | ((false) ? 32 : 0));
                pos++;
                pieceCount++;
            } else if (FEN[i] == "/") {
                pos -= 16;
            } else if (FEN[i] == " ") {
                flag = 1;
            } else {
                pos += FEN[i] - "0";
            }
        } else if (flag == 1) {
            if (FEN[i] == "w") {
                whiteToMove = true;
            } else if (FEN[i] == "b") {
                whiteToMove = false;
            } else if (FEN[i] == " ") {
                flag = 2;
            }
        }
    }
}

function getPawnMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos, lm) {
    let moveList = [];
    if (((piece) & 24) == White && color == White) {
        if (pos >= 8 && pos <= 15) {
            if (((boardPos[pos + 8]) & 7) == None) {
                let move = new Move(piece, pos, pos + 8, boardPos[pos + 8], false, null, false, null, false, null);
                if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                if (((boardPos[pos + 16]) & 7) == None) {
                    let move = new Move(piece, pos, pos + 16, boardPos[pos + 16], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        } else {
            if (pos + 8 <= 63) {
                if (((boardPos[pos + 8]) & 7) == None) {
                    let move = new Move(piece, pos, pos + 8, boardPos[pos + 8], false, null, false, null, false, null);
                    let move1;
                    let move2;
                    let move3;
                    let move4;
                    if (fileAt(pos + 8) == 8) {
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                            move.isPromoted = true;
                            move.promotedTo = ((White) | (Queen) | ((false) ? 32 : 0));
                            move1 = { ...move };
                            move.promotedTo = ((White) | (Rook) | ((false) ? 32 : 0));
                            move2 = { ...move };
                            move.promotedTo = ((White) | (Knight) | ((false) ? 32 : 0));
                            move3 = { ...move };
                            move.promotedTo = ((White) | (Bishop) | ((false) ? 32 : 0));
                            move4 = { ...move };
                            moveList.push(move1);
                            moveList.push(move2);
                            moveList.push(move3);
                            moveList.push(move4);
                        }
                    } else {
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
        if (testBit64(PAWN_ATTACKS[White][pos], pos + 7)) {
            if (((boardPos[pos + 7]) & 7) != None && ((boardPos[pos + 7]) & 24) == Black) {
                let move = new Move(piece, pos, pos + 7, boardPos[pos + 7], false, null, false, null, false, null);
                let move1;
                let move2;
                let move3;
                let move4;
                if (fileAt(pos + 7) == 8) {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                        move.isPromoted = true;
                        move.promotedTo = ((White) | (Queen) | ((false) ? 32 : 0));
                        move1 = { ...move };
                        move.promotedTo = ((White) | (Rook) | ((false) ? 32 : 0));
                        move2 = { ...move };
                        move.promotedTo = ((White) | (Knight) | ((false) ? 32 : 0));
                        move3 = { ...move };
                        move.promotedTo = ((White) | (Bishop) | ((false) ? 32 : 0));
                        move4 = { ...move };
                        moveList.push(move1);
                        moveList.push(move2);
                        moveList.push(move3);
                        moveList.push(move4);
                    }
                } else {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (testBit64(PAWN_ATTACKS[White][pos], pos + 9)) {
            if (((boardPos[pos + 9]) & 7) != None && ((boardPos[pos + 9]) & 24) == Black) {
                let move = new Move(piece, pos, pos + 9, boardPos[pos + 9], false, null, false, null, false, null);
                let move1;
                let move2;
                let move3;
                let move4;
                if (fileAt(pos + 9) == 8) {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                        move.isPromoted = true;
                        move.promotedTo = ((White) | (Queen) | ((false) ? 32 : 0));
                        move1 = { ...move };
                        move.promotedTo = ((White) | (Rook) | ((false) ? 32 : 0));
                        move2 = { ...move };
                        move.promotedTo = ((White) | (Knight) | ((false) ? 32 : 0));
                        move3 = { ...move };
                        move.promotedTo = ((White) | (Bishop) | ((false) ? 32 : 0));
                        move4 = { ...move };
                        moveList.push(move1);
                        moveList.push(move2);
                        moveList.push(move3);
                        moveList.push(move4);
                    }
                } else {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 32 && pos <= 39) {
            if (((lm.piece) & 24) == Black && ((lm.piece) & 7) == Pawn && lm.pos - lm.posTo == 16) {
                if (diff(rankAt(pos), rankAt(pos - 1)) == 1) {
                    if (lm.posTo == pos - 1) {
                        let move = new Move(piece, pos, pos + 7, boardPos[pos - 1], false, null, false, null, true, pos - 1);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
                if (diff(rankAt(pos), rankAt(pos + 1)) == 1) {
                    if (lm.posTo == pos + 1) {
                        let move = new Move(piece, pos, pos + 9, boardPos[pos + 1], false, null, false, null, true, pos + 1);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
    } else if (((piece) & 24) == Black && color == Black) {
        if (pos >= 48 && pos <= 55) {
            if (((boardPos[pos - 8]) & 7) == None) {
                let move = new Move(piece, pos, pos - 8, boardPos[pos - 8], false, null, false, null, false, null);
                if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                if (((boardPos[pos - 16]) & 7) == None) {
                    let move = new Move(piece, pos, pos - 16, boardPos[pos - 16], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        } else {
            if (pos - 8 >= 0) {
                if (((boardPos[pos - 8]) & 7) == None) {
                    let move = new Move(piece, pos, pos - 8, boardPos[pos - 8], false, null, false, null, false, null);
                    let move1;
                    let move2;
                    let move3;
                    let move4;
                    if (fileAt(pos - 8) == 1) {
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                            move.isPromoted = true;
                            move.promotedTo = ((Black) | (Queen) | ((false) ? 32 : 0));
                            move1 = { ...move };
                            move.promotedTo = ((Black) | (Rook) | ((false) ? 32 : 0));
                            move2 = { ...move };
                            move.promotedTo = ((Black) | (Knight) | ((false) ? 32 : 0));
                            move3 = { ...move };
                            move.promotedTo = ((Black) | (Bishop) | ((false) ? 32 : 0));
                            move4 = { ...move };
                            moveList.push(move1);
                            moveList.push(move2);
                            moveList.push(move3);
                            moveList.push(move4);
                        }
                    } else {
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
        if (testBit64(PAWN_ATTACKS[Black][pos], pos - 7)) {
            if (((boardPos[pos - 7]) & 7) != None && ((boardPos[pos - 7]) & 24) == White) {
                let move = new Move(piece, pos, pos - 7, boardPos[pos - 7], false, null, false, null, false, null);
                let move1;
                let move2;
                let move3;
                let move4;
                if (fileAt(pos - 7) == 1) {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                        move.isPromoted = true;
                        move.promotedTo = ((Black) | (Queen) | ((false) ? 32 : 0));
                        move1 = { ...move };
                        move.promotedTo = ((Black) | (Rook) | ((false) ? 32 : 0));
                        move2 = { ...move };
                        move.promotedTo = ((Black) | (Knight) | ((false) ? 32 : 0));
                        move3 = { ...move };
                        move.promotedTo = ((Black) | (Bishop) | ((false) ? 32 : 0));
                        move4 = { ...move };
                        moveList.push(move1);
                        moveList.push(move2);
                        moveList.push(move3);
                        moveList.push(move4);
                    }
                } else {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (testBit64(PAWN_ATTACKS[Black][pos], pos - 9)) {
            if (((boardPos[pos - 9]) & 7) != None && ((boardPos[pos - 9]) & 24) == White) {
                let move = new Move(piece, pos, pos - 9, boardPos[pos - 9], false, null, false, null, false, null);
                let move1;
                let move2;
                let move3;
                let move4;
                if (fileAt(pos - 9) == 1) {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                        move.isPromoted = true;
                        move.promotedTo = ((Black) | (Queen) | ((false) ? 32 : 0));
                        move1 = { ...move };
                        move.promotedTo = ((Black) | (Rook) | ((false) ? 32 : 0));
                        move2 = { ...move };
                        move.promotedTo = ((Black) | (Knight) | ((false) ? 32 : 0));
                        move3 = { ...move };
                        move.promotedTo = ((Black) | (Bishop) | ((false) ? 32 : 0));
                        move4 = { ...move };
                        moveList.push(move1);
                        moveList.push(move2);
                        moveList.push(move3);
                        moveList.push(move4);
                    }
                } else {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 24 && pos <= 31) {
            if (((lm.piece) & 24) == White && ((lm.piece) & 7) == Pawn && lm.pos - lm.posTo == -16) {
                if (diff(rankAt(pos), rankAt(pos - 1)) == 1) {
                    if (lm.posTo == pos - 1) {
                        let move = new Move(piece, pos, pos - 9, boardPos[pos - 1], false, null, false, null, true, pos - 1);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
                if (diff(rankAt(pos), rankAt(pos + 1)) == 1) {
                    if (lm.posTo == pos + 1) {
                        let move = new Move(piece, pos, pos - 7, boardPos[pos + 1], false, null, false, null, true, pos + 1);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
    }
    return moveList;
}

function getKnightMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos) {
    let moveList = [];

    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const ownOcc = ((piece) & 24) == White ? bb.white : bb.black;
        const destBB = andNot64(KNIGHT_ATTACKS[pos], ownOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getBishopMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos) {
    let moveList = [];

    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const ownOcc = ((piece) & 24) == White ? bb.white : bb.black;
        const destBB = andNot64(bishopAttacks(pos, bb.all), ownOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getRookMoves(pos, piece, color, boardPos, WKPos, BKPos) {
    let moveList = [];
    piece = ((((piece) & 24)) | (((piece) & 7)) | ((true) ? 32 : 0));

    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const ownOcc = ((piece) & 24) == White ? bb.white : bb.black;
        const destBB = andNot64(rookAttacks(pos, bb.all), ownOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getQueenMoves(pos, piece, color, boardPos, WKPos, BKPos) {
    let moveList = [];

    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const ownOcc = ((piece) & 24) == White ? bb.white : bb.black;
        const destBB = andNot64(queenAttacks(pos, bb.all), ownOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
        });
    }
    return moveList;
}

function getKingMoves(pos, piece, color, boardPos, WKPos, BKPos) {
    let moveList = [];
    piece = ((((piece) & 24)) | (((piece) & 7)) | ((true) ? 32 : 0));
    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const ownOcc = ((piece) & 24) == White ? bb.white : bb.black;
        const destBB = andNot64(KING_ATTACKS[pos], ownOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
        });
        if (pos == 4 && ((piece) & 24) == White) {
            if (((boardPos[0]) & 7) == Rook && ((boardPos[0]) & 24) == White) {
                if (((boardPos[1]) & 7) == None && ((boardPos[2]) & 7) == None && ((boardPos[3]) & 7) == None) {
                    if (!(((boardPos[0]) & 32) !== 0) && !(((boardPos[pos]) & 32) !== 0)) {
                        let move = new Move(piece, pos, 2, ((None) | (None) | ((false) ? 32 : 0)), true, "l", false, null, false, null);
                        if (isMoveValidForCastle(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
            if (((boardPos[7]) & 7) == Rook && ((boardPos[7]) & 24) == White) {
                if (((boardPos[5]) & 7) == None && ((boardPos[6]) & 7) == None) {
                    if (!(((boardPos[7]) & 32) !== 0) && !(((boardPos[pos]) & 32) !== 0)) {
                        let move = new Move(piece, pos, 6, ((None) | (None) | ((false) ? 32 : 0)), true, "s", false, null, false, null);
                        if (isMoveValidForCastle(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
        if (pos == 60 && ((piece) & 24) == Black) {
            if (((boardPos[56]) & 7) == Rook && ((boardPos[56]) & 24) == Black) {
                if (((boardPos[57]) & 7) == None && ((boardPos[58]) & 7) == None && ((boardPos[59]) & 7) == None) {
                    if (!(((boardPos[56]) & 32) !== 0) && !(((boardPos[pos]) & 32) !== 0)) {
                        let move = new Move(piece, pos, 58, ((None) | (None) | ((false) ? 32 : 0)), true, "l", false, null, false, null);
                        if (isMoveValidForCastle(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
            if (((boardPos[63]) & 7) == Rook && ((boardPos[63]) & 24) == Black) {
                if (((boardPos[61]) & 7) == None && ((boardPos[62]) & 7) == None) {
                    if (!(((boardPos[63]) & 32) !== 0) && !(((boardPos[pos]) & 32) !== 0)) {
                        let move = new Move(piece, pos, 62, ((None) | (None) | ((false) ? 32 : 0)), true, "s", false, null, false, null);
                        if (isMoveValidForCastle(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
    }

    return moveList;
}

function getMoves(pos, piece) {
    let color;
    if (whiteToMove) {
        color = White;
    } else {
        color = Black;
    }

    const ownKingPos = whiteToMove ? WhiteKingPos : BlackKingPos;
    const enemyColor = whiteToMove ? Black : White;
    currentKingInCheck = isSquareAttacked(boardPosition, ownKingPos, enemyColor);
    currentPinnedMap = currentKingInCheck ? null : computePinnedPieces(boardPosition, ownKingPos, color);

    let moveList = [];
    if (((piece) & 7) == Pawn) {
        moveList = moveList.concat(getPawnMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos, lastMove));
    } else if (((piece) & 7) == Bishop) {
        moveList = moveList.concat(getBishopMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos));
    } else if (((piece) & 7) == Rook) {
        moveList = moveList.concat(getRookMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos));
    } else if (((piece) & 7) == Queen) {
        moveList = moveList.concat(getQueenMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos));
    } else if (((piece) & 7) == King) {
        moveList = moveList.concat(getKingMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos));
    } else if (((piece) & 7) == Knight) {
        moveList = moveList.concat(getKnightMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos));
    }
    return moveList;
}

function removeShowedMove() {
    for (let i = 0; i < 64; i++) {
        tile = document.getElementById(i);
        tile.classList.remove("moveList");
        tile.classList.remove("moveListCapture");
        tile.classList.remove("lightClicked");
        tile.classList.remove("darkClicked");
        tile.classList.remove("clicked");
        while (tile.hasChildNodes()) {
            tile.removeChild(tile.children[0]);
        }
    }
}

function removeShowedMove2() {
    for (let i = 0; i < 64; i++) {
        tile = document.getElementById(i);
        tile.classList.remove("lightClicked2");
        tile.classList.remove("darkClicked2");
        while (tile.hasChildNodes()) {
            tile.removeChild(tile.children[0]);
        }
    }
}

function removeEventListener() {
    for (let i = 0; i < 64; i++) {
        tile = document.getElementById(i);
        tile.removeEventListener("mousedown", showedMoveClicked);
        tile.removeAttribute("moveIndex");
    }
}

function showGameOver(msg) {
    gameOver = true;
    var overlay = document.createElement("div");
    overlay.className = "game-over-overlay";
    var box = document.createElement("div");
    box.className = "game-over-box";
    var text = document.createElement("p");
    text.textContent = msg;
    var btn = document.createElement("button");
    btn.textContent = "New Game";
    btn.addEventListener("click", function () { location.reload(); });
    box.appendChild(text);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function squareColor(sq) {
    return (Math.floor(sq / 8) + sq % 8) % 2;
}

function checkInsufficientMaterial() {
    var whitePieces = [];
    var blackPieces = [];
    for (var i = 0; i < 64; i++) {
        if (((boardPosition[i]) & 24) == White && ((boardPosition[i]) & 7) != None) {
            whitePieces.push({ type: ((boardPosition[i]) & 7), sq: i });
        } else if (((boardPosition[i]) & 24) == Black && ((boardPosition[i]) & 7) != None) {
            blackPieces.push({ type: ((boardPosition[i]) & 7), sq: i });
        }
    }
    // K vs K
    if (whitePieces.length == 1 && blackPieces.length == 1) return true;
    // K+minor vs K
    if (whitePieces.length == 2 && blackPieces.length == 1) {
        var minor = whitePieces.find(function (p) { return p.type != King; });
        if (minor.type == Bishop || minor.type == Knight) return true;
    }
    if (blackPieces.length == 2 && whitePieces.length == 1) {
        var minor = blackPieces.find(function (p) { return p.type != King; });
        if (minor.type == Bishop || minor.type == Knight) return true;
    }
    // K+B vs K+B same square color
    if (whitePieces.length == 2 && blackPieces.length == 2) {
        var wb = whitePieces.find(function (p) { return p.type == Bishop; });
        var bb = blackPieces.find(function (p) { return p.type == Bishop; });
        if (wb && bb && squareColor(wb.sq) === squareColor(bb.sq)) return true;
    }
    return false;
}

// Root-splitting parallel search: book moves are checked directly here
// (instant, no worker needed); otherwise the full legal root-move list is
// generated once (main thread) and split round-robin across the worker
// pool, so each worker gets a representative mix of promising/weak moves
// rather than one worker getting every competitive candidate. Each worker
// runs its own full independent search (playAi2 with options.rootMoveSubset,
// ai.js) against a shared wall-clock deadline; once all respond, the best
// result is picked from the SIDE-TO-MOVE'S perspective -- lastSearchScore is
// always normalized to White's perspective (see ai.js), so this must take
// the max when White is to move but the min when Black is, never a raw
// cross-worker max.
// Dispatches one round of root-move-subset searches, one message per
// non-empty subset, to the matching pool worker -- exactly the request
// shape/wiring requestAiMove always used before it could dispatch more than
// one round. pendingAiRejects/worker.onerror are set up once per worker at
// pool-creation time (see the aiWorkerPool loop below) and already tolerate
// being paired with any number of requests to the same worker over time, so
// nothing new is needed there for a second round.
function dispatchSearchRound(subsets, deadline, hardDeadline) {
    const requests = [];
    for (let i = 0; i < subsets.length; i++) {
        if (subsets[i].length === 0) continue;
        const worker = aiWorkerPool[i];
        requests.push(
            new Promise((resolve, reject) => {
                pendingAiRejects[i] = reject;
                worker.onmessage = function (e) {
                    pendingAiRejects[i] = null;
                    resolve(e.data);
                };
                worker.postMessage({
                    boardPosition, whiteToMove, lastMove, WhiteKingPos, BlackKingPos, pieceCount, positionHistory,
                    rootMoveSubset: subsets[i], deadline, hardDeadline,
                });
            })
        );
    }
    return Promise.all(requests);
}

// Reduces one round's per-worker results down to a single best move, by
// whichever worker saw the best score oriented to the side to move --
// exactly today's reduction, just reusable across as many rounds as
// requestAiMove ends up dispatching.
function pickBestResult(results) {
    let best = null;
    let bestOriented = -Infinity;
    let maxTimeMs = 0;
    // Root-splitting: each worker searched a disjoint slice of the root
    // move list to its own full depth, so the total work behind this move
    // is the SUM across the pool, not just whichever worker's slice
    // happened to contain the best move.
    let totalNodes = 0;
    for (const r of results) {
        if (r.lastSearchTimeMs > maxTimeMs) maxTimeMs = r.lastSearchTimeMs;
        totalNodes += r.lastSearchNodes || 0;
        if (!r.move) continue;
        const oriented = whiteToMove ? r.lastSearchScore : -r.lastSearchScore;
        if (best === null || oriented > bestOriented) {
            best = r;
            bestOriented = oriented;
        }
    }
    if (best === null) {
        return { move: null, lastSearchDepth: 0, lastSearchScore: null, lastSearchTimeMs: maxTimeMs, lastSearchNodes: totalNodes };
    }
    return { move: best.move, lastSearchDepth: best.lastSearchDepth, lastSearchScore: best.lastSearchScore, lastSearchTimeMs: maxTimeMs, lastSearchNodes: totalNodes };
}

// Below this much remaining room before the hard ceiling, a second round
// couldn't get meaningfully deeper than the first before hitting the same
// wall again -- not worth the round-trip.
const MIN_EXTENSION_MS = 500;

function requestAiMove() {
    const bookMove = getBookMove(boardPosition, whiteToMove, lastMove, WhiteKingPos, BlackKingPos);
    if (bookMove) {
        return Promise.resolve({ move: bookMove, lastSearchDepth: 0, lastSearchScore: null, lastSearchTimeMs: 0, lastSearchNodes: 0 });
    }

    const color = whiteToMove ? Black : White;
    const rootMoves = sortMoves(
        getAllMoves(whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos),
        boardPosition,
        color,
        null
    );

    // Exactly one legal move -- nothing to compare it against, so there's
    // nothing a search could change about the decision. playAi2's own
    // analogous shortcut (ai.js: `!usingSubset && rootMoves.length <= 1`)
    // never fires in real play, since every dispatch below always hands a
    // rootMoveSubset to every worker -- this is the orchestrator-level
    // equivalent, same shape as the book-move check just above.
    if (rootMoves.length === 1) {
        return Promise.resolve({ move: rootMoves[0], lastSearchDepth: 0, lastSearchScore: null, lastSearchTimeMs: 0, lastSearchNodes: 0 });
    }

    const workerCount = aiWorkerPool.length;
    const subsets = [];
    for (let i = 0; i < workerCount; i++) subsets.push([]);
    for (let i = 0; i < rootMoves.length; i++) subsets[i % workerCount].push(rootMoves[i]);

    const requestStart = Date.now();
    const deadline = requestStart + AI_BASE_TIME_MS;
    const hardDeadline = requestStart + AI_MAX_TIME_MS;

    // Each playAi2() call times itself from its OWN call-local
    // searchStartTime (ai.js), so a worker's reported lastSearchTimeMs only
    // ever reflects that one call's own duration -- for a round-2 dispatch,
    // that's just round 2's stretch of time, not the cumulative wait since
    // this function was first called. Overriding it here with the true
    // elapsed time since requestStart, at whichever round actually produces
    // the final answer, is what the UI (chess.js's playAiTurn -> ai.js's
    // updateSearchInfo) should be showing the user.
    function finalizeResult(result) {
        result.lastSearchTimeMs = Date.now() - requestStart;
        return result;
    }

    return dispatchSearchRound(subsets, deadline, hardDeadline).then((round1Results) => {
        const unstable = round1Results.some((r) => r && r.lastSearchUnstable);
        const remaining = hardDeadline - Date.now();
        if (!unstable || remaining < MIN_EXTENSION_MS) {
            return finalizeResult(pickBestResult(round1Results));
        }
        // The position looked unsettled somewhere in the pool right as
        // workers hit their base budget -- give everyone (same subsets, so
        // each keeps building on its own now-warm transposition table
        // instead of having its progress reshuffled to a different worker)
        // the rest of the room up to AI_MAX_TIME_MS before actually
        // committing to a move. This is the orchestrator-level replacement
        // for playAi2's own per-worker instability extension, which never
        // fires here since every dispatch always provides a
        // rootMoveSubset -- see playAi2's `!usingSubset` gate on that logic
        // and lastSearchUnstable's unconditional counterpart.
        return dispatchSearchRound(subsets, hardDeadline, hardDeadline).then(pickBestResult).then(finalizeResult);
    });
}

// Shared by every AI-turn trigger point (movePiece's own two branches,
// playAsBlack's opening move, AivsAi's loop). Resets aiThinking even if the
// worker errors -- without this, an uncaught worker exception would leave
// aiThinking stuck true forever, permanently freezing board input.
async function playAiTurn() {
    aiThinking = true;
    try {
        const result = await requestAiMove();
        lastSearchDepth = result.lastSearchDepth;
        lastSearchScore = result.lastSearchScore;
        lastSearchTimeMs = result.lastSearchTimeMs;
        lastSearchNodes = result.lastSearchNodes;
        updateSearchInfo();
        updateEvalBar(lastSearchScore);
        aiThinking = false;
        if (result.move) {
            await movePiece(result.move);
        }
    } catch (err) {
        aiThinking = false;
        console.error("AI move request failed:", err);
    }
}

// Square name for SAN purposes -- deliberately not reusing the existing
// fileAt/rankAt helpers above, since (despite their names) fileAt actually
// returns the RANK number and rankAt returns the FILE number; writing a
// fresh, unambiguous helper here avoids inheriting that confusion.
function sqName(sq) {
    return "abcdefgh"[sq % 8] + (Math.floor(sq / 8) + 1);
}

const SAN_PIECE_LETTERS = {};
SAN_PIECE_LETTERS[Knight] = "N";
SAN_PIECE_LETTERS[Bishop] = "B";
SAN_PIECE_LETTERS[Rook] = "R";
SAN_PIECE_LETTERS[Queen] = "Q";
SAN_PIECE_LETTERS[King] = "K";

// Standard algebraic notation for one already-decided move. `preMoveLegal`
// is the full legal move list for the moving side computed BEFORE this
// move is applied (needed for disambiguation -- "is there another piece of
// the same type that could also have reached this square"); `givesCheck`/
// `isMate` describe the position AFTER the move, for the +/# suffix.
function moveToSAN(move, preMoveLegal, givesCheck, isMate) {
    let san;
    if (move.isCastle) {
        san = move.castleType === "s" ? "O-O" : "O-O-O";
    } else {
        const type = (move.piece) & 7;
        const color = (move.piece) & 24;
        const isCapture = ((move.attPiece) & 7) !== None || move.isEnp;
        san = "";
        if (type === Pawn) {
            if (isCapture) san += "abcdefgh"[move.pos % 8] + "x";
        } else {
            san += SAN_PIECE_LETTERS[type];
            // Disambiguation: another same-type, same-color piece that
            // could also legally reach this exact destination needs its
            // origin file/rank (or both) spelled out -- the standard SAN
            // rule, checked in that preference order.
            const others = preMoveLegal.filter(
                (m) => m.pos !== move.pos && ((m.piece) & 7) === type && ((m.piece) & 24) === color && m.posTo === move.posTo
            );
            if (others.length > 0) {
                const sameFile = others.some((m) => m.pos % 8 === move.pos % 8);
                const sameRank = others.some((m) => Math.floor(m.pos / 8) === Math.floor(move.pos / 8));
                if (!sameFile) san += "abcdefgh"[move.pos % 8];
                else if (!sameRank) san += String(Math.floor(move.pos / 8) + 1);
                else san += sqName(move.pos);
            }
            if (isCapture) san += "x";
        }
        san += sqName(move.posTo);
        if (move.isPromoted) san += "=" + SAN_PIECE_LETTERS[(move.promotedTo) & 7];
    }
    if (isMate) san += "#";
    else if (givesCheck) san += "+";
    return san;
}

function renderMoveHistory() {
    if (!moveHistoryPanel) return;
    while (moveHistoryPanel.hasChildNodes()) moveHistoryPanel.removeChild(moveHistoryPanel.children[0]);
    for (let i = 0; i < moveHistorySAN.length; i += 2) {
        const row = document.createElement("div");
        row.className = "move-history-row";
        const num = document.createElement("span");
        num.className = "move-history-num";
        num.textContent = i / 2 + 1 + ".";
        row.appendChild(num);
        const whiteMove = document.createElement("span");
        whiteMove.className = "move-history-move";
        whiteMove.textContent = moveHistorySAN[i];
        row.appendChild(whiteMove);
        if (i + 1 < moveHistorySAN.length) {
            const blackMove = document.createElement("span");
            blackMove.className = "move-history-move";
            blackMove.textContent = moveHistorySAN[i + 1];
            row.appendChild(blackMove);
        }
        moveHistoryPanel.appendChild(row);
    }
    moveHistoryPanel.scrollTop = moveHistoryPanel.scrollHeight;
}

function createMoveHistoryPanel() {
    const panel = document.createElement("div");
    panel.className = "move-history";
    gameRow.appendChild(panel);
    moveHistoryPanel = panel;
    renderMoveHistory();
}

async function movePiece(move) {
    if (gameOver) return;
    undoStack.push({
        boardPosition: boardPosition.slice(),
        whiteToMove: whiteToMove,
        lastMove: lastMove,
        WhiteKingPos: WhiteKingPos,
        BlackKingPos: BlackKingPos,
        pieceCount: pieceCount,
        halfMoveClock: halfMoveClock,
        positionHistory: new Map(positionHistory),
        moveCntr: moveCntr,
    });
    setUndoEnabled(true);
    // Full legal move list for the moving side, BEFORE the move is applied
    // -- needed for SAN disambiguation (moveToSAN below), which has to
    // know what else could have reached this same destination.
    const preMoveLegalForSAN = getAllMoves(whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos);
    const movedColorWasWhite = whiteToMove;
    invalidateBitboardCache(boardPosition);
    if (!move.isCastle && !move.isPromoted && !move.isEnp) {
        boardPosition[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
        boardPosition[move.posTo] = move.piece;
    } else if (move.isEnp) {
        boardPosition[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
        boardPosition[move.posTo] = move.piece;
        boardPosition[move.enpTo] = ((None) | (None) | ((false) ? 32 : 0));
    } else if (move.isCastle) {
        if (move.castleType == "l") {
            boardPosition[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
            boardPosition[move.posTo] = move.piece;
            boardPosition[move.posTo + 1] = boardPosition[move.posTo - 2];
            boardPosition[move.posTo - 2] = ((None) | (None) | ((false) ? 32 : 0));
        } else if (move.castleType == "s") {
            boardPosition[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
            boardPosition[move.posTo] = move.piece;
            boardPosition[move.posTo - 1] = boardPosition[move.posTo + 1];
            boardPosition[move.posTo + 1] = ((None) | (None) | ((false) ? 32 : 0));
        }
    } else if (move.isPromoted == true) {
        boardPosition[move.pos] = ((None) | (None) | ((false) ? 32 : 0));
        boardPosition[move.posTo] = move.promotedTo;
    }
    if (((move.attPiece) & 7) != None) {
        pieceCount--;
    }
    if (whiteToMove) {
        whiteToMove = false;
    } else {
        whiteToMove = true;
    }
    lastMove = move;
    if (((move.piece) & 7) == King) {
        if (((move.piece) & 24) == Black) {
            BlackKingPos = move.posTo;
        } else {
            WhiteKingPos = move.posTo;
        }
    }

    // Computed once here and reused both for this move's SAN +/# suffix
    // (right below) and by the checkmate/stalemate check further down --
    // previously that block recomputed getAllMoves/getAttackedPosition/
    // isChecked itself; this is the same work, just done once.
    const legalMoves = getAllMoves(whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos);
    const attPosForCheck = getAttackedPosition(boardPosition, movedColorWasWhite ? White : Black);
    const opponentKingPos = whiteToMove ? WhiteKingPos : BlackKingPos;
    const givesCheck = isChecked(opponentKingPos, attPosForCheck);
    moveHistorySAN.push(moveToSAN(move, preMoveLegalForSAN, givesCheck, legalMoves.length === 0));
    renderMoveHistory();

    removeShowedMove2();
    let tile = document.getElementById(move.pos);
    let tileTo = document.getElementById(move.posTo);
    if (tile.getAttribute("tilecolor") == "dark") {
        tile.classList.add("darkClicked2");
    } else {
        tile.classList.add("lightClicked2");
    }
    if (tileTo.getAttribute("tilecolor") == "dark") {
        tileTo.classList.add("darkClicked2");
    } else {
        tileTo.classList.add("lightClicked2");
    }
    showPiece(boardPosition);
    await sleep(10);

    // Half-move clock: reset on any pawn move or capture, else increment
    if (((move.piece) & 7) === Pawn || ((move.attPiece) & 7) !== None || move.isEnp) {
        halfMoveClock = 0;
    } else {
        halfMoveClock++;
    }

    // 50-move rule (100 half-moves = 50 full moves each side)
    if (halfMoveClock >= 100) {
        showGameOver("Draw by 50-move rule");
        return;
    }

    // Threefold repetition — uses the Zobrist hash already computed for the TT
    var posHash = computeHash(boardPosition, whiteToMove);
    var repCount = (positionHistory.get(posHash) || 0) + 1;
    positionHistory.set(posHash, repCount);
    if (repCount >= 3) {
        showGameOver("Draw by threefold repetition");
        return;
    }

    // Insufficient material
    if (checkInsufficientMaterial()) {
        showGameOver("Draw by insufficient material");
        return;
    }

    // Checkmate / stalemate: legalMoves/givesCheck already computed above
    // (for the SAN suffix) and reused here rather than recomputed.
    if (legalMoves.length === 0) {
        if (givesCheck) {
            showGameOver("Checkmate — " + (whiteToMove ? "Black" : "White") + " wins!");
        } else {
            showGameOver("Stalemate — Draw");
        }
        return;
    }

    moveCntr++;
    if (playAsW && !whiteToMove) {
        await playAiTurn();
    } else if (playAsB && whiteToMove) {
        await playAiTurn();
    } else {
        // Genuinely the human's turn again -- either this call just applied
        // the AI's own reply (reached via the recursive movePiece call
        // inside playAiTurn above), or there's no AI turn to hand off to at
        // all. Any premove selection highlight left over from choosing
        // during the AI's think time is now stale (computed against the
        // pre-reply board) and gets cleared regardless of outcome; a
        // CONFIRMED premove gets its real, only legality check here.
        clearPremoveSelectionHighlight();
        await tryFirePremove();
    }
    removeEventListener();
}

function undoMove() {
    if (aiThinking || undoStack.length === 0) return;
    // A player's move is always immediately followed by the AI's reply --
    // movePiece awaits playAiTurn to completion before control ever returns
    // to the UI -- so whenever this button is actually clickable, the top
    // of the stack is normally the AI's just-played reply, with the
    // position right before the player's own move sitting one entry
    // beneath it. Discard the top one and restore the one under it, so
    // Undo takes back the whole exchange and lands back on the player's
    // turn, rather than on the single ply where the AI just hasn't
    // answered yet. The one leftover case (a single entry) is the AI's own
    // opening move in a playAsBlack game, before the player has moved at
    // all -- restoring that just resets to the starting position.
    if (undoStack.length >= 2) undoStack.pop();
    restoreSnapshot(undoStack.pop());
}

function restoreSnapshot(snap) {
    boardPosition = snap.boardPosition;
    whiteToMove = snap.whiteToMove;
    lastMove = snap.lastMove;
    WhiteKingPos = snap.WhiteKingPos;
    BlackKingPos = snap.BlackKingPos;
    pieceCount = snap.pieceCount;
    halfMoveClock = snap.halfMoveClock;
    positionHistory = snap.positionHistory;
    moveCntr = snap.moveCntr;
    gameOver = false;
    invalidateBitboardCache(boardPosition);

    var overlay = document.querySelector(".game-over-overlay");
    if (overlay) overlay.remove();

    removeShowedMove();
    removeShowedMove2();
    removeEventListener();
    nextMoves = [];
    showPiece(boardPosition);
    setUndoEnabled(undoStack.length > 0);
    // moveHistorySAN grows in exact lockstep with undoStack (see its
    // declaration) -- truncating to the same length undoes the same moves.
    moveHistorySAN.length = undoStack.length;
    renderMoveHistory();

    // Re-apply the "last move" highlight for whichever move is now on top,
    // exactly like movePiece does right after applying a move -- or leave
    // the board unmarked if this undo rewound all the way to the start.
    if (lastMove.piece !== None) {
        var tile = document.getElementById(lastMove.pos);
        var tileTo = document.getElementById(lastMove.posTo);
        tile.classList.add(tile.getAttribute("tilecolor") == "dark" ? "darkClicked2" : "lightClicked2");
        tileTo.classList.add(tileTo.getAttribute("tilecolor") == "dark" ? "darkClicked2" : "lightClicked2");
    }
}

function showedMoveClicked(e) {
    if (gameOver || aiThinking) return;
    if (e.button == 0) {
        let moveIndex = this.getAttribute("moveindex");
        let move = nextMoves[moveIndex];
        if (move.isPromoted == true) {
            if (fileAt(move.posTo) == 8) {
                let tileTo = document.getElementById(move.posTo);
                let menu = document.createElement("div");
                let btnQueen = document.createElement("div");
                btnQueen.classList.add("WhiteQueenMenu");
                btnQueen.style.width = "75px";
                btnQueen.style.height = "75px";
                btnQueen.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = ((White) | (Queen) | ((false) ? 32 : 0));
                        movePiece(move);
                    }
                });
                let btnKnight = document.createElement("div");
                btnKnight.classList.add("WhiteKnightMenu");
                btnKnight.style.width = "75px";
                btnKnight.style.height = "75px";
                btnKnight.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = ((White) | (Knight) | ((false) ? 32 : 0));
                        movePiece(move);
                    }
                });
                let btnBishop = document.createElement("div");
                btnBishop.classList.add("WhiteBishopMenu");
                btnBishop.style.width = "75px";
                btnBishop.style.height = "75px";
                btnBishop.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = ((White) | (Bishop) | ((false) ? 32 : 0));
                        movePiece(move);
                    }
                });
                let btnRook = document.createElement("div");
                btnRook.classList.add("WhiteRookMenu");
                btnRook.style.width = "75px";
                btnRook.style.height = "75px";
                btnRook.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = ((White) | (Rook) | ((false) ? 32 : 0));
                        movePiece(move);
                    }
                });
                let btnClose = document.createElement("div");
                btnClose.style.width = "75px";
                btnClose.style.height = "50px";
                btnClose.style.display = "flex";
                btnClose.style.background = "#fff";
                btnClose.style.fontSize = "30px";
                btnClose.style.justifyContent = "center";
                btnClose.style.alignItems = "center";
                btnClose.style.cursor = "pointer";
                btnClose.innerHTML = "&#10006;";
                btnClose.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        while (tileTo.hasChildNodes()) {
                            tileTo.removeChild(tileTo.children[0]);
                        }
                    }
                });
                menu.style.width = "75px";
                menu.style.height = "450px";
                menu.style.display = "flex";
                menu.style.flexWrap = "wrap";
                menu.style.justifyContent = "center";
                menu.style.background = "#fff";
                menu.style.position = "absolute";
                menu.style.zIndex = "1";
                menu.style.top = "0";
                menu.appendChild(btnQueen);
                menu.appendChild(btnKnight);
                menu.appendChild(btnRook);
                menu.appendChild(btnBishop);
                menu.appendChild(btnClose);
                tileTo.appendChild(menu);
            } else if (fileAt(move.posTo) == 1) {
                let tileTo = document.getElementById(move.posTo);
                let menu = document.createElement("div");
                let btnQueen = document.createElement("div");
                btnQueen.classList.add("BlackQueenMenu");
                btnQueen.style.width = "75px";
                btnQueen.style.height = "75px";
                btnQueen.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = ((Black) | (Queen) | ((false) ? 32 : 0));
                        movePiece(move);
                    }
                });
                let btnKnight = document.createElement("div");
                btnKnight.classList.add("BlackKnightMenu");
                btnKnight.style.width = "75px";
                btnKnight.style.height = "75px";
                btnKnight.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = ((Black) | (Knight) | ((false) ? 32 : 0));
                        movePiece(move);
                    }
                });
                let btnBishop = document.createElement("div");
                btnBishop.classList.add("BlackBishopMenu");
                btnBishop.style.width = "75px";
                btnBishop.style.height = "75px";
                btnBishop.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = ((Black) | (Bishop) | ((false) ? 32 : 0));
                        movePiece(move);
                    }
                });
                let btnRook = document.createElement("div");
                btnRook.classList.add("BlackRookMenu");
                btnRook.style.width = "75px";
                btnRook.style.height = "75px";
                btnRook.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = ((Black) | (Rook) | ((false) ? 32 : 0));
                        movePiece(move);
                    }
                });
                let btnClose = document.createElement("div");
                btnClose.style.width = "75px";
                btnClose.style.height = "50px";
                btnClose.style.display = "flex";
                btnClose.style.background = "#fff";
                btnClose.style.fontSize = "30px";
                btnClose.style.justifyContent = "center";
                btnClose.style.alignItems = "center";
                btnClose.style.cursor = "pointer";
                btnClose.innerHTML = "&#10006;";
                btnClose.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        while (tileTo.hasChildNodes()) {
                            tileTo.removeChild(tileTo.children[0]);
                        }
                    }
                });
                menu.style.width = "75px";
                menu.style.height = "450px";
                menu.style.display = "flex";
                menu.style.flexWrap = "wrap";
                menu.style.justifyContent = "center";
                menu.style.background = "#fff";
                menu.style.position = "absolute";
                menu.style.zIndex = "1";
                menu.style.bottom = "0";
                menu.appendChild(btnClose);
                menu.appendChild(btnBishop);
                menu.appendChild(btnRook);
                menu.appendChild(btnKnight);
                menu.appendChild(btnQueen);
                tileTo.appendChild(menu);
            }
        } else {
            movePiece(move);
        }
    }
}

function showMoveList(moveList) {
    let moveIndex = 0;
    moveList.forEach((move) => {
        let pos = document.getElementById(move.posTo);
        if (move.isEnp) {
            pos.classList.add("moveList");
        } else if (((move.attPiece) & 7) == None) {
            pos.classList.add("moveList");
        } else {
            pos.classList.add("moveListCapture");
        }
        pos.setAttribute("moveIndex", moveIndex);
        pos.addEventListener("mousedown", showedMoveClicked);
        moveIndex++;
    });
}

// Clears the transient "piece selected, choosing a premove target" state
// and its highlight -- NOT the confirmed pendingPremove (see clearPremove
// for that). Safe to call whether or not a selection is actually open.
function clearPremoveSelectionHighlight() {
    if (premoveSelectedSquare !== null) {
        document.getElementById(premoveSelectedSquare).classList.remove("premoveSelected");
    }
    for (const m of premoveCandidates) {
        const t = document.getElementById(m.posTo);
        t.classList.remove("premoveTarget");
        t.classList.remove("premoveTargetCapture");
    }
    premoveSelectedSquare = null;
    premoveCandidates = [];
}

function armPremove(pos, posTo, promotedType) {
    pendingPremove = { pos: pos, posTo: posTo, promotedType: promotedType };
    document.getElementById(pos).classList.add("premoveArmed");
    document.getElementById(posTo).classList.add("premoveArmed");
}

// Clears a CONFIRMED, queued premove and its highlight. Safe to call when
// there isn't one.
function clearPremove() {
    if (pendingPremove === null) return;
    document.getElementById(pendingPremove.pos).classList.remove("premoveArmed");
    document.getElementById(pendingPremove.posTo).classList.remove("premoveArmed");
    pendingPremove = null;
}

// Routes every board click while the AI is thinking. Kept entirely
// separate from the live-turn selection logic below (showMove's own
// listener body) rather than branching inside it -- lower risk to the
// already-working move flow, since that logic is now only ever reachable
// when aiThinking is false.
function handlePremoveClick(pcs, i) {
    // Confirm: clicking one of the currently-selected piece's highlighted
    // candidate squares.
    if (premoveSelectedSquare !== null && (pcs.classList.contains("premoveTarget") || pcs.classList.contains("premoveTargetCapture"))) {
        const candidates = premoveCandidates.filter((m) => m.posTo === i);
        if (candidates.length > 0) {
            // Promotions: getAllMoves hands back 4 variants (Q/R/B/N) for
            // the same (pos,posTo) -- premove always auto-queens, same as
            // chess.com, rather than showing a piece-picker mid-premove
            // (which would defeat the point of premoving instantly).
            const chosen = candidates.find((m) => !m.isPromoted) || candidates.find((m) => ((m.promotedTo) & 7) === Queen) || candidates[0];
            clearPremoveSelectionHighlight();
            armPremove(chosen.pos, chosen.posTo, chosen.isPromoted ? (chosen.promotedTo) & 7 : null);
        }
        return;
    }
    // Cancel: clicking the already-armed premove's own "from" square again.
    if (pendingPremove !== null && pendingPremove.pos === i) {
        clearPremove();
        return;
    }
    // (Re)select: clicking one of the player's own pieces. Starting a new
    // selection always replaces any previously-armed premove.
    const myColor = playAsW ? White : Black;
    if (pcs.getAttribute("type") != None && (pcs.getAttribute("color") - 0) === myColor) {
        const wasSelected = premoveSelectedSquare === i;
        clearPremove();
        clearPremoveSelectionHighlight();
        if (wasSelected) return; // re-clicking the same piece just deselects
        // Hypothetical "what would be legal for me right now" -- getAllMoves
        // takes WTM explicitly rather than reading the live whiteToMove
        // global (proven side-agnostic by the search itself, ai.js, which
        // calls it for both colors regardless of whose turn it really is),
        // so this is safe to compute against the CURRENT board even though
        // it's actually the opponent's turn.
        const candidates = getAllMoves(playAsW, boardPosition, lastMove, WhiteKingPos, BlackKingPos).filter((m) => m.pos === i);
        if (candidates.length === 0) return;
        premoveSelectedSquare = i;
        premoveCandidates = candidates;
        pcs.classList.add("premoveSelected");
        const seenTo = new Set();
        for (const m of candidates) {
            if (seenTo.has(m.posTo)) continue; // 4 promotion variants share one destination square
            seenTo.add(m.posTo);
            const t = document.getElementById(m.posTo);
            t.classList.add(((m.attPiece) & 7) !== None || m.isEnp ? "premoveTargetCapture" : "premoveTarget");
        }
        return;
    }
    // Clicked something irrelevant (empty square, opponent piece) with no
    // premove selection open to confirm -- just clear any stale transient
    // selection.
    clearPremoveSelectionHighlight();
}

// The real (second) legality check: only a move that's still legal against
// the ACTUAL position once it's genuinely the player's turn again ever
// gets played. A premove the AI's reply invalidated (blocked, captured,
// opened a new check) is silently dropped here -- never force-applied.
async function tryFirePremove() {
    if (pendingPremove === null) return;
    const premove = pendingPremove;
    clearPremove();
    const legal = getAllMoves(whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos);
    const match = legal.find(
        (m) =>
            m.pos === premove.pos &&
            m.posTo === premove.posTo &&
            (premove.promotedType === null ? !m.isPromoted : m.isPromoted && ((m.promotedTo) & 7) === premove.promotedType)
    );
    if (match) await movePiece(match);
}

function showMove() {
    for (let i = 0; i < 64; i++) {
        let pcs = document.getElementById(i);
        pcs.addEventListener("mousedown", function (e) {
            if (gameOver) return;
            if (e.button != 0) return;
            if (aiThinking) {
                handlePremoveClick(pcs, i);
                return;
            }
            {
                if (pcs.classList.contains("moveList") || pcs.classList.contains("moveListCapture")) {
                    removeShowedMove();
                } else if (pcs.getAttribute("type") != None) {
                    if (pcs.classList.contains("clicked")) {
                        removeShowedMove();
                        removeEventListener();
                    } else {
                        removeShowedMove();
                        removeEventListener();
                        if (pcs.getAttribute("tileColor") == "light") {
                            pcs.classList.add("lightClicked");
                        } else {
                            pcs.classList.add("darkClicked");
                        }
                        pcs.classList.add("clicked");
                        let pieceType = pcs.getAttribute("type") - "0";
                        let pieceColor = pcs.getAttribute("color") - "0";
                        let piece = ((pieceColor) | (pieceType) | ((false) ? 32 : 0));
                        moveList = getMoves(i, piece);
                        nextMoves = moveList;
                        showMoveList(moveList);
                    }
                } else {
                    removeShowedMove();
                    removeEventListener();
                }
            }
        });
    }
}

function getAllMoves(WTM, boardPos, lm, WKPos, BKPos) {
    let moveList = [];
    let color;
    if (WTM) {
        color = White;
    } else {
        color = Black;
    }

    const ownKingPos = WTM ? WKPos : BKPos;
    const enemyColor = WTM ? Black : White;
    currentKingInCheck = isSquareAttacked(boardPos, ownKingPos, enemyColor);
    currentPinnedMap = currentKingInCheck ? null : computePinnedPieces(boardPos, ownKingPos, color);

    // Only the side to move's own pieces can generate a move -- skip
    // opponent pieces before ever calling a generator (each generator only
    // checks ((piece) & 24) === color internally anyway, so calling it
    // for an enemy piece was a wasted call + array allocation every time). Push
    // into one array instead of `moveList.concat(...)`, which reassigned
    // and copied the whole accumulated list on every single piece.
    for (let sq = 0; sq < 64; sq++) {
        const piece = boardPos[sq];
        if (((piece) & 24) !== color) continue;
        let pieceMoves;
        if (((piece) & 7) == Pawn) {
            pieceMoves = getPawnMoves(sq, piece, color, boardPos, WKPos, BKPos, lm);
        } else if (((piece) & 7) == King) {
            pieceMoves = getKingMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else if (((piece) & 7) == Queen) {
            pieceMoves = getQueenMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else if (((piece) & 7) == Rook) {
            pieceMoves = getRookMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else if (((piece) & 7) == Knight) {
            pieceMoves = getKnightMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else if (((piece) & 7) == Bishop) {
            pieceMoves = getBishopMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else {
            continue;
        }
        for (let i = 0; i < pieceMoves.length; i++) moveList.push(pieceMoves[i]);
    }

    return moveList;
}

function getEval() {
    let evalWhite = 0;
    let evalBlack = 0;
    for (let i = 0; i < 64; i++) {
        if (((boardPosition[i]) & 24) == Black) {
            if (((boardPosition[i]) & 7) == King) {
                if (pieceCount >= 6) {
                    evalBlack += kingMapMiddle[i] / 10;
                } else {
                    evalBlack += kingMapEnd[i] / 10;
                }
            } else if (((boardPosition[i]) & 7) == Queen) {
                evalBlack += 900;
                evalBlack += queenMap[i] / 10;
            } else if (((boardPosition[i]) & 7) == Rook) {
                evalBlack += 500;
                evalBlack += rookMap[i] / 10;
            } else if (((boardPosition[i]) & 7) == Knight) {
                evalBlack += 300;
                evalBlack += knightMap[i] / 10;
            } else if (((boardPosition[i]) & 7) == Bishop) {
                evalBlack += 300;
                evalBlack += bishopMap[i] / 10;
            } else if (((boardPosition[i]) & 7) == Pawn) {
                evalBlack += 100;
                evalBlack += pawnMap[i] / 10;
            }
        } else {
            if (((boardPosition[i]) & 7) == King) {
                if (pieceCount >= 6) {
                    evalWhite += kingMapMiddle[i] / 10;
                } else {
                    evalWhite += kingMapEnd[i] / 10;
                }
            } else if (((boardPosition[i]) & 7) == Queen) {
                evalWhite += 900;
                evalWhite += queenMap[i] / 10;
            } else if (((boardPosition[i]) & 7) == Rook) {
                evalWhite += 500;
                evalWhite += rookMap[i] / 10;
            } else if (((boardPosition[i]) & 7) == Knight) {
                evalWhite += 300;
                evalWhite += knightMap[i] / 10;
            } else if (((boardPosition[i]) & 7) == Bishop) {
                evalWhite += 300;
                evalWhite += bishopMap[i] / 10;
            } else if (((boardPosition[i]) & 7) == Pawn) {
                evalWhite += 100;
                evalWhite += pawnMap[i] / 10;
            }
        }
    }
    let eval = evalWhite - evalBlack;
    eval /= 100;
    return eval;
}

function playAsWhite() {
    playAsW = true;
    createUndoButton();
}

async function playAsBlack() {
    // playAsB must be set before requesting/applying the AI's opening move:
    // movePiece checks it (via playAiTurn, above) to decide whether to
    // respond to Black's next reply, so it needs to already be true by the
    // time that check runs.
    playAsB = true;
    createUndoButton();
    await playAiTurn();
}

// window.onload(function () {
// });

// Pure state init -- 64 empty squares. Unconditional (not inside the DOM
// guard below): both the real page AND a Worker without a DOM need this
// before generatePieces() runs. Previously this sizing happened as a side
// effect of createBoard()'s DOM tile-creation loop; a Worker never calls
// createBoard(), so it's hoisted out here instead.
//
// boardPosition is a Uint8Array, not a plain Array -- each square is a
// packed piece byte (see makePiece/pieceType/pieceColor/hasMoved above),
// and a zero-filled Uint8Array(64) is already "all empty" (None === 0)
// with no per-square construction needed.
boardPosition = new Uint8Array(64);
for (let i = 0; i < 64; i++) {
    attackedPosition.push(None);
}
generatePieces(defaultFEN);
// generatePieces("r1b1kbr1/ppqnp2B/5p1n/2pPp1p1/8/2N1BN2/PPP2PPP/R2Q1RK1 w q - 0 1");
// generatePieces("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w");
// generatePieces("8/8/8/4Q3/8/8/8/8 w");
// generatePieces("r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b");
// whiteToMove = false;
// generatePieces("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w");
// generatePieces("r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w");
// generatePieces("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w - - 0 1");
// This is the only reason chess.js normally requires a document: everything
// below just builds/wires up the visual board, and starts the AI worker.
// ai-worker.js importScripts this same file with no `document` global, and
// skips straight past this whole block to run search headlessly.
if (typeof document !== "undefined") {
    container = document.getElementById("container");
    // Row that holds the eval bar + board side by side. Everything else the
    // game creates (this row, the flip button, the search-info label) lives
    // inside #container so the whole game area centers and groups together
    // as one visual unit, instead of the flip button/label being orphaned as
    // direct <body> children with no relation to the board's position.
    gameRow = document.createElement("div");
    gameRow.className = "game-row";
    container.appendChild(gameRow);

    // Flip Board + Undo side by side in one row, instead of each stacking as
    // its own full row below the board -- keeps the whole game area short
    // enough to not need scrolling to reach the controls.
    buttonRow = document.createElement("div");
    buttonRow.className = "button-row";
    container.appendChild(buttonRow);

    createEvalBar();
    createBoard();
    createMoveHistoryPanel();
    createFlipButton();
    createSearchInfoLabel();
    applyBoardOrientation();
    updateBoardLabels();
    showPiece(boardPosition);
    // getAllMoves();
    showMove();

    // Root-splitting parallel search (requestAiMove above): one worker per
    // pool slot, reused for the whole game. Reserve one core for this UI
    // thread; fall back to a single worker -- today's exact original
    // behavior -- when core count can't be detected.
    const aiWorkerCount =
        typeof navigator !== "undefined" && navigator.hardwareConcurrency >= 2
            ? Math.max(1, Math.min(navigator.hardwareConcurrency - 1, 6))
            : 1;
    for (let i = 0; i < aiWorkerCount; i++) {
        const worker = new Worker("ai-worker.js");
        worker.onerror = (function (index) {
            return function (e) {
                console.error("AI worker error:", e.message, e);
                if (pendingAiRejects[index]) {
                    const reject = pendingAiRejects[index];
                    pendingAiRejects[index] = null;
                    reject(e);
                }
            };
        })(i);
        aiWorkerPool.push(worker);
    }

    // Seed position history. Runs after ai.js is loaded so computeHash is
    // available. The eval bar itself starts at its static "0.0" default
    // (createEvalBar) and only ever updates from a real engine result
    // (playAiTurn), so there's nothing to seed for it here.
    window.addEventListener("load", function () {
        positionHistory.set(computeHash(boardPosition, whiteToMove), 1);
    });
}
