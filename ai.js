function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function test2(depth, WTM, boardPos, lm, WKPos, BKPos) {
    if (depth == 0) {
        return 1;
    }
    let moveList = JSON.parse(JSON.stringify(getAllMoves(WTM, boardPos, lm, WKPos, BKPos)));
    if (WTM) {
        WTM = false;
    } else {
        WTM = true;
    }

    let a = rank[rankAt(lm.pos) - 1];
    let b = fileAt(lm.pos);
    let c = rank[rankAt(lm.posTo) - 1];
    let d = fileAt(lm.posTo);
    let numPos = 0;

    // console.log(boardPos);
    for (let i = 0; i < moveList.length; i++) {
        let newBoardPos = moveToBoard(moveList[i], boardPos);
        lm = moveList[i];
        let num;
        if (moveList[i].piece.type == King) {
            if (moveList[i].piece.color == Black) {
                num = test2(depth - 1, WTM, newBoardPos, lm, WKPos, moveList[i].posTo);
            } else {
                num = test2(depth - 1, WTM, newBoardPos, lm, moveList[i].posTo, BKPos);
            }
        } else {
            num = test2(depth - 1, WTM, newBoardPos, lm, WKPos, BKPos);
        }

        numPos += num;
    }

    return numPos;
}

let pawnMap = [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0];
let knightMap = [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50];
let bishopMap = [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20];
let rookMap = [0, -10, 0, 0, 0, 0, -10, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0];
let queenMap = [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20];
let kingMapMiddle = [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20];
let kingMapEnd = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];
// .slice() before .reverse() — reverse() mutates in place, and without the
// copy this would silently reverse the White tables above too, leaving
// White and Black scored from the exact same (wrongly-mirrored) table.
let pawnMapBlack = pawnMap.slice().reverse();
let knightMapBlack = knightMap.slice().reverse();
let bishopMapBlack = bishopMap.slice().reverse();
let rookMapBlack = rookMap.slice().reverse();
let queenMapBlack = queenMap.slice().reverse();
let kingMapBlackMiddle = kingMapMiddle.slice().reverse();
let kingMapBlackEnd = kingMapEnd.slice().reverse();

let rank = ["a", "b", "c", "d", "e", "f", "g", "h"];

let reachedPosition = new Map();

async function test(depth, WTM, boardPos, lm, WKPos, BKPos) {
    if (depth == 0) {
        return 1;
    }
    let moveList = getAllMoves(WTM, boardPos, lm, WKPos, BKPos);
    if (WTM) {
        WTM = false;
    } else {
        WTM = true;
    }

    let numPos = 0;

    for (let i = 0; i < moveList.length; i++) {
        const newBoardPos = JSON.parse(JSON.stringify(moveToBoard(moveList[i], boardPos)));
        lm = moveList[i];
        if (moveList[i].piece.type == King) {
            if (moveList[i].piece.color == Black) {
                BKPos = moveList[i].posTo;
            } else {
                WKPos = moveList[i].posTo;
            }
        }
        showPiece(newBoardPos);
        await sleep(1000);
        numPos += await test(depth - 1, WTM, newBoardPos, lm, WKPos, BKPos);
    }
    return numPos;
}

// Game-phase weight per piece type, used to blend middlegame/endgame scoring
// smoothly instead of a hard piece-count cutoff (standard "tapered eval").
const PHASE_KNIGHT = 1;
const PHASE_BISHOP = 1;
const PHASE_ROOK = 2;
const PHASE_QUEEN = 4;
const PHASE_MAX = PHASE_KNIGHT * 4 + PHASE_BISHOP * 4 + PHASE_ROOK * 4 + PHASE_QUEEN * 2; // 24

// Cheap pseudo-mobility: count of squares a sliding piece could reach or
// capture on, ignoring whether that would leave its own king in check.
// Mirrors the same ray-walk bounds used throughout chess.js/getcapture.js.
function slidingMobility(boardPos, pos, color, diagonal) {
    let count = 0;
    const dirs = diagonal
        ? [
              { step: 7, bound: (p) => p <= 56, guard: (p) => diff(fileAt(p), fileAt(p + 7)) == 1 },
              { step: 9, bound: (p) => p <= 54, guard: (p) => diff(fileAt(p), fileAt(p + 9)) == 1 },
              { step: -7, bound: (p) => p >= 7, guard: (p) => diff(fileAt(p), fileAt(p - 7)) == 1 },
              { step: -9, bound: (p) => p >= 9, guard: (p) => diff(fileAt(p), fileAt(p - 9)) == 1 },
          ]
        : [
              { step: 8, bound: (p) => p <= 55, guard: () => true },
              { step: -8, bound: (p) => p >= 8, guard: () => true },
              { step: -1, bound: () => true, guard: (p) => diff(fileAt(pos), fileAt(p - 1)) == 0 },
              { step: 1, bound: () => true, guard: (p) => diff(fileAt(pos), fileAt(p + 1)) == 0 },
          ];
    for (const dir of dirs) {
        let cur = pos;
        while (dir.bound(cur) && dir.guard(cur)) {
            cur += dir.step;
            if (boardPos[cur].type != None) {
                if (boardPos[cur].color != color) count++;
                break;
            }
            count++;
        }
    }
    return count;
}

