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

// Endgame variants for the two pieces whose positional value shifts most
// clearly and uncontroversially between phases (same "row 0 = rank 8" table
// convention as above). Pawn: advancement toward promotion becomes worth far
// more, roughly regardless of file, rather than the middlegame table's
// central-file emphasis. Rook: the 7th-rank bonus (cutting off the enemy
// king, attacking pawns from behind) sharpens, while the middlegame table's
// "-10 on the b/g files" nudge (discouraging premature rook moves before
// castling) and slight kingside-file bias no longer apply once development
// isn't a concern. Knight/bishop/queen deliberately keep a single table for
// both phases -- their middlegame/endgame value shift is real but far more
// subtle, and inventing specific numbers for it without being able to
// actually test them empirically (self-play, tournament tuning) risks doing
// more harm than good.
let pawnMapEnd = [0, 0, 0, 0, 0, 0, 0, 0, 90, 90, 90, 90, 90, 90, 90, 90, 60, 60, 60, 60, 60, 60, 60, 60, 35, 35, 35, 35, 35, 35, 35, 35, 20, 20, 20, 20, 20, 20, 20, 20, 10, 10, 10, 10, 10, 10, 10, 10, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0];
let rookMapEnd = [0, 0, 0, 0, 0, 0, 0, 0, 20, 20, 20, 20, 20, 20, 20, 20, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// The tables above are authored in the conventional "as-diagrammed" square
// order (row 0 = rank 8, row 7 = rank 1) — e.g. pawnMap's row 1 (all 50s)
// is the bonus for a pawn on rank 7, one step from queening. This engine's
// own square indexing runs the other way (0 = a1 ... 63 = h8, row 0 = rank
// 1), so a White piece's own square must be rank-mirrored before indexing
// into these tables, or it reads the bonus for the rank-mirrored square
// instead (e.g. a pawn still on rank 2 would wrongly get the "one step from
// queening" bonus). A Black piece's own advancement direction (rank 8 rank
// 1) already matches the table's row order one-for-one, so Black indexes
// these tables directly, unmirrored.
function mirrorRank(i) {
    return (7 - (i >> 3)) * 8 + (i & 7);
}

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

// Chebyshev (king-move) distance -- how many king moves to get from one
// square to another, since a king covers one rank/file/diagonal step at a
// time regardless of direction.
function kingDistance(a, b) {
    const ar = Math.floor(a / 8), ac = a % 8;
    const br = Math.floor(b / 8), bc = b % 8;
    return Math.max(Math.abs(ar - br), Math.abs(ac - bc));
}

// Doubled/isolated/passed pawn scoring for one side. ownColsRows/enemyColsRows
// are arrays of 8 columns, each holding the rows (0-7) of that color's pawns.
// ownKingPos/enemyKingPos add the classic "square of the pawn" consideration
// for passed pawns: the advancement bonus alone doesn't capture that a passed
// pawn is far more dangerous when its own king can escort it home, or far
// less when the defending king can simply walk over and blockade it --
// something the advancement-only bonus otherwise misses entirely.
function pawnStructureScore(ownColsRows, enemyColsRows, isWhite, ownKingPos, enemyKingPos) {
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

                const promoSquare = (isWhite ? 56 : 0) + col;
                const ownDist = kingDistance(ownKingPos, promoSquare);
                const enemyDist = kingDistance(enemyKingPos, promoSquare);
                score += (enemyDist - ownDist) * 4;
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

// Basic mating technique a generic material+PST eval doesn't otherwise
// reward: once one side is up overwhelming material and the other has
// almost nothing left, push the winning king toward the losing king and
// the losing king toward the edge (mates get delivered at the edge, not
// the center).
function endgameKingActivityScore(weakKingPos, strongKingPos) {
    const wRow = Math.floor(weakKingPos / 8);
    const wCol = weakKingPos % 8;
    const sRow = Math.floor(strongKingPos / 8);
    const sCol = strongKingPos % 8;
    const centerDistWeak = Math.max(Math.abs(wRow - 3.5), Math.abs(wCol - 3.5));
    const kingDist = Math.max(Math.abs(wRow - sRow), Math.abs(wCol - sCol));
    return centerDistWeak * 10 - kingDist * 4;
}

function Evaluate(WTM, boardPos) {
    let evalWhite = 0;
    let evalBlack = 0;
    let phaseAccum = 0;
    let whiteKingPos = -1;
    let blackKingPos = -1;
    let whiteBishops = 0;
    let blackBishops = 0;
    let whiteMaterial = 0;
    let blackMaterial = 0;

    const whitePawnColsRows = Array.from({ length: 8 }, () => []);
    const blackPawnColsRows = Array.from({ length: 8 }, () => []);
    const whitePawnSquares = [];
    const blackPawnSquares = [];
    const whiteRookSquares = [];
    const blackRookSquares = [];
    const whiteBishopSquares = [];
    const blackBishopSquares = [];
    // [0] = pawns on light squares, [1] = pawns on dark squares (matches
    // squareColor's 0/1, from chess.js) -- used by the bad-bishop penalty
    // below, since a bishop is only hemmed in by pawns on ITS OWN color.
    const whitePawnsByColor = [0, 0];
    const blackPawnsByColor = [0, 0];

    // Pawn/rook piece-square scoring is tapered between middlegame/endgame
    // tables (like king below), but that blend needs the FINAL phaseAccum --
    // known only once every piece has been scanned -- so this pass only
    // records material, mobility, and each pawn's/rook's square; the tapered
    // PST bonus itself is added afterward, once phase01 is known.
    for (let i = 0; i < 64; i++) {
        const p = boardPos[i];
        if (p.type == None) continue;
        const col = i % 8;
        const row = Math.floor(i / 8);

        if (p.color == Black) {
            if (p.type == King) {
                blackKingPos = i;
            } else if (p.type == Queen) {
                evalBlack += 900 + queenMap[i] / 10;
                evalBlack += slidingMobility(boardPos, i, Black, true) + slidingMobility(boardPos, i, Black, false);
                phaseAccum += PHASE_QUEEN;
                blackMaterial += 9;
            } else if (p.type == Rook) {
                evalBlack += 500;
                evalBlack += 2 * slidingMobility(boardPos, i, Black, false);
                blackRookSquares.push(i);
                phaseAccum += PHASE_ROOK;
                blackMaterial += 5;
            } else if (p.type == Knight) {
                evalBlack += 300 + knightMap[i] / 10;
                evalBlack += 2 * knightMobility(boardPos, i, Black);
                phaseAccum += PHASE_KNIGHT;
                blackMaterial += 3;
            } else if (p.type == Bishop) {
                evalBlack += 300 + bishopMap[i] / 10;
                evalBlack += 2 * slidingMobility(boardPos, i, Black, true);
                blackBishops++;
                blackBishopSquares.push(i);
                phaseAccum += PHASE_BISHOP;
                blackMaterial += 3;
            } else if (p.type == Pawn) {
                evalBlack += 100;
                blackPawnSquares.push(i);
                blackPawnColsRows[col].push(row);
                blackPawnsByColor[squareColor(i)]++;
                blackMaterial += 1;
            }
        } else {
            if (p.type == King) {
                whiteKingPos = i;
            } else if (p.type == Queen) {
                evalWhite += 900 + queenMap[mirrorRank(i)] / 10;
                evalWhite += slidingMobility(boardPos, i, White, true) + slidingMobility(boardPos, i, White, false);
                phaseAccum += PHASE_QUEEN;
                whiteMaterial += 9;
            } else if (p.type == Rook) {
                evalWhite += 500;
                evalWhite += 2 * slidingMobility(boardPos, i, White, false);
                whiteRookSquares.push(i);
                phaseAccum += PHASE_ROOK;
                whiteMaterial += 5;
            } else if (p.type == Knight) {
                evalWhite += 300 + knightMap[mirrorRank(i)] / 10;
                evalWhite += 2 * knightMobility(boardPos, i, White);
                phaseAccum += PHASE_KNIGHT;
                whiteMaterial += 3;
            } else if (p.type == Bishop) {
                evalWhite += 300 + bishopMap[mirrorRank(i)] / 10;
                evalWhite += 2 * slidingMobility(boardPos, i, White, true);
                whiteBishops++;
                whiteBishopSquares.push(i);
                phaseAccum += PHASE_BISHOP;
                whiteMaterial += 3;
            } else if (p.type == Pawn) {
                evalWhite += 100;
                whitePawnSquares.push(i);
                whitePawnColsRows[col].push(row);
                whitePawnsByColor[squareColor(i)]++;
                whiteMaterial += 1;
            }
        }
    }

    const phase01 = Math.min(1, phaseAccum / PHASE_MAX);

    for (const sq of whitePawnSquares) {
        const m = mirrorRank(sq);
        evalWhite += (pawnMap[m] * phase01 + pawnMapEnd[m] * (1 - phase01)) / 10;
    }
    for (const sq of blackPawnSquares) {
        evalBlack += (pawnMap[sq] * phase01 + pawnMapEnd[sq] * (1 - phase01)) / 10;
    }
    for (const sq of whiteRookSquares) {
        const m = mirrorRank(sq);
        evalWhite += (rookMap[m] * phase01 + rookMapEnd[m] * (1 - phase01)) / 10;
    }
    for (const sq of blackRookSquares) {
        evalBlack += (rookMap[sq] * phase01 + rookMapEnd[sq] * (1 - phase01)) / 10;
    }

    if (whiteKingPos >= 0) {
        const wk = mirrorRank(whiteKingPos);
        evalWhite += (kingMapMiddle[wk] * phase01 + kingMapEnd[wk] * (1 - phase01)) / 10;
        evalWhite += kingSafetyScore(whiteKingPos, whitePawnColsRows, blackPawnColsRows);
    }
    if (blackKingPos >= 0) {
        evalBlack += (kingMapMiddle[blackKingPos] * phase01 + kingMapEnd[blackKingPos] * (1 - phase01)) / 10;
        evalBlack += kingSafetyScore(blackKingPos, blackPawnColsRows, whitePawnColsRows);
    }

    if (whiteBishops >= 2) evalWhite += 30;
    if (blackBishops >= 2) evalBlack += 30;

    // Bad bishop: pawns fixed on the SAME square color as the bishop hem it
    // in (it can never get past them), unlike pawns on the opposite color,
    // which don't obstruct its diagonals at all and can even be defended by
    // it. Scaled down in the endgame (phase01 low), where the bishop's
    // greater range often lets it get around a pawn chain the long way.
    for (const sq of whiteBishopSquares) {
        evalWhite -= whitePawnsByColor[squareColor(sq)] * (2 + 2 * phase01);
    }
    for (const sq of blackBishopSquares) {
        evalBlack -= blackPawnsByColor[squareColor(sq)] * (2 + 2 * phase01);
    }

    // King activity: push the stronger side's king toward the weaker one
    // (and the weaker king toward the edge) in any real endgame with a
    // genuine material edge -- not just the near-bare-king mop-up case.
    // Scaled by how big the material gap is (capped once it reaches a full
    // rook or two minors' worth) so a marginal edge doesn't get the full
    // push before it's actually time to convert.
    if (whiteKingPos >= 0 && blackKingPos >= 0 && phase01 < 0.5) {
        const materialDiff = whiteMaterial - blackMaterial;
        if (materialDiff >= 2) {
            evalWhite += endgameKingActivityScore(blackKingPos, whiteKingPos) * Math.min(1, materialDiff / 6);
        } else if (materialDiff <= -2) {
            evalBlack += endgameKingActivityScore(whiteKingPos, blackKingPos) * Math.min(1, -materialDiff / 6);
        }
    }

    evalWhite += pawnStructureScore(whitePawnColsRows, blackPawnColsRows, true, whiteKingPos, blackKingPos);
    evalBlack += pawnStructureScore(blackPawnColsRows, whitePawnColsRows, false, blackKingPos, whiteKingPos);

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
const TT_SIZE  = 1 << 20; // 1,048,576 entries
const TT_MASK  = TT_SIZE - 1;

// A tiny, deterministic PRNG (mulberry32) with a fixed seed, used ONLY for
// Zobrist table generation below. Must be deterministic (not Math.random())
// so the AI worker -- which loads its own independent copy of this file via
// importScripts -- computes byte-identical hashes to the main thread's. With
// two independently-randomized tables, the worker's threefold-repetition
// check (positionHistory.get(hash) below) would never match keys the main
// thread inserted, silently breaking repetition detection whenever search
// runs off-thread.
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const zobristRandom = mulberry32(0x5eed1234);

// 64 squares × 12 piece slots (6 types × 2 colors), each a random uint32
const zobristPieces = (() => {
    const t = [];
    for (let sq = 0; sq < 64; sq++) {
        t[sq] = new Uint32Array(12);
        for (let p = 0; p < 12; p++) {
            t[sq][p] = (zobristRandom() * 0x100000000) >>> 0;
        }
    }
    return t;
})();
const zobristBlackToMove = (zobristRandom() * 0x100000000) >>> 0;
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

// Derives the hash of the position after `move` from the hash of the
// position before it, touching only the 2-4 squares the move actually
// changes instead of rescanning the whole board — computeHash() was
// previously being called fresh at every single search node (the hottest
// function in the whole engine), which is pure O(64) waste once you
// already know the parent's hash and the move that was just made.
function updateHashForMove(hash, move) {
    let h = (hash ^ zobristBlackToMove) >>> 0;

    h = (h ^ zobristPieces[move.pos][pieceIndex(move.piece)]) >>> 0;

    if (move.isEnp) {
        h = (h ^ zobristPieces[move.enpTo][pieceIndex(move.attPiece)]) >>> 0;
    } else if (move.attPiece.type !== None) {
        h = (h ^ zobristPieces[move.posTo][pieceIndex(move.attPiece)]) >>> 0;
    }

    const destPiece = move.isPromoted ? move.promotedTo : move.piece;
    h = (h ^ zobristPieces[move.posTo][pieceIndex(destPiece)]) >>> 0;

    if (move.isCastle) {
        const rookFrom = move.castleType === "l" ? move.posTo - 2 : move.posTo + 1;
        const rookTo = move.castleType === "l" ? move.posTo + 1 : move.posTo - 1;
        const rookIdx = pieceIndex({ color: move.piece.color, type: Rook });
        h = (h ^ zobristPieces[rookFrom][rookIdx]) >>> 0;
        h = (h ^ zobristPieces[rookTo][rookIdx]) >>> 0;
    }

    return h;
}

// The null-move probe doesn't touch the board at all — only the side to
// move toggles.
function nullMoveHash(hash) {
    return (hash ^ zobristBlackToMove) >>> 0;
}

// Depth-preferred replacement: an empty slot or one holding a different
// position (an index collision, since TT_MASK maps far more possible
// hashes than there are slots) always takes the fresh result — otherwise
// nothing would ever get stored for that position at all. When it's the
// same position, only replace with equal-or-deeper data, so a slower, more
// valuable deep search result isn't evicted by a shallower one probing the
// same position again later (e.g. via a transposition or a null-move check).
function storeTTEntry(ttIndex, hash, depth, value, flag, move) {
    const existing = transpositionTable[ttIndex];
    if (existing === null || existing[0] !== hash || depth >= existing[1]) {
        transpositionTable[ttIndex] = [hash, depth, value, flag, move];
    }
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

function Search(depth, WTM, boardPos, lm, WKPos, BKPos, alpha, beta, extensionsUsed, hash) {
    asdsa++;
    if (searchAborted) return alpha;
    if ((asdsa & 2047) === 0 && Date.now() > searchDeadline) {
        searchAborted = true;
        return alpha;
    }
    if (depth === 0) {
        return SearchAllCapture(WTM, boardPos, lm, WKPos, BKPos, alpha, beta);
    }

    // hash arrives pre-computed via updateHashForMove/nullMoveHash at the
    // call site — this used to be a full computeHash() rescan of the whole
    // board on every single call, which was the single hottest O(64)
    // operation in the entire engine.

    // Threefold repetition: real game occurrences so far plus repeats
    // already seen earlier in this hypothetical line. If reaching this node
    // would be the 3rd total occurrence, it's a forced draw. Checked before
    // the TT lookup since drawn-by-repetition-ness is path-dependent, not a
    // pure function of the position, so it must not be served from the
    // position-only TT.
    const priorCount = (positionHistory.get(hash) || 0) + (searchPathCounts.get(hash) || 0);
    if (priorCount >= 2) {
        // A draw is worth 0 in absolute terms, but scoring it as exactly 0
        // makes the search indifferent between "repeat" and any other move
        // that also merely looks flat within its horizon — which in
        // technical endgames (where real progress needs a multi-move plan
        // the search can't fully see that far ahead) can make the engine
        // drift into a draw even while clearly winning. Nudge the score by
        // a small "contempt" tied to material/positional balance: the side
        // ahead sees the draw as slightly negative (so it prefers almost
        // any other move), the side behind sees it as slightly positive
        // (so it's willing to seek it out). A position with genuinely no
        // better option still ends up drawn — this only breaks ties.
        const staticEval = Evaluate(WTM, boardPos);
        const contempt = Math.max(-0.5, Math.min(0.5, staticEval * 0.15));
        return -contempt;
    }

    searchPathCounts.set(hash, (searchPathCounts.get(hash) || 0) + 1);
    let result;
    try {
        result = SearchNode(depth, WTM, boardPos, lm, WKPos, BKPos, alpha, beta, hash, extensionsUsed || 0);
    } finally {
        const c = searchPathCounts.get(hash) - 1;
        if (c <= 0) searchPathCounts.delete(hash);
        else searchPathCounts.set(hash, c);
    }
    return result;
}

function SearchNode(depth, WTM, boardPos, lm, WKPos, BKPos, alpha, beta, hash, extensionsUsed) {
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

    // Check extension: when in check, search one ply deeper before
    // decrementing depth, since forced replies to check are often critical
    // and easy for a depth-limited search to prematurely cut off. Capped
    // per branch so a long forcing sequence can't blow up search time.
    const MAX_CHECK_EXTENSIONS = 8;
    const extend = inCheck && extensionsUsed < MAX_CHECK_EXTENSIONS ? 1 : 0;
    const childDepth = depth - 1 + extend;
    const childExtensions = extensionsUsed + extend;

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
        const nullScore = -Search(depth - 1 - R, !WTM, boardPos, nullMove, WKPos, BKPos, -beta, -beta + 1, extensionsUsed, nullMoveHash(hash));
        if (searchAborted) return alpha;
        if (nullScore >= beta) {
            return beta;
        }
    }

    let moveList = sortMoves(getAllMoves(WTM, boardPos, lm, WKPos, BKPos), attackedPos, depth, boardPos);

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
        let childWKPos = WKPos;
        let childBKPos = BKPos;
        if (move.piece.type == King) {
            if (move.piece.color == Black) childBKPos = move.posTo;
            else childWKPos = move.posTo;
        }
        const childHash = updateHashForMove(hash, move);

        // Principal Variation Search: the first (best-ordered) move gets a
        // full-window search. Later moves are cheaply checked with a
        // null-window search first, and only re-searched with the full
        // window if that check suggests they might actually beat alpha.
        //
        // Late Move Reductions: moves ordered late (i.e. everything past the
        // hash move/killers/best-history moves sortMoves already floated to
        // the front) are usually not the best move in the position, so their
        // FIRST look is searched at a reduced depth instead of childDepth --
        // cheaper, and still enough to catch a genuinely strong move, since
        // any reduced search that beats alpha gets escalated back to
        // childDepth (still null-window) before the existing PVS re-search
        // logic above even runs. Skipped for captures/promotions (need full
        // strength to evaluate correctly) and while in check (already
        // handled by the check-extension above, and reducing on top of that
        // is the wrong direction). This doesn't check whether the move
        // itself delivers check -- a common refinement that would exclude a
        // few more tactical moves from reduction, at the cost of an extra
        // isSquareAttacked call per candidate; omitting it just means a
        // slightly wider set of moves gets reduced, which the beats-alpha
        // re-search safety net already covers.
        const LMR_MIN_DEPTH = 3;
        const LMR_MIN_MOVE_INDEX = 3;
        const canReduce = i >= LMR_MIN_MOVE_INDEX && depth >= LMR_MIN_DEPTH && !inCheck && move.attPiece.type === None && !move.isPromoted;
        const reduction = canReduce ? (i >= 6 ? 2 : 1) : 0;

        // Make/unmake: boardPos is ONE shared, mutable array for the whole
        // search tree (not a clone per move) -- makeMove mutates it in
        // place and returns an undo record; the try/finally guarantees
        // unmakeMove restores it before this iteration ends, no matter
        // which branch below returns or whether something throws, so a
        // future edit adding another exit path can't accidentally skip it.
        let evalScore;
        const undo = makeMove(move, boardPos);
        try {
            if (i === 0) {
                evalScore = -Search(childDepth, nextWTM, boardPos, move, childWKPos, childBKPos, -beta, -alpha, childExtensions, childHash);
            } else {
                const reducedDepth = Math.max(0, childDepth - reduction);
                evalScore = -Search(reducedDepth, nextWTM, boardPos, move, childWKPos, childBKPos, -alpha - 1, -alpha, childExtensions, childHash);
                if (!searchAborted && reduction > 0 && evalScore > alpha) {
                    // The reduced look unexpectedly beat alpha -- confirm at the
                    // real depth before trusting it (still null-window).
                    evalScore = -Search(childDepth, nextWTM, boardPos, move, childWKPos, childBKPos, -alpha - 1, -alpha, childExtensions, childHash);
                }
                if (!searchAborted && evalScore > alpha && evalScore < beta) {
                    evalScore = -Search(childDepth, nextWTM, boardPos, move, childWKPos, childBKPos, -beta, -alpha, childExtensions, childHash);
                }
            }
        } finally {
            unmakeMove(undo, boardPos);
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
            storeTTEntry(ttIndex, hash, depth, beta, TT_BETA, move);
            return beta;
        }
        if (evalScore > alpha) {
            alpha = evalScore;
            bestMove = move;
        }
    }

    const flag = alpha <= originalAlpha ? TT_ALPHA : TT_EXACT;
    storeTTEntry(ttIndex, hash, depth, alpha, flag, bestMove);

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
    // sortMoves scores every capture by SEE (in moveScoreGuess, scaled by
    // 100) — reuse that instead of recomputing, and skip captures that lose
    // material outright: exploring them in quiescence essentially never
    // helps once the "stand pat" static eval is already being compared
    // against alpha above.
    let moveList = sortMoves(getAllCaptureMoves(WTM, boardPos, lm, WKPos, BKPos), attackedPos, null, boardPos)
        .filter((move) => move.moveScoreGuess >= 0);
    if (WTM) {
        kingPos = WKPos;
        WTM = false;
    } else {
        kingPos = BKPos;
        WTM = true;
    }

    for (let i = 0; i < moveList.length; i++) {
        const move = moveList[i];
        lm = move;
        let eval;
        const undo = makeMove(move, boardPos);
        try {
            if (move.piece.type == King) {
                if (move.piece.color == Black) {
                    eval = -SearchAllCapture(WTM, boardPos, lm, WKPos, move.posTo, -beta, -alpha);
                } else {
                    eval = -SearchAllCapture(WTM, boardPos, lm, move.posTo, BKPos, -beta, -alpha);
                }
            } else {
                eval = -SearchAllCapture(WTM, boardPos, lm, WKPos, BKPos, -beta, -alpha);
            }
        } finally {
            unmakeMove(undo, boardPos);
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

// All `color` pieces directly attacking `square` on the current board, via
// the same bitboard attack tables used throughout chess.js/getcapture.js.
// Used by SEE below — return order doesn't matter, both call sites sort
// immediately. Simplification: this does not reveal x-ray attackers (e.g. a
// rook behind a rook on a file) as pieces ahead of them get simulated away
// during an exchange — a full x-ray-aware SEE would re-scan after each
// capture. This only occasionally misjudges batteries; it's still far more
// accurate than plain MVV-LVA for the common case.
function getAttackers(boardPos, square, color) {
    const bb = syncBitboards(boardPos);
    const oppositeOfColor = color === White ? Black : White;
    const attackers = [];

    forEachBit(and64(KNIGHT_ATTACKS[square], bb.piece[color][Knight]), () => attackers.push(Knight));
    forEachBit(and64(KING_ATTACKS[square], bb.piece[color][King]), () => attackers.push(King));
    forEachBit(and64(PAWN_ATTACKS[oppositeOfColor][square], bb.piece[color][Pawn]), () => attackers.push(Pawn));

    const rookQueenBB = or64(bb.piece[color][Rook], bb.piece[color][Queen]);
    forEachBit(and64(rookAttacks(square, bb.all), rookQueenBB), (sq) => attackers.push(boardPos[sq].type));

    const bishopQueenBB = or64(bb.piece[color][Bishop], bb.piece[color][Queen]);
    forEachBit(and64(bishopAttacks(square, bb.all), bishopQueenBB), (sq) => attackers.push(boardPos[sq].type));

    return attackers;
}

// Static Exchange Evaluation: the net material result (in pawns-equivalent,
// positive = good for the side making `move`) of playing out the full
// capture sequence on move.posTo, assuming both sides always recapture
// with their least valuable available attacker and only continue when
// it's not a loss to do so. Doesn't require searching anything — it's a
// cheap, purely local calculation used for move ordering and to prune
// captures in quiescence that lose material outright.
function seeCapture(boardPos, move) {
    const square = move.posTo;
    const attackerColor = move.piece.color;
    const defenderColor = attackerColor === White ? Black : White;

    // Check the defender's pool first: if nothing recaptures at all, the
    // exchange ends after this one capture and SEE is trivially just the
    // captured piece's value -- skip computing our own attacker pool
    // entirely (a whole second getAttackers scan + sort) since it would
    // never be consulted anyway (most callers already skip this call
    // altogether via the same attackedPos check, see sortMoves -- this is a
    // defensive fast path for any other caller).
    const theirPool = getAttackers(boardPos, square, defenderColor).map(pieceValue).sort((a, b) => a - b);
    if (theirPool.length === 0) {
        return pieceValue(move.attPiece.type);
    }

    // getAttackers is queried against the board BEFORE the move, where the
    // moving piece is still at move.pos — since a legal capture move means
    // move.piece does attack move.posTo, it shows up in this scan too. It's
    // not "remaining" (it's the piece already used for the first capture,
    // now sitting ON the square as occupantValue below), so drop one
    // matching entry before treating the rest as our later recapture pool.
    const ourPool = getAttackers(boardPos, square, attackerColor).map(pieceValue).sort((a, b) => a - b);
    const moverIdx = ourPool.indexOf(pieceValue(move.piece.type));
    if (moverIdx !== -1) ourPool.splice(moverIdx, 1);

    const gain = [pieceValue(move.attPiece.type)];
    let occupantValue = pieceValue(move.piece.type);
    let pools = [theirPool, ourPool];
    let turn = 0; // 0 = defender's turn to recapture next, 1 = attacker's turn after that

    while (pools[turn].length > 0) {
        const capturerValue = pools[turn].shift();
        gain.push(occupantValue - gain[gain.length - 1]);
        occupantValue = capturerValue;
        turn = 1 - turn;
    }

    for (let i = gain.length - 1; i >= 1; i--) {
        gain[i - 1] = -Math.max(-gain[i - 1], gain[i]);
    }
    return gain[0];
}

function sortMoves(moveList, attackedPos, depth, boardPos) {
    const killers = depth != null && depth < MAX_KILLER_DEPTH ? killerMoves[depth] : null;
    for (let i = 0; i < moveList.length; i++) {
        const move = moveList[i];
        let moveScoreGuess = 0;
        const movePieceType = move.piece.type;
        const attPieceType = move.attPiece.type;

        if (attPieceType != None) {
            // SEE accounts for defenders, unlike plain MVV-LVA — a capture
            // that just loses material outright sorts below quiet moves
            // instead of ahead of them.
            if (!boardPos) {
                moveScoreGuess = 10 * pieceValue(attPieceType) - pieceValue(movePieceType);
            } else if (attackedPos[move.posTo] == None) {
                // attackedPos is already the defending side's full attack
                // map for this node (computed once, not per move) -- if it
                // shows no defender at all on the destination square, SEE's
                // exchange sequence would trivially resolve to just the
                // captured piece's value with nothing left to recapture
                // with. Skip the whole SEE computation (two getAttackers
                // scans + sorts) and use that exact same result directly.
                moveScoreGuess = 100 * pieceValue(attPieceType);
            } else {
                moveScoreGuess = 100 * seeCapture(boardPos, move);
            }
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
    }

    moveList.sort((a, b) => b.moveScoreGuess - a.moveScoreGuess);

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

// Expanded chess opening book
// Moves are in UCI (coordinate) notation, space-separated, in a single string per line.
// Organized by opening family / ECO-ish grouping, with named comments.

const openingBookLines = [

    // =========================================================
    // 1. e4 e5 — Open Games
    // =========================================================

    // --- Ruy Lopez (Spanish) ---
    "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6",          // Ruy Lopez, Closed / Morphy Defense
    "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 e8g8 c2c3 d7d5", // Ruy Lopez, Marshall Attack
    "e2e4 e7e5 g1f3 b8c6 f1b5 g8f6 e1g1 f6e4 d2d4 e4d6 b5c6 d7c6 d4e5 d6f5 d1d8 e8d8", // Ruy Lopez, Berlin Defense (endgame)
    "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5c6 d7c6 e1g1 f7f6",                              // Ruy Lopez, Exchange Variation
    "e2e4 e7e5 g1f3 b8c6 f1b5 d7d6 d2d4 c8d7",                                        // Ruy Lopez, Steinitz Defense
    "e2e4 e7e5 g1f3 b8c6 f1b5 f7f5",                                                  // Ruy Lopez, Schliemann/Jaenisch Gambit
    "e2e4 e7e5 g1f3 b8c6 f1b5 g7g6",                                                  // Ruy Lopez, Smyslov/Fianchetto Defense
    "e2e4 e7e5 g1f3 g8f6",                                                            // Ruy Lopez move order transposition

    // --- Italian Game ---
    "e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3 g8f6 d2d4 e5d4 c3d4 c5b4",                    // Giuoco Piano, main line
    "e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 b2b4 c5b4 c2c3 b4a5 d2d4",                          // Evans Gambit
    "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 f3g5 d7d5 e4d5 f6d5 g5f7 e8f7",                     // Two Knights, Fried Liver Attack
    "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 d2d3 f8c5 c2c3",                                    // Italian, Giuoco Pianissimo
    "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 f3g5 d7d5 e4d5 c6a5",                               // Two Knights, Polerio Defense

    // --- Scotch Game ---
    "e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 f8c5 c1e3 d8f6",                              // Scotch Game, Classical
    "e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 g8f6 d4c6 b7c6 e4e5 d8e7",                     // Scotch Game, Mieses Variation
    "e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 f8b4 b1c3",                                    // Scotch, Four Knights style

    // --- Four Knights / Three Knights ---
    "e2e4 e7e5 g1f3 b8c6 b1c3 g8f6 f1b5 f8b4",                                        // Four Knights, Spanish
    "e2e4 e7e5 g1f3 b8c6 b1c3 g8f6 d2d4 e5d4 f3d4",                                    // Four Knights, Scotch style
    "e2e4 e7e5 b1c3 g8f6 g1f3 b8c6",                                                   // Three Knights Game

    // --- Vienna Game ---
    "e2e4 e7e5 b1c3 g8f6 f2f4 d7d5",                                                   // Vienna Gambit
    "e2e4 e7e5 b1c3 b8c6 f1c4 g8f6 d2d3 f8c5",                                         // Vienna, Bishop's Opening style
    "e2e4 e7e5 b1c3 f8c5 g1f3 d7d6",                                                   // Vienna, quiet system

    // --- Petrov (Russian) Defense ---
    "e2e4 e7e5 g1f3 g8f6 f3e5 d7d6 e5f3 f6e4 d2d4 d6d5 f1d3 b8c6 e1g1 f8e7",           // Petrov, Classical
    "e2e4 e7e5 g1f3 g8f6 f3e5 d7d6 e5f3 f6e4 d1e2 d8e7 e2e4 d6d5",                     // Petrov, Steinitz Attack
    "e2e4 e7e5 g1f3 g8f6 b1c3 b8c6",                                                   // Petrov move-order/Four Knights transposition

    // --- King's Gambit ---
    "e2e4 e7e5 f2f4 e5f4 g1f3 g7g5 h2h4 g5g4 f3e5 d8h4",                              // King's Gambit Accepted, main
    "e2e4 e7e5 f2f4 e5f4 f1c4 d8h4 e1f1",                                              // King's Gambit, Bishop's Gambit
    "e2e4 e7e5 f2f4 f8c5",                                                             // King's Gambit Declined, Classical
    "e2e4 e7e5 f2f4 d7d5 e4d5 e5f4",                                                    // Falkbeer Counter-Gambit

    // --- Bishop's Opening / Center Game / Danish ---
    "e2e4 e7e5 f1c4 g8f6 d2d3 f8c5",                                                   // Bishop's Opening
    "e2e4 e7e5 d2d4 e5d4 d1d4 b8c6 d4e3",                                              // Center Game
    "e2e4 e7e5 d2d4 e5d4 c2c3 d4c3 f1c4 c3b2 c1b2",                                    // Danish Gambit

    // --- Philidor / Latvian / Elephant / Nimzowitsch ---
    "e2e4 e7e5 g1f3 d7d6 d2d4 g8f6 b1c3 b8d7",                                         // Philidor Defense
    "e2e4 e7e5 f2f4 f7f5",                                                             // Latvian Gambit-ish (King's Gambit reversed)
    "e2e4 e7e5 g1f3 d7d5",                                                             // Elephant Gambit
    "e2e4 b8c6",                                                                       // Nimzowitsch Defense

    // =========================================================
    // 2. e4 c5 — Sicilian Defense
    // =========================================================

    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6",                              // Najdorf Variation
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6 f2f3 e7e5",                     // Najdorf, English Attack
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6",                              // Dragon Variation
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6 c1e3 f8g7 f2f3 e8g8 d1d2",     // Dragon, Yugoslav Attack
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6 f1e2",                          // Dragon, quiet setups
    "e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3 e7e6",                              // Classical Sicilian, Scheveningen-like
    "e2e4 c7c5 g1f3 e7e6 d2d4 c5d4 f3d4 g8f6 b1c3 d7d6",                              // Scheveningen Variation
    "e2e4 c7c5 g1f3 e7e6 d2d4 c5d4 f3d4 b8c6 b1c3 d8c7",                              // Taimanov Variation
    "e2e4 c7c5 g1f3 e7e6 d2d4 c5d4 f3d4 a7a6",                                        // Kan Variation
    "e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3 e7e5",                              // Sveshnikov Variation
    "e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 e7e5",                                        // Kalashnikov Variation
    "e2e4 c7c5 g1f3 b8c6 f1b5 g7g6",                                                  // Rossolimo Variation
    "e2e4 c7c5 g1f3 b8c6 f1b5 e7e6",                                                  // Rossolimo, alternate
    "e2e4 c7c5 g1f3 d7d6 f1b5 c8d7",                                                  // Moscow Variation
    "e2e4 c7c5 b1c3 b8c6 g2g3 g7g6 f1g2 f8g7",                                        // Closed Sicilian
    "e2e4 c7c5 c2c3 g8f6 e4e5 f6d5 d2d4 c5d4 g1f3",                                    // Alapin Variation
    "e2e4 c7c5 b1c3 b8c6 f2f4 g7g6",                                                   // Grand Prix Attack
    "e2e4 c7c5 d2d4 c5d4 c2c3 d4c3 b1c3 b8c6",                                        // Smith-Morra Gambit
    "e2e4 c7c5 g1f3 g7g6",                                                             // Hyperaccelerated Dragon
    "e2e4 c7c5 g1f3 e7e6 c2c4",                                                        // Sicilian, Kan/Taimanov with c4

    // =========================================================
    // 3. e4 e6 — French Defense
    // =========================================================

    "e2e4 e7e6 d2d4 d7d5 b1c3 f8b4",                                                  // Winawer Variation
    "e2e4 e7e6 d2d4 d7d5 b1c3 f8b4 e4e5 c7c5 a2a3 b4c3 b2c3",                          // Winawer, Advance main
    "e2e4 e7e6 d2d4 d7d5 b1c3 g8f6 c1g5 f8e7 e4e5 f6d7",                              // Classical, Steinitz Variation
    "e2e4 e7e6 d2d4 d7d5 b1c3 g8f6 c1g5 d5e4",                                        // French, Burn Variation
    "e2e4 e7e6 d2d4 d7d5 b1d2 g8f6 e4e5 f6d7",                                        // Tarrasch, Closed
    "e2e4 e7e6 d2d4 d7d5 b1d2 c7c5",                                                  // Tarrasch, Open
    "e2e4 e7e6 d2d4 d7d5 e4e5 c7c5 c2c3 b8c6 g1f3 d8b6",                              // Advance Variation
    "e2e4 e7e6 d2d4 d7d5 e4d5 e6d5",                                                  // Exchange Variation
    "e2e4 e7e6 d2d4 d7d5 b1c3 d5e4 c3e4 g8f6 e4f6 g7f6",                              // Rubinstein Variation
    "e2e4 e7e6 b1c3 d7d5 g1f3",                                                       // French, Two Knights

    // =========================================================
    // 4. e4 c6 — Caro-Kann Defense
    // =========================================================

    "e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 c8f5 e4g3 f5g6 h2h4 h7h6",                    // Classical Variation
    "e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 b8d7",                                        // Karpov Variation
    "e2e4 c7c6 d2d4 d7d5 e4e5 c8f5 g1f3 e7e6 f1e2 c6c5",                              // Advance Variation
    "e2e4 c7c6 d2d4 d7d5 e4d5 c6d5 c2c4",                                             // Panov-Botvinnik Attack
    "e2e4 c7c6 d2d4 d7d5 e4d5 c6d5 f1d3",                                             // Exchange Variation
    "e2e4 c7c6 b1c3 d7d5 g1f3 c8g4",                                                  // Two Knights Variation
    "e2e4 c7c6 d2d4 d7d5 b1d2 d5e4 d2e4 g8f6",                                        // Modern Variation (Smyslov/Bronstein order)

    // =========================================================
    // 5. e4 d5 — Scandinavian Defense
    // =========================================================

    "e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 d2d4 g8f6 g1f3 c8g4",                              // Main Line
    "e2e4 d7d5 e4d5 d8d5 b1c3 d5d6",                                                  // Scandinavian, Qd6
    "e2e4 d7d5 e4d5 g8f6 d2d4 f6d5 g1f3 g7g6",                                        // Modern (Nf6) Variation
    "e2e4 d7d5 e4d5 g8f6 c2c4 c7c6 d2d4 c6d5 c4d5",                                   // Icelandic-Palme Gambit style

    // =========================================================
    // 6. e4 d6 / g6 — Pirc / Modern Defense
    // =========================================================

    "e2e4 d7d6 d2d4 g8f6 b1c3 g7g6 f2f4 f8g7",                                        // Pirc, Austrian Attack
    "e2e4 d7d6 d2d4 g8f6 b1c3 g7g6 g1f3 f8g7 f1e2 e8g8",                              // Pirc, Classical
    "e2e4 g7g6 d2d4 f8g7 b1c3 d7d6 f2f4 a7a6",                                        // Modern Defense
    "e2e4 g7g6 d2d4 f8g7 g1f3 d7d6 f1c4",                                             // Modern, Bishop's setup

    // =========================================================
    // 7. e4 Nf6 — Alekhine Defense
    // =========================================================

    "e2e4 g8f6 e4e5 f6d5 d2d4 d7d6 g1f3 g7g6",                                        // Alekhine, Modern Variation
    "e2e4 g8f6 e4e5 f6d5 d2d4 d7d6 c2c4 d5b6 f2f4",                                   // Alekhine, Four Pawns Attack
    "e2e4 g8f6 e4e5 f6d5 b1c3 d5c3 d2c3",                                             // Alekhine, Exchange-ish (Sämisch)

    // =========================================================
    // 8. d4 d5 — Queen's Gambit & Slav complexes
    // =========================================================

    "d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 f8e7 e2e3 e8g8 g1f3 b8d7",                    // QGD, Orthodox
    "d2d4 d7d5 c2c4 e7e6 c4d5 e6d5 b1c3 b8c6 g1f3 g8f6",                              // QGD, Exchange Variation
    "d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 b8d7 e2e3 c7c6 g1f3 d8a5",                    // QGD, Cambridge Springs
    "d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 f8e7 e2e3 e8g8 g1f3 h7h6 g5h4 b7b6",           // QGD, Tartakower Variation
    "d2d4 d7d5 c2c4 d5c4 g1f3 g8f6 e2e3 e7e6 f1c4 c7c5",                              // Queen's Gambit Accepted
    "d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 d5c4 a2a4 c8f5",                              // Slav Defense, main
    "d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 e7e6 e2e3 b8d7 f1d3 d5c4 d3c4 b7b5",           // Semi-Slav, Meran Variation
    "d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 e7e6 c1g5 h7h6",                              // Semi-Slav, Botvinnik/Anti-Meran
    "d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 a7a6",                                        // Chebanenko Slav
    "d2d4 d7d5 c1f4 g8f6 e2e3 e7e6 g1f3 f8d6 f4g3",                                   // London System
    "d2d4 d7d5 g1f3 g8f6 e2e3 e7e6 f1d3 c7c5 c2c3 b8c6",                              // Colle System
    "d2d4 g8f6 c1g5 e7e6 e2e4 h7h6 g5f6 d8f6",                                        // Trompowsky Attack
    "d2d4 d7d5 b1c3 g8f6 c1g5 b8d7",                                                  // Veresov Opening
    "d2d4 d7d5 c2c4 c7c6 c4d5 c6d5 b1c3 b8c6 g1f3 g8f6",                              // Exchange Slav

    // =========================================================
    // 9. d4 Nf6 — Indian Defenses
    // =========================================================

    "d2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 g1f3 e8g8 f1e2 e7e5",                    // King's Indian, Classical
    "d2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 f2f3 e8g8 c1e3",                          // King's Indian, Sämisch
    "d2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 f2f4",                                    // King's Indian, Four Pawns Attack
    "d2d4 g8f6 c2c4 g7g6 g1f3 f8g7 g2g3 e8g8 f1g2 d7d6",                              // King's Indian, Fianchetto
    "d2d4 g8f6 c2c4 g7g6 b1c3 d7d5 c4d5 f6d5 e2e4 d5c3 b2c3 f8g7",                     // Grünfeld, Exchange Variation
    "d2d4 g8f6 c2c4 g7g6 b1c3 d7d5 d1b3",                                             // Grünfeld, Russian System
    "d2d4 g8f6 c2c4 g7g6 g1f3 f8g7 g2g3 d7d5",                                        // Grünfeld, Fianchetto
    "d2d4 g8f6 c2c4 e7e6 b1c3 f8b4 d1c2 e8g8 a2a3 b4c3 c2c3",                          // Nimzo-Indian, Classical
    "d2d4 g8f6 c2c4 e7e6 b1c3 f8b4 e2e3 e8g8 f1d3 d7d5",                              // Nimzo-Indian, Rubinstein
    "d2d4 g8f6 c2c4 e7e6 b1c3 f8b4 a2a3 b4c3 b2c3 c7c5",                              // Nimzo-Indian, Sämisch
    "d2d4 g8f6 c2c4 e7e6 g1f3 b7b6 g2g3 c8b7 f1g2 f8e7",                              // Queen's Indian Defense
    "d2d4 g8f6 c2c4 e7e6 g1f3 d7d5 g2g3 f8e7 f1g2 e8g8",                              // Catalan Opening
    "d2d4 g8f6 c2c4 e7e6 g1f3 f8b4 b1d2",                                             // Bogo-Indian Defense
    "d2d4 g8f6 c2c4 c7c5 d4d5 e7e6 b1c3 e6d5 c4d5 d7d6 e2e4 g7g6",                     // Modern Benoni
    "d2d4 g8f6 c2c4 c7c5 d4d5 e7e5",                                                  // Czech Benoni
    "d2d4 g8f6 c2c4 c7c5 d4d5 b7b5",                                                  // Benko Gambit
    "d2d4 f7f5 g2g3 g8f6 f1g2 e7e6 g1f3 d7d5 e1g1 f8d6",                              // Dutch Defense, Stonewall
    "d2d4 f7f5 g2g3 g8f6 f1g2 g7g6 g1f3 f8g7 e1g1 e8g8",                              // Dutch Defense, Leningrad
    "d2d4 f7f5 g1f3 g8f6 g2g3 e7e6 f1g2 f8e7 e1g1 e8g8",                              // Dutch Defense, Classical
    "d2d4 g8f6 c2c4 e7e5 d4e5 f6e4",                                                  // Budapest Gambit

    // =========================================================
    // 10. Flank Openings
    // =========================================================

    "c2c4 c7c5 g1f3 g8f6 b1c3 b8c6 g2g3 g7g6 f1g2 f8g7",                              // English, Symmetrical
    "c2c4 e7e5 b1c3 g8f6 g1f3 b8c6 g2g3 d7d5 c4d5 f6d5",                              // English, Reversed Sicilian
    "c2c4 g8f6 b1c3 e7e5 g1f3 b8c6 g2g3 d7d5",                                        // English, Four Knights
    "c2c4 g8f6 b1c3 e7e6 e2e4 d7d5",                                                  // English, Mikenas-Carls
    "c2c4 e7e6 b1c3 d7d5 d2d4 g8f6",                                                  // English, QGD transposition
    "g1f3 d7d5 c2c4 e7e6 g2g3 g8f6 f1g2 f8e7 e1g1 e8g8",                              // Reti Opening
    "g1f3 g8f6 c2c4 g7g6 b1c3 f8g7 d2d4 e8g8",                                        // Reti / King's Indian transposition
    "f2f4 d7d5 g1f3 g8f6 e2e3 g7g6",                                                  // Bird's Opening
    "f2f4 d7d5 b2b3",                                                                 // Bird's Opening, Leningrad-ish
    "b2b3 e7e5 c1b2 b8c6 e2e3 g8f6",                                                  // Larsen's Opening
    "g1f3 d7d5 g2g3 g8f6 f1g2 c7c5 e1g1 b8c6",                                        // King's Indian Attack
    "b2b4 e7e5 c1b2 b8c6 e2e3 g8f6",                                                  // Polish Opening (Sokolsky)
    "g2g4 d7d5 f1g2 c8g4",                                                            // Grob's Attack
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

// Dynamic time budgeting: a flat per-move budget spends the same amount of
// thought on a forced recapture as on a genuinely sharp position. Every
// move starts with AI_BASE_TIME_MS, but the budget grows (up to
// AI_MAX_TIME_MS) when the position looks unsettled — the best move keeps
// changing between iterations, or the score just dropped, both signs the
// engine only recently noticed something important. The full budget always
// gets used otherwise — depth keeps increasing for as long as time allows,
// there's no "the answer looks settled, stop early" shortcut, since more
// depth is never wasted.
const AI_BASE_TIME_MS = 3000;
const AI_MAX_TIME_MS = 6000;
const AI_EXTEND_MIN_DEPTH = 4; // don't react to instability before this -- shallow iterations are cheap and naturally noisy

let lastSearchDepth = 0;
let lastSearchScore = null; // null means "no real search yet" (e.g. a book move)
let lastSearchTimeMs = 0;

// Updates the depth/eval/time readout in the UI (built in chess.js). Kept
// here since it's driven entirely by playAi2's own search state.
function updateSearchInfo() {
    if (typeof searchInfoLabel === "undefined" || !searchInfoLabel) return;
    if (lastSearchScore === null) {
        searchInfoLabel.textContent = "Book move  ·  " + lastSearchTimeMs + "ms";
        return;
    }
    const display = lastSearchScore >= 0 ? "+" + lastSearchScore.toFixed(2) : lastSearchScore.toFixed(2);
    searchInfoLabel.textContent = "Depth " + lastSearchDepth + "  ·  Eval " + display + "  ·  " + lastSearchTimeMs + "ms";
}

function playAi2() {
    const searchStartTime = Date.now();

    const bookMove = getBookMove(boardPosition, whiteToMove, lastMove, WhiteKingPos, BlackKingPos);
    if (bookMove) {
        lastSearchDepth = 0;
        lastSearchScore = null;
        lastSearchTimeMs = Date.now() - searchStartTime;
        updateSearchInfo();
        return bookMove;
    }

    searchDeadline = Date.now() + AI_BASE_TIME_MS;
    const hardDeadline = Date.now() + AI_MAX_TIME_MS;
    searchAborted = false;
    resetSearchState();

    // Computed once here (the root position doesn't change across
    // iterative-deepening passes) rather than being rederived from scratch
    // at every node below — see updateHashForMove.
    const rootHash = computeHash(boardPosition, whiteToMove);

    let bestMove = null;
    let firstLegalMove = null;
    // Score of the last usable depth, used to center the next depth's
    // aspiration window (scores rarely swing much between one iterative-
    // deepening pass and the next).
    let aspirationCenter = null;
    let previousBestMove = null;
    let previousScore = null;

    // Iterative deepening against a wall-clock budget: each pass seeds the
    // TT/killers/history so the next pass orders and prunes far more
    // effectively. If a pass gets interrupted partway through, whatever it
    // found among the root moves it DID finish evaluating before running
    // out of time is still kept — a partial look at a deeper ply is more
    // informative than falling all the way back to the previous, shallower
    // depth's complete answer, as long as at least one root move (the
    // best-ordered one, searched first) was cleanly evaluated at this depth.
    for (let depth = 1; depth <= 40; depth++) {
        const color = whiteToMove ? Black : White;
        const attackedPos = getAttackedPosition(boardPosition, color);
        let rootMoves = sortMoves(
            getAllMoves(whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos),
            attackedPos,
            null,
            boardPosition
        );
        if (firstLegalMove === null && rootMoves.length > 0) firstLegalMove = rootMoves[0];

        // Bring the previous iteration's best move to the front of root list
        if (bestMove !== null) {
            const hmIdx = rootMoves.findIndex((m) => moveEquals(m, bestMove));
            if (hmIdx > 0) rootMoves.unshift(rootMoves.splice(hmIdx, 1)[0]);
        }

        const nextWTM = !whiteToMove;

        // Aspiration windows: search this depth with a narrow window around
        // the previous depth's score first — a much tighter window prunes
        // far more aggressively throughout the whole subtree, not just at
        // the root. If the true score falls outside it (fail-low/fail-high),
        // widen and re-search. The last allowed attempt always uses a fully
        // open window, so correctness never depends on the guess being good.
        let windowSize = 0.75;
        let searchAlpha = aspirationCenter === null || depth <= 2 ? -999999 : aspirationCenter - windowSize;
        let searchBeta = aspirationCenter === null || depth <= 2 ? 999999 : aspirationCenter + windowSize;
        const MAX_ASPIRATION_ATTEMPTS = 5;

        let depthBestMove = null;
        let depthScore = null;
        let depthAborted = false;

        for (let attempt = 0; attempt < MAX_ASPIRATION_ATTEMPTS; attempt++) {
            if (attempt === MAX_ASPIRATION_ATTEMPTS - 1) {
                searchAlpha = -999999;
                searchBeta = 999999;
            }
            let alpha = searchAlpha;
            const beta = searchBeta;
            let attemptBestMove = null;
            let attemptAborted = false;

            for (let i = 0; i < rootMoves.length; i++) {
                const move = rootMoves[i];
                const newBoardPos = moveToBoard(move, boardPosition);
                // Root of the make/unmake subtree for this move: attach a
                // freshly-rebuilt live bitboard state that every makeMove/
                // unmakeMove below this point will maintain incrementally in
                // O(1), instead of resyncing from scratch on every node.
                newBoardPos.__liveBB = syncBitboards(newBoardPos);
                let childWKPos = WhiteKingPos;
                let childBKPos = BlackKingPos;
                if (move.piece.type === King) {
                    if (move.piece.color === Black) childBKPos = move.posTo;
                    else childWKPos = move.posTo;
                }
                const childHash = updateHashForMove(rootHash, move);

                let val;
                if (i === 0) {
                    val = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -beta, -alpha, 0, childHash);
                } else {
                    val = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -alpha - 1, -alpha, 0, childHash);
                    if (!searchAborted && val > alpha && val < beta) {
                        val = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -beta, -alpha, 0, childHash);
                    }
                }

                if (searchAborted) {
                    attemptAborted = true;
                    break;
                }
                if (val > alpha) {
                    alpha = val;
                    attemptBestMove = move;
                }
            }

            if (attemptAborted) {
                // The move being searched when time ran out has an
                // unreliable value (its own subtree was cut short), so it's
                // discarded — but every move searched BEFORE it at this
                // depth (starting with the best-ordered one, searched
                // first) completed cleanly, and their comparison is
                // perfectly valid. Keep that partial result instead of
                // throwing away a deeper look entirely.
                depthAborted = true;
                if (attemptBestMove !== null) {
                    depthBestMove = attemptBestMove;
                    depthScore = alpha;
                }
                break;
            }

            const failedLow = searchAlpha > -999999 && alpha <= searchAlpha;
            const failedHigh = searchBeta < 999999 && alpha >= searchBeta;
            if (failedLow || failedHigh) {
                windowSize *= 4;
                searchAlpha = Math.max(-999999, aspirationCenter - windowSize);
                searchBeta = Math.min(999999, aspirationCenter + windowSize);
                continue;
            }

            depthBestMove = attemptBestMove;
            depthScore = alpha;
            break;
        }

        if (depthBestMove !== null) {
            const moveChanged = previousBestMove !== null && !moveEquals(previousBestMove, depthBestMove);
            const scoreDropped = previousScore !== null && depthScore < previousScore - 0.4;

            bestMove = depthBestMove;
            aspirationCenter = depthScore;
            lastSearchDepth = depth;
            lastSearchScore = whiteToMove ? depthScore : -depthScore; // always from White's perspective, matching the eval bar

            if (!depthAborted && depth >= AI_EXTEND_MIN_DEPTH && (moveChanged || scoreDropped)) {
                // The answer just shifted or the score just dropped -- this
                // position needs more room before committing to it, rather
                // than cutting off on the original schedule.
                searchDeadline = Math.max(searchDeadline, Math.min(hardDeadline, Date.now() + AI_BASE_TIME_MS * 0.6));
            }

            previousBestMove = bestMove;
            previousScore = depthScore;
        }
        if (depthAborted) break;
        if (depthScore !== null && depthScore > 900000) break; // forced mate found, no need to search deeper
        if (rootMoves.length <= 1) break; // nothing left to iterate on
        if (Date.now() >= searchDeadline) break;
    }

    asdsa = 0;
    lastSearchTimeMs = Date.now() - searchStartTime;
    updateSearchInfo();
    return bestMove || firstLegalMove;
}

async function AivsAi() {
    while (1) {
        if (gameOver) break;
        await playAiTurn();
        if (gameOver) break;
        await sleep(10);
    }
}