function knightMobility(boardPos, pos, color) {
    let count = 0;
    const offsets = [
        [15, 2, 1], [17, 2, 1], [6, 1, 2], [10, 1, 2],
        [-15, 2, 1], [-17, 2, 1], [-6, 1, 2], [-10, 1, 2],
    ];
    for (const [off, fd, rd] of offsets) {
        const p = pos + off;
        if (p < 0 || p > 63) continue;
        if (diff(fileAt(pos), fileAt(p)) == fd && diff(rankAt(pos), rankAt(p)) == rd) {
            if (boardPos[p].color != color) count++;
        }
    }
    return count;
}

// Doubled/isolated/passed pawn scoring for one side. ownColsRows/enemyColsRows
// are arrays of 8 columns, each holding the rows (0-7) of that color's pawns.
function pawnStructureScore(ownColsRows, enemyColsRows, isWhite) {
    let score = 0;
    for (let col = 0; col < 8; col++) {
        const rows = ownColsRows[col];
        const count = rows.length;
        if (count === 0) continue;

        if (count > 1) score -= 15 * (count - 1);

        const leftCount = col > 0 ? ownColsRows[col - 1].length : 0;
        const rightCount = col < 7 ? ownColsRows[col + 1].length : 0;
        if (leftCount === 0 && rightCount === 0) score -= 12 * count;

        for (const row of rows) {
            let passed = true;
            for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1) && passed; c++) {
                for (const enemyRow of enemyColsRows[c]) {
                    if (isWhite ? enemyRow > row : enemyRow < row) {
                        passed = false;
                        break;
                    }
                }
            }
            if (passed) {
                const advance = isWhite ? row : 7 - row; // 0 at start rank, rises toward promotion
                score += 10 + advance * 8;
            }
        }
    }
    return score;
}

// Pawn shelter near the king: penalize files (own + adjacent) with no
// friendly pawn, more so if that file is fully open (no pawns at all).
function kingSafetyScore(kingPos, ownColsRows, enemyColsRows) {
    const col = kingPos % 8;
    let score = 0;
    for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
        if (ownColsRows[c].length === 0) {
            score -= enemyColsRows[c].length === 0 ? 20 : 10;
        }
    }
    return score;
}

function Evaluate(WTM, boardPos) {
    let evalWhite = 0;
    let evalBlack = 0;
    let phaseAccum = 0;
    let whiteKingPos = -1;
    let blackKingPos = -1;
    let whiteBishops = 0;
    let blackBishops = 0;

    const whitePawnColsRows = Array.from({ length: 8 }, () => []);
    const blackPawnColsRows = Array.from({ length: 8 }, () => []);

    for (let i = 0; i < 64; i++) {
        const p = boardPos[i];
        if (p.type == None) continue;
        const col = i % 8;
        const row = Math.floor(i / 8);

        if (p.color == Black) {
            if (p.type == King) {
                blackKingPos = i;
            } else if (p.type == Queen) {
                evalBlack += 900 + queenMapBlack[i] / 10;
                evalBlack += slidingMobility(boardPos, i, Black, true) + slidingMobility(boardPos, i, Black, false);
                phaseAccum += PHASE_QUEEN;
            } else if (p.type == Rook) {
                evalBlack += 500 + rookMapBlack[i] / 10;
                evalBlack += 2 * slidingMobility(boardPos, i, Black, false);
                phaseAccum += PHASE_ROOK;
            } else if (p.type == Knight) {
                evalBlack += 300 + knightMapBlack[i] / 10;
                evalBlack += 2 * knightMobility(boardPos, i, Black);
                phaseAccum += PHASE_KNIGHT;
            } else if (p.type == Bishop) {
                evalBlack += 300 + bishopMapBlack[i] / 10;
                evalBlack += 2 * slidingMobility(boardPos, i, Black, true);
                blackBishops++;
                phaseAccum += PHASE_BISHOP;
            } else if (p.type == Pawn) {
                evalBlack += 100 + pawnMapBlack[i] / 10;
                blackPawnColsRows[col].push(row);
            }
        } else {
            if (p.type == King) {
                whiteKingPos = i;
            } else if (p.type == Queen) {
                evalWhite += 900 + queenMap[i] / 10;
                evalWhite += slidingMobility(boardPos, i, White, true) + slidingMobility(boardPos, i, White, false);
                phaseAccum += PHASE_QUEEN;
            } else if (p.type == Rook) {
                evalWhite += 500 + rookMap[i] / 10;
                evalWhite += 2 * slidingMobility(boardPos, i, White, false);
                phaseAccum += PHASE_ROOK;
            } else if (p.type == Knight) {
                evalWhite += 300 + knightMap[i] / 10;
                evalWhite += 2 * knightMobility(boardPos, i, White);
                phaseAccum += PHASE_KNIGHT;
            } else if (p.type == Bishop) {
                evalWhite += 300 + bishopMap[i] / 10;
                evalWhite += 2 * slidingMobility(boardPos, i, White, true);
                whiteBishops++;
                phaseAccum += PHASE_BISHOP;
            } else if (p.type == Pawn) {
                evalWhite += 100 + pawnMap[i] / 10;
                whitePawnColsRows[col].push(row);
            }
        }
    }

    const phase01 = Math.min(1, phaseAccum / PHASE_MAX);

    if (whiteKingPos >= 0) {
        evalWhite += (kingMapMiddle[whiteKingPos] * phase01 + kingMapEnd[whiteKingPos] * (1 - phase01)) / 10;
        evalWhite += kingSafetyScore(whiteKingPos, whitePawnColsRows, blackPawnColsRows);
    }
    if (blackKingPos >= 0) {
        evalBlack += (kingMapBlackMiddle[blackKingPos] * phase01 + kingMapBlackEnd[blackKingPos] * (1 - phase01)) / 10;
        evalBlack += kingSafetyScore(blackKingPos, blackPawnColsRows, whitePawnColsRows);
    }

    if (whiteBishops >= 2) evalWhite += 30;
    if (blackBishops >= 2) evalBlack += 30;

    evalWhite += pawnStructureScore(whitePawnColsRows, blackPawnColsRows, true);
    evalBlack += pawnStructureScore(blackPawnColsRows, whitePawnColsRows, false);

    for (let i = 0; i < 64; i++) {
        const p = boardPos[i];
        if (p.type != Rook) continue;
        const col = i % 8;
        const ownPawns = p.color == White ? whitePawnColsRows : blackPawnColsRows;
        const enemyPawns = p.color == White ? blackPawnColsRows : whitePawnColsRows;
        if (ownPawns[col].length === 0) {
            const bonus = enemyPawns[col].length === 0 ? 20 : 10;
            if (p.color == White) evalWhite += bonus;
            else evalBlack += bonus;
        }
    }

    let eval = evalWhite - evalBlack;
    eval /= 100;
    if (WTM) {
        return eval;
    } else {
        return eval * -1;
    }
}
// --- Transposition Table ---
const TT_EXACT = 0;
const TT_ALPHA = 1; // upper bound (failed low)
const TT_BETA  = 2; // lower bound (failed high / cutoff)
const TT_SIZE  = 1 << 18; // 262144 entries
const TT_MASK  = TT_SIZE - 1;

// 64 squares × 12 piece slots (6 types × 2 colors), each a random uint32
const zobristPieces = (() => {
    const t = [];
    for (let sq = 0; sq < 64; sq++) {
        t[sq] = new Uint32Array(12);
        for (let p = 0; p < 12; p++) {
            t[sq][p] = (Math.random() * 0x100000000) >>> 0;
        }
    }
    return t;
})();
const zobristBlackToMove = (Math.random() * 0x100000000) >>> 0;
const transpositionTable = new Array(TT_SIZE).fill(null);

function pieceIndex(piece) {
    // White: type-1 (0-5), Black: type-1+6 (6-11)
    return (piece.color === White ? 0 : 6) + (piece.type - 1);
}

function computeHash(boardPos, WTM) {
    let h = 0;
    for (let i = 0; i < 64; i++) {
        const p = boardPos[i];
        if (p.type !== None) {
            h = (h ^ zobristPieces[i][pieceIndex(p)]) >>> 0;
        }
    }
    if (!WTM) h = (h ^ zobristBlackToMove) >>> 0;
    return h;
}
// --- End Transposition Table ---

let asdsa = 0;

// --- Time budget (checked periodically inside Search/SearchAllCapture) ---
let searchDeadline = Infinity;
let searchAborted = false;

// --- Search-path repetition tracking ---
// hash -> number of times this exact position (board + side to move) has
// occurred so far within the CURRENT hypothetical search branch. Combined
// with positionHistory (real game occurrences), this lets Search recognize
// a forced threefold repetition several plies deep, instead of only at the
// point a move is actually played.
let searchPathCounts = new Map();

// --- Move ordering: killer moves + history heuristic ---
const MAX_KILLER_DEPTH = 64;
let killerMoves = Array.from({ length: MAX_KILLER_DEPTH }, () => [null, null]);
let historyTable = new Array(64 * 64).fill(0);

function moveEquals(a, b) {
    if (!a || !b) return false;
    return a.pos === b.pos && a.posTo === b.posTo && a.isPromoted === b.isPromoted;
}

function resetSearchState() {
    searchPathCounts.clear();
    for (let d = 0; d < MAX_KILLER_DEPTH; d++) {
        killerMoves[d][0] = null;
        killerMoves[d][1] = null;
    }
    historyTable.fill(0);
}

function Search(depth, WTM, boardPos, lm, WKPos, BKPos, alpha, beta) {
    asdsa++;
    if (searchAborted) return alpha;
    if ((asdsa & 2047) === 0 && Date.now() > searchDeadline) {
        searchAborted = true;
        return alpha;
    }
    if (depth === 0) {
        return SearchAllCapture(WTM, boardPos, lm, WKPos, BKPos, alpha, beta);
    }

    const hash = computeHash(boardPos, WTM);

    // Threefold repetition: real game occurrences so far plus repeats
    // already seen earlier in this hypothetical line. If reaching this node
    // would be the 3rd total occurrence, it's a forced draw — score 0 and
    // don't bother generating moves. Checked before the TT lookup since
    // drawn-by-repetition-ness is path-dependent, not a pure function of
    // the position, so it must not be served from the position-only TT.
    const priorCount = (positionHistory.get(hash) || 0) + (searchPathCounts.get(hash) || 0);
    if (priorCount >= 2) {
        return 0;
    }

    searchPathCounts.set(hash, (searchPathCounts.get(hash) || 0) + 1);
    let result;
    try {
        result = SearchNode(depth, WTM, boardPos, lm, WKPos, BKPos, alpha, beta, hash);
    } finally {
        const c = searchPathCounts.get(hash) - 1;
        if (c <= 0) searchPathCounts.delete(hash);
        else searchPathCounts.set(hash, c);
    }
    return result;
}

function SearchNode(depth, WTM, boardPos, lm, WKPos, BKPos, alpha, beta, hash) {
    const originalAlpha = alpha;
    const ttIndex = hash & TT_MASK;
    const tte = transpositionTable[ttIndex];
    let hashMove = null;

    if (tte !== null && tte[0] === hash) {
        // Always grab the stored best move for ordering, regardless of depth
        if (tte[4]) hashMove = tte[4];
        // Only use the stored eval if the entry was searched at least as deep
        if (tte[1] >= depth) {
            if (tte[3] === TT_EXACT)                    return tte[2];
            if (tte[3] === TT_ALPHA && tte[2] <= alpha) return alpha;
            if (tte[3] === TT_BETA  && tte[2] >= beta)  return beta;
        }
    }

    let color;
    let kingPos;
    if (lm.piece.color == White) {
        color = White;
        kingPos = BKPos;
    } else {
        color = Black;
        kingPos = WKPos;
    }
    let attackedPos = getAttackedPosition(boardPos, color);
    const inCheck = attackedPos[kingPos] !== 0;

    // Null-move pruning: "what if this side passed its turn entirely —
    // would the opponent still not have enough to reach beta?" If so, this
    // whole subtree is safe to prune. Disabled in check (can't legally pass
    // out of check), in low-material endgames (zugzwang risk — passing can
    // look artificially good when any real move would worsen the position),
    // and right after another null move (lm.piece.type === None marks that;
    // two passes in a row just reproduce the original position).
    if (depth >= 3 && !inCheck && pieceCount > 6 && lm.piece.type !== None) {
        const R = 2;
        const nullMove = { piece: { color: WTM ? White : Black, type: None }, pos: -1, posTo: -1 };
        const nullScore = -Search(depth - 1 - R, !WTM, boardPos, nullMove, WKPos, BKPos, -beta, -beta + 1);
        if (searchAborted) return alpha;
        if (nullScore >= beta) {
            return beta;
        }
    }

    let moveList = sortMoves(getAllMoves(WTM, boardPos, lm, WKPos, BKPos), attackedPos, depth);

    // Move the hash move to the front so it is searched first
    if (hashMove !== null) {
        const hmIdx = moveList.findIndex((m) => moveEquals(m, hashMove));
        if (hmIdx > 0) moveList.unshift(moveList.splice(hmIdx, 1)[0]);
    }

    const nextWTM = !WTM;
    if (moveList.length === 0) {
        return inCheck ? -999999 : 0;
    }

    let bestMove = null;

    for (let i = 0; i < moveList.length; i++) {
        const move = moveList[i];
        let newBoardPos = moveToBoard(move, boardPos);
        let childWKPos = WKPos;
        let childBKPos = BKPos;
        if (move.piece.type == King) {
            if (move.piece.color == Black) childBKPos = move.posTo;
            else childWKPos = move.posTo;
        }

        // Principal Variation Search: the first (best-ordered) move gets a
        // full-window search. Later moves are cheaply checked with a
        // null-window search first, and only re-searched with the full
        // window if that check suggests they might actually beat alpha.
        let evalScore;
        if (i === 0) {
            evalScore = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -beta, -alpha);
        } else {
            evalScore = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -alpha - 1, -alpha);
            if (!searchAborted && evalScore > alpha && evalScore < beta) {
                evalScore = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -beta, -alpha);
            }
        }

        if (searchAborted) return alpha;

        if (evalScore >= beta) {
            if (move.attPiece.type === None && !move.isPromoted) {
                if (depth < MAX_KILLER_DEPTH && !moveEquals(killerMoves[depth][0], move)) {
                    killerMoves[depth][1] = killerMoves[depth][0];
                    killerMoves[depth][0] = move;
                }
                historyTable[move.pos * 64 + move.posTo] += depth * depth;
            }
            transpositionTable[ttIndex] = [hash, depth, beta, TT_BETA, move];
            return beta;
        }
        if (evalScore > alpha) {
            alpha = evalScore;
            bestMove = move;
        }
    }

    const flag = alpha <= originalAlpha ? TT_ALPHA : TT_EXACT;
    transpositionTable[ttIndex] = [hash, depth, alpha, flag, bestMove];

    return alpha;
}

function boardToText(boardPos) {
    let str = "";
    for (let i = 0; i < 64; i++) {
        if (boardPos[i].color == Black) {
            if (boardPos[i].type == King) {
                str += "k";
            } else if (boardPos[i].type == Queen) {
                str += "q";
            } else if (boardPos[i].type == Rook) {
                str += "r";
            } else if (boardPos[i].type == Knight) {
                str += "n";
            } else if (boardPos[i].type == Bishop) {
                str += "b";
            } else if (boardPos[i].type == Pawn) {
                str += "p";
            }
        } else if (boardPos[i].color == White) {
            if (boardPos[i].type == King) {
                str += "K";
            } else if (boardPos[i].type == Queen) {
                str += "Q";
            } else if (boardPos[i].type == Rook) {
                str += "R";
            } else if (boardPos[i].type == Knight) {
                str += "N";
            } else if (boardPos[i].type == Bishop) {
                str += "B";
            } else if (boardPos[i].type == Pawn) {
                str += "P";
            }
        } else {
            str += "0";
        }
    }
    return str;
}

function SearchAllCapture(WTM, boardPos, lm, WKPos, BKPos, alpha, beta) {
    asdsa++;
    if (searchAborted) return alpha;
    if ((asdsa & 2047) === 0 && Date.now() > searchDeadline) {
        searchAborted = true;
        return alpha;
    }
    let eval = Evaluate(WTM, boardPos);
    if (eval >= beta) {
        return beta;
    }
    alpha = Math.max(alpha, eval);
    let color;
    let kingPos;
    if (lm.piece.color == White) {
        color = Black;
        kingPos = BKPos;
    } else {
        color = White;
        kingPos = WKPos;
    }
    let attackedPos = getAttackedPosition(boardPos, color);
    let moveList = sortMoves(getAllCaptureMoves(WTM, boardPos, lm, WKPos, BKPos), attackedPos);
    if (WTM) {
        kingPos = WKPos;
        WTM = false;
    } else {
        kingPos = BKPos;
        WTM = true;
    }

    for (let i = 0; i < moveList.length; i++) {
        let newBoardPos = moveToBoard(moveList[i], boardPos);
        lm = moveList[i];
        let eval;
        if (moveList[i].piece.type == King) {
            if (moveList[i].piece.color == Black) {
                eval = -SearchAllCapture(WTM, newBoardPos, lm, WKPos, moveList[i].posTo, -beta, -alpha);
            } else {
                eval = -SearchAllCapture(WTM, newBoardPos, lm, moveList[i].posTo, BKPos, -beta, -alpha);
            }
        } else {
            eval = -SearchAllCapture(WTM, newBoardPos, lm, WKPos, BKPos, -beta, -alpha);
        }
        if (eval >= beta) {
            return beta;
        }
    }

    return alpha;
}

function pieceValue(type) {
    if (type == Queen) {
        return 9;
    } else if (type == Rook) {
        return 5;
    } else if (type == Knight) {
        return 3;
    } else if (type == Bishop) {
        return 3;
    } else if (type == Pawn) {
        return 1;
    } else {
        return 0;
    }
}

function sortMoves(moveList, attackedPos, depth) {
    const killers = depth != null && depth < MAX_KILLER_DEPTH ? killerMoves[depth] : null;
    moveList.forEach((move) => {
        let moveScoreGuess = 0;
        let movePieceType = move.piece.type;
        let attPieceType = move.attPiece.type;

        if (attPieceType != None) {
            moveScoreGuess = 10 * pieceValue(attPieceType) - pieceValue(movePieceType);
        } else {
            // Quiet moves: order by history score, with a bonus for killer
            // moves (quiet moves that caused a cutoff elsewhere at this same
            // depth) — both cheap proxies for "likely good" that don't
            // require searching the move to find out.
            moveScoreGuess = historyTable[move.pos * 64 + move.posTo] / 50;
            if (killers && (moveEquals(move, killers[0]) || moveEquals(move, killers[1]))) {
                moveScoreGuess += 15;
            }
        }

        if (move.isPromoted) {
            moveScoreGuess += pieceValue(move.promotedTo);
        }

        if (attackedPos[move.posTo] == Pawn) {
            moveScoreGuess -= pieceValue(movePieceType);
        }

        move.moveScoreGuess = moveScoreGuess;
    });

    moveList.sort((a, b) => (a.moveScoreGuess < b.moveScoreGuess ? 1 : -1));

    return moveList;
}

function playAi() {
    // let val = Search(4, whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos, -999999, 999999);
    reachedPosition.clear();
    let WTM;
    if (whiteToMove) {
        WTM = false;
    } else {
        WTM = true;
    }
    let minVal = -9999999;
    let color;
    if (whiteToMove) {
        color = Black;
    } else {
        color = White;
    }
    let attackedPos = getAttackedPosition(boardPosition, color);
    let moveList = sortMoves(getAllMoves(whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos), attackedPos);
    // console.log(moveList);
    let mv;
    let depth = 3;
    if (pieceCount <= 5) {
        depth = 4;
    } else if (pieceCount <= 10) {
        depth = 3;
    }
    moveList.forEach((move) => {
        let newBoardPos = moveToBoard(move, boardPosition);
        let lm = move;
        let val;
        if (move.piece.type == King) {
            if (move.piece.color == Black) {
                val = -Search(depth, WTM, newBoardPos, lm, WhiteKingPos, move.posTo, -999999, 999999);
            } else {
                val = -Search(depth, WTM, newBoardPos, lm, move.posTo, BlackKingPos, -999999, 999999);
            }
        } else {
            val = -Search(depth, WTM, newBoardPos, lm, WhiteKingPos, BlackKingPos, -999999, 999999);
        }
        if (minVal < val) {
            minVal = val;
            mv = move;
        } else if (minVal == val) {
            let rand = Math.random();
            if (rand < 0.5) {
                mv = move;
            }
        }
    });
    // if (!whiteToMove) {
    //     minVal *= -1;
    // }
    console.log(minVal);
    console.log(asdsa);
    asdsa = 0;
    return mv;
}

// --- Opening book ---
// Keyed by boardToText() + side-to-move rather than the Zobrist hash,
// since zobristPieces/zobristBlackToMove are reseeded with Math.random()
// on every page load and can't be baked into source as fixed keys.
// Lines are written in plain coordinate notation and "compiled" at load
// time by replaying them through the real move generator below — any
// typo or illegal continuation is caught then rather than silently
// producing a bad move during play, and transpositions between lines
// naturally merge into the same book entry.
const openingBookLines = [
    // --- 1.e4 e5 ---
    "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1",  // Ruy Lopez, Morphy/Closed
    "e2e4 e7e5 g1f3 b8c6 f1b5 g8f6 e1g1",            // Ruy Lopez, Berlin Defense
    "e2e4 e7e5 g1f3 b8c6 f1c4 f8c5",                 // Italian, Giuoco Piano
    "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 e1g1",             // Italian, Two Knights
    "e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4",             // Scotch Game
    "e2e4 e7e5 g1f3 b8c6 b1c3 g8f6",                  // Four Knights
    "e2e4 e7e5 b1c3 g8f6",                            // Vienna Game
    "e2e4 e7e5 g1f3 g8f6 f3e5 d7d6",                  // Petrov Defense
    "e2e4 e7e5 f2f4",                                 // King's Gambit
    "e2e4 e7e5 g1f3 d7d6",                            // Philidor Defense

    // --- 1.e4 c5 (Sicilian) ---
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3",   // Open Sicilian, Najdorf setup
    "e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3",   // Open Sicilian, Classical setup
    "e2e4 c7c5 g1f3 e7e6 d2d4 c5d4 f3d4 b8c6",        // Open Sicilian, Taimanov
    "e2e4 c7c5 b1c3",                                 // Closed Sicilian
    "e2e4 c7c5 c2c3",                                 // Alapin Variation

    // --- 1.e4, other Black replies ---
    "e2e4 e7e6 d2d4 d7d5 b1c3 g8f6",                  // French, Classical
    "e2e4 e7e6 d2d4 d7d5 b1d2",                       // French, Tarrasch
    "e2e4 e7e6 d2d4 d7d5 e4e5 c7c5",                  // French, Advance
    "e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4",             // Caro-Kann, Classical
    "e2e4 c7c6 d2d4 d7d5 e4e5 c8f5",                  // Caro-Kann, Advance
    "e2e4 d7d5 e4d5 d8d5 b1c3",                       // Scandinavian, main
    "e2e4 d7d5 e4d5 g8f6",                            // Scandinavian, Modern
    "e2e4 g7g6",                                      // Modern Defense
    "e2e4 d7d6 d2d4 g8f6 b1c3 g7g6",                  // Pirc Defense

    // --- 1.d4 d5 ---
    "d2d4 d7d5 c2c4 e7e6 b1c3 g8f6",                  // QGD, main
    "d2d4 d7d5 c2c4 c7c6 g1f3 g8f6",                  // Slav Defense, main
    "d2d4 d7d5 c2c4 d5c4 g1f3 g8f6",                  // QGA, main
    "d2d4 d7d5 c1f4",                                 // London System

    // --- 1.d4 Nf6 ---
    "d2d4 g8f6 c2c4 g7g6 b1c3 f8g7",                  // King's Indian
    "d2d4 g8f6 c2c4 g7g6 b1c3 d7d5",                  // Grunfeld Defense
    "d2d4 g8f6 c2c4 e7e6 b1c3 f8b4",                  // Nimzo-Indian
    "d2d4 g8f6 c2c4 e7e6 g1f3 b7b6",                  // Queen's Indian
    "d2d4 g8f6 c2c4 e7e6 g2g3",                        // Catalan
    "d2d4 g8f6 c2c4 c7c5 d4d5 e7e6",                  // Benoni
    "d2d4 g8f6 c1f4",                                 // London System vs ...Nf6

    // --- 1.d4, other Black replies ---
    "d2d4 f7f5",                                      // Dutch Defense
    "d2d4 e7e5",                                      // Budapest Gambit

    // --- Flank openings ---
    "c2c4 e7e5 b1c3 g8f6 g1f3 b8c6",                  // English, reversed Sicilian
    "c2c4 g8f6 b1c3 e7e5",                            // English vs ...Nf6
    "c2c4 c7c5",                                      // English, Symmetrical
    "g1f3 d7d5 c2c4 e7e6 b1c3 g8f6",                  // Reti Opening
    "g1f3 g8f6 c2c4 g7g6",                            // Reti/KID setup
    "b2b3",                                           // Nimzo-Larsen Attack
    "g2g3",                                           // King's Fianchetto / Benko Opening
];

const openingBook = new Map();

function sqFromAlgebraic(s) {
    const file = s.charCodeAt(0) - 97; // 'a' -> 0
    const rank = s.charCodeAt(1) - 49; // '1' -> 0
    return rank * 8 + file;
}

function bookKey(boardPos, WTM) {
    return boardToText(boardPos) + (WTM ? "w" : "b");
}

function compileOpeningBook() {
    openingBook.clear();
    for (const line of openingBookLines) {
        const moves = line.split(" ").map((m) => ({
            from: sqFromAlgebraic(m.slice(0, 2)),
            to: sqFromAlgebraic(m.slice(2, 4)),
        }));

        let boardPos = boardPosition.slice();
        let WTM = true;
        let lm = lastMove;
        let WKPos = WhiteKingPos;
        let BKPos = BlackKingPos;

        for (const { from, to } of moves) {
            const legalMoves = getAllMoves(WTM, boardPos, lm, WKPos, BKPos);
            const match = legalMoves.find((mv) => mv.pos === from && mv.posTo === to && !mv.isPromoted);
            if (!match) {
                console.warn("Opening book: illegal/mistyped continuation, truncating line:", line);
                break;
            }

            const key = bookKey(boardPos, WTM);
            if (!openingBook.has(key)) openingBook.set(key, []);
            const candidates = openingBook.get(key);
            if (!candidates.some((c) => c.from === from && c.to === to)) candidates.push({ from, to });

            if (match.piece.type === King) {
                if (match.piece.color === Black) BKPos = match.posTo;
                else WKPos = match.posTo;
            }
            boardPos = moveToBoard(match, boardPos);
            lm = match;
            WTM = !WTM;
        }
    }
}

function getBookMove(boardPos, WTM, lm, WKPos, BKPos) {
    const candidates = openingBook.get(bookKey(boardPos, WTM));
    if (!candidates || candidates.length === 0) return null;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const legalMoves = getAllMoves(WTM, boardPos, lm, WKPos, BKPos);
    return legalMoves.find((mv) => mv.pos === pick.from && mv.posTo === pick.to) || null;
}

// Called synchronously (not deferred to window "load") because
// PlayAsBlack.html and AiVsAi.html invoke the AI for White's first move
// immediately after the scripts finish loading — before the page's "load"
// event necessarily fires (that waits on piece images too). This only
// needs chess.js's globals/functions, which are already fully set up by
// the time this file runs, so there's no real ordering dependency to wait
// on in the first place.
compileOpeningBook();

const AI_TIME_BUDGET_MS = 1500;

function playAi2() {
    const bookMove = getBookMove(boardPosition, whiteToMove, lastMove, WhiteKingPos, BlackKingPos);
    if (bookMove) return bookMove;

    searchDeadline = Date.now() + AI_TIME_BUDGET_MS;
    searchAborted = false;
    resetSearchState();

    let bestMove = null;
    let firstLegalMove = null;

    // Iterative deepening against a wall-clock budget: each pass seeds the
    // TT/killers/history so the next pass orders and prunes far more
    // effectively. A pass that doesn't finish within the budget is thrown
    // away entirely — the last fully-completed depth's best move is kept,
    // so the engine never returns a half-searched answer.
    for (let depth = 1; depth <= 40; depth++) {
        let alpha = -999999;
        const beta = 999999;
        let depthBestMove = null;
        let depthCompleted = true;

        const color = whiteToMove ? Black : White;
        const attackedPos = getAttackedPosition(boardPosition, color);
        let rootMoves = sortMoves(
            getAllMoves(whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos),
            attackedPos,
            null
        );
        if (firstLegalMove === null && rootMoves.length > 0) firstLegalMove = rootMoves[0];

        // Bring the previous iteration's best move to the front of root list
        if (bestMove !== null) {
            const hmIdx = rootMoves.findIndex((m) => moveEquals(m, bestMove));
            if (hmIdx > 0) rootMoves.unshift(rootMoves.splice(hmIdx, 1)[0]);
        }

        const nextWTM = !whiteToMove;
        for (let i = 0; i < rootMoves.length; i++) {
            const move = rootMoves[i];
            const newBoardPos = moveToBoard(move, boardPosition);
            let childWKPos = WhiteKingPos;
            let childBKPos = BlackKingPos;
            if (move.piece.type === King) {
                if (move.piece.color === Black) childBKPos = move.posTo;
                else childWKPos = move.posTo;
            }

            let val;
            if (i === 0) {
                val = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -beta, -alpha);
            } else {
                val = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -alpha - 1, -alpha);
                if (!searchAborted && val > alpha && val < beta) {
                    val = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -beta, -alpha);
                }
            }

            if (searchAborted) {
                depthCompleted = false;
                break;
            }
            if (val > alpha) {
                alpha = val;
                depthBestMove = move;
            }
        }

        if (depthCompleted && depthBestMove !== null) bestMove = depthBestMove;
        if (!depthCompleted) break;
        if (alpha > 900000) break; // forced mate found, no need to search deeper
        if (rootMoves.length <= 1) break; // nothing left to iterate on
        if (Date.now() >= searchDeadline) break;
    }

    asdsa = 0;
    return bestMove || firstLegalMove;
}

async function AivsAi() {
    while (1) {
        if (gameOver) break;
        let move = playAi2();
        if (move && !gameOver) {
            movePiece(move);
            await sleep(10);
        } else {
            break;
        }
    }
}
