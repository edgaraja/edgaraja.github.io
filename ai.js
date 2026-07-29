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
        if (((moveList[i].piece) & 7) == King) {
            if (((moveList[i].piece) & 24) == Black) {
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
        if (((moveList[i].piece) & 7) == King) {
            if (((moveList[i].piece) & 24) == Black) {
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

const DIAGONAL_MOBILITY_STEPS = [7, 9, -7, -9];
const ORTHOGONAL_MOBILITY_STEPS = [8, -8, -1, 1];

// Cheap pseudo-mobility: count of squares a sliding piece could reach or
// capture on, ignoring whether that would leave its own king in check.
// Mirrors the same ray-walk bounds used throughout chess.js/getcapture.js.
//
// Previously built a fresh array of 4 {step, bound, guard} objects (8
// closures total) on every single call -- once per bishop/rook/queen per
// Evaluate() call, itself run on every quiescence node, this was one of
// the largest single self-time costs in the whole engine per profiling.
// Rewritten to use two hoisted, allocation-free step arrays with the same
// bound/wrap checks inlined instead of captured in per-call closures:
// - bound (would `cur + step` land on-board at all) reduces algebraically
//   to a plain `cur + step` in-range test for every direction (verified
//   against the original per-direction bound constants: e.g. step 7's
//   `p <= 56` is exactly `p + 7 <= 63`, step -9's `p >= 9` is exactly
//   `p - 9 >= 0`, and so on for all eight).
// - guard (does stepping wrap around a file/rank edge) only does real work
//   for diagonal steps and for the two horizontal (+1/-1) orthogonal
//   steps; vertical (+8/-8) steps can never wrap (same file every step) so
//   they need no check, matching the original's `guard: () => true`.
function slidingMobility(boardPos, pos, color, diagonal) {
    let count = 0;
    const steps = diagonal ? DIAGONAL_MOBILITY_STEPS : ORTHOGONAL_MOBILITY_STEPS;
    for (const step of steps) {
        let cur = pos;
        while (true) {
            const next = cur + step;
            if (next < 0 || next > 63) break;
            // fileAt(x)'s "+1" offset always cancels out of a diff() of two
            // fileAt() calls, so the wrap check reduces to comparing
            // cur>>3/next>>3 (equivalent to fileAt's Math.floor(x/8) for
            // any non-negative x, which cur/next always are here) directly
            // -- avoids two fileAt() + one diff() call per step, on what
            // profiling showed was one of the hottest loops in the engine.
            if (diagonal) {
                if (Math.abs((cur >> 3) - (next >> 3)) != 1) break;
            } else if (step === 1 || step === -1) {
                if ((cur >> 3) != (next >> 3)) break;
            }
            cur = next;
            if (((boardPos[cur]) & 7) != None) {
                if (((boardPos[cur]) & 24) != color) count++;
                break;
            }
            count++;
        }
    }
    return count;
}

// Hoisted out of knightMobility: profiling showed a fresh copy of this
// array (plus its 8 nested arrays) being allocated on every single call --
// once per knight per Evaluate() call, which itself runs on every
// quiescence node -- was one of the single largest self-time costs in the
// whole engine. The values never depend on anything call-specific, so
// there's no reason to rebuild it every time.
const KNIGHT_MOBILITY_OFFSETS = [
    [15, 2, 1], [17, 2, 1], [6, 1, 2], [10, 1, 2],
    [-15, 2, 1], [-17, 2, 1], [-6, 1, 2], [-10, 1, 2],
];

function knightMobility(boardPos, pos, color) {
    let count = 0;
    // fileAt/rankAt's constant offsets always cancel out of a diff() of two
    // calls (same reasoning as slidingMobility above), so this compares the
    // raw file-group/rank arithmetic directly instead of calling
    // fileAt/rankAt/diff sixteen times per knight.
    const posGroup = pos >> 3;
    const posRank = pos & 7;
    for (const [off, fd, rd] of KNIGHT_MOBILITY_OFFSETS) {
        const p = pos + off;
        if (p < 0 || p > 63) continue;
        if (Math.abs(posGroup - (p >> 3)) == fd && Math.abs(posRank - (p & 7)) == rd) {
            if (((boardPos[p]) & 24) != color) count++;
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

// A piece with almost nowhere left to go is at serious risk of being
// trapped and lost outright a few moves from now -- something the plain
// per-square mobility bonus above is far too small to flag on its own (its
// full range is worth well under a fifth of a pawn even at a piece's
// maximum mobility). This adds a much steeper penalty specifically as
// legal squares run out, scaled to what the piece itself is worth, so the
// static eval visibly worsens each move a piece gets boxed in further --
// well before the actual capture would ever come within the search's
// horizon. Deliberately ignores whether the remaining squares are
// themselves safe (that would need a full attack-map lookup inside the
// hottest function in the engine) -- being down to 0-2 squares to move to
// AT ALL, safe or not, is already a strong enough trapped-piece signal on
// its own.
function lowMobilityPenalty(mobility, pieceValuePawns) {
    if (mobility >= 3) return 0;
    return (3 - mobility) * pieceValuePawns * 4;
}

// A piece sitting on a square the opponent attacks, with nothing of its own
// side able to recapture there, is about to be lost for nothing -- and
// unlike a piece merely losing mobility (see lowMobilityPenalty above),
// this is the direct "is it actually hanging right now" signal, which
// generic material+PST+mobility terms don't capture at all on their own.
//
// Uses squareAttackerType (a per-square scan, chess.js/bitboard.js) rather
// than either a per-piece getAttackers call or a precomputed whole-board
// attack map: this function runs once for every piece on the board on
// every single Evaluate() call, which itself runs at every quiescence node,
// so profiling drove two iterations here. getAttackers (full attacker list
// per square) was the dominant search cost on a full 32-piece board;
// switching to two whole-board getAttackedPosition maps per Evaluate() call
// helped some but was still a top cost, since it does 64 squares' worth of
// work whether the board has 3 pieces or 30. squareAttackerType answers
// "what's the cheapest attacker of THIS square" with the same per-square,
// early-exit scan isSquareAttacked already uses on the move-legality hot
// path -- proportional to piece count, not board size, and the cheapest of
// the three approaches at every piece density tried.
function hangingPenalty(boardPos, sq, piece) {
    const enemyColor = ((piece) & 24) === White ? Black : White;
    const attackerType = squareAttackerType(boardPos, sq, enemyColor);
    // A lone king "attacking" (standing adjacent to) a piece isn't a real
    // material threat the way any other attacker is: it only matters if
    // it's literally the opponent's very next move AND the piece truly has
    // nowhere to go, which the ordinary search -- many plies deep in
    // exactly these sparse, low-material positions -- already resolves
    // correctly on its own. Counting king adjacency here as "hanging"
    // instead creates a false signal that fights the king-and-major-piece
    // approaching the lone enemy king -- the core technique needed to
    // actually deliver mate in these endgames (K+R vs K, K+Q vs K, etc.) --
    // verified empirically to turn "won but not yet mated" into a
    // permanent, non-progressing draw. squareAttackerType checks King last
    // specifically so a real simultaneous attacker is never masked by it.
    if (attackerType === None || attackerType === King) return 0;

    const pieceVal = pieceValue(((piece) & 7));
    const minAttackerVal = pieceValue(attackerType);

    if (squareAttackerType(boardPos, sq, ((piece) & 24)) === None) {
        // Nothing at all recaptures -- any attacker just wins the piece
        // outright next move. Scaled down from the full value since this
        // is only a static single-node threat estimate, not a certainty
        // (the side to move, if it owns this piece, still gets to react),
        // but it should still dominate over mobility-scale terms, since
        // losing the piece outright is a near-full-value swing.
        return pieceVal * 0.9;
    }
    if (minAttackerVal < pieceVal) {
        // Even with a recapture available, the cheapest attacker still
        // wins material on the exchange (attacker takes the bigger piece,
        // the defender only recaptures the now-lesser attacker) -- a
        // "safe" combination for the attacking side regardless of who else
        // is defending.
        return (pieceVal - minAttackerVal) * 0.8;
    }
    return 0;
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
        if (((p) & 7) == None) continue;
        const col = i % 8;
        const row = Math.floor(i / 8);

        if (((p) & 7) != King) {
            const penalty = hangingPenalty(boardPos, i, p);
            if (((p) & 24) == Black) evalBlack -= penalty;
            else evalWhite -= penalty;
        }

        if (((p) & 24) == Black) {
            if (((p) & 7) == King) {
                blackKingPos = i;
            } else if (((p) & 7) == Queen) {
                const mob = slidingMobility(boardPos, i, Black, true) + slidingMobility(boardPos, i, Black, false);
                evalBlack += 900 + queenMap[i] / 10;
                evalBlack += mob;
                evalBlack -= lowMobilityPenalty(mob, 9);
                phaseAccum += PHASE_QUEEN;
                blackMaterial += 9;
            } else if (((p) & 7) == Rook) {
                const mob = slidingMobility(boardPos, i, Black, false);
                evalBlack += 500;
                evalBlack += 2 * mob;
                evalBlack -= lowMobilityPenalty(mob, 5);
                blackRookSquares.push(i);
                phaseAccum += PHASE_ROOK;
                blackMaterial += 5;
            } else if (((p) & 7) == Knight) {
                const mob = knightMobility(boardPos, i, Black);
                evalBlack += 300 + knightMap[i] / 10;
                evalBlack += 2 * mob;
                evalBlack -= lowMobilityPenalty(mob, 3);
                phaseAccum += PHASE_KNIGHT;
                blackMaterial += 3;
            } else if (((p) & 7) == Bishop) {
                const mob = slidingMobility(boardPos, i, Black, true);
                evalBlack += 300 + bishopMap[i] / 10;
                evalBlack += 2 * mob;
                evalBlack -= lowMobilityPenalty(mob, 3);
                blackBishops++;
                blackBishopSquares.push(i);
                phaseAccum += PHASE_BISHOP;
                blackMaterial += 3;
            } else if (((p) & 7) == Pawn) {
                evalBlack += 100;
                blackPawnSquares.push(i);
                blackPawnColsRows[col].push(row);
                blackPawnsByColor[squareColor(i)]++;
                blackMaterial += 1;
            }
        } else {
            if (((p) & 7) == King) {
                whiteKingPos = i;
            } else if (((p) & 7) == Queen) {
                const mob = slidingMobility(boardPos, i, White, true) + slidingMobility(boardPos, i, White, false);
                evalWhite += 900 + queenMap[mirrorRank(i)] / 10;
                evalWhite += mob;
                evalWhite -= lowMobilityPenalty(mob, 9);
                phaseAccum += PHASE_QUEEN;
                whiteMaterial += 9;
            } else if (((p) & 7) == Rook) {
                const mob = slidingMobility(boardPos, i, White, false);
                evalWhite += 500;
                evalWhite += 2 * mob;
                evalWhite -= lowMobilityPenalty(mob, 5);
                whiteRookSquares.push(i);
                phaseAccum += PHASE_ROOK;
                whiteMaterial += 5;
            } else if (((p) & 7) == Knight) {
                const mob = knightMobility(boardPos, i, White);
                evalWhite += 300 + knightMap[mirrorRank(i)] / 10;
                evalWhite += 2 * mob;
                evalWhite -= lowMobilityPenalty(mob, 3);
                phaseAccum += PHASE_KNIGHT;
                whiteMaterial += 3;
            } else if (((p) & 7) == Bishop) {
                const mob = slidingMobility(boardPos, i, White, true);
                evalWhite += 300 + bishopMap[mirrorRank(i)] / 10;
                evalWhite += 2 * mob;
                evalWhite -= lowMobilityPenalty(mob, 3);
                whiteBishops++;
                whiteBishopSquares.push(i);
                phaseAccum += PHASE_BISHOP;
                whiteMaterial += 3;
            } else if (((p) & 7) == Pawn) {
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

    // Rook on an open/semi-open file: reuses whiteRookSquares/blackRookSquares
    // (already collected by the main per-square loop above, for the PST
    // scoring just above this) instead of re-scanning all 64 squares again
    // just to re-find the same rooks -- Evaluate() runs on every quiescence
    // leaf (the single most frequently visited node type in the whole
    // search), so a whole extra O(64) pass here was pure waste.
    for (const sq of whiteRookSquares) {
        const col = sq % 8;
        if (whitePawnColsRows[col].length === 0) {
            evalWhite += blackPawnColsRows[col].length === 0 ? 20 : 10;
        }
    }
    for (const sq of blackRookSquares) {
        const col = sq % 8;
        if (blackPawnColsRows[col].length === 0) {
            evalBlack += whitePawnColsRows[col].length === 0 ? 20 : 10;
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
    return (((piece) & 24) === White ? 0 : 6) + (((piece) & 7) - 1);
}

function computeHash(boardPos, WTM) {
    let h = 0;
    for (let i = 0; i < 64; i++) {
        const p = boardPos[i];
        if (((p) & 7) !== None) {
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
    } else if (((move.attPiece) & 7) !== None) {
        h = (h ^ zobristPieces[move.posTo][pieceIndex(move.attPiece)]) >>> 0;
    }

    const destPiece = move.isPromoted ? move.promotedTo : move.piece;
    h = (h ^ zobristPieces[move.posTo][pieceIndex(destPiece)]) >>> 0;

    if (move.isCastle) {
        const rookFrom = move.castleType === "l" ? move.posTo - 2 : move.posTo + 1;
        const rookTo = move.castleType === "l" ? move.posTo + 1 : move.posTo - 1;
        const rookIdx = pieceIndex(((move.piece) & 24) | Rook);
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
//
// Writes into the existing slot array's fields in place (existing[0] = ...)
// rather than replacing transpositionTable[ttIndex] with a freshly literal
// array, for every slot that's already been touched at least once -- this
// function runs roughly once per internal search node, so "allocate a new
// 5-element array" was one of the hottest per-node allocations in the whole
// engine. Only ever allocates on a slot's very first-ever write (existing
// === null), so this costs nothing extra up front: the table still starts
// as TT_SIZE cheap nulls, and memory grows exactly as it always did, one
// real array per slot actually used -- just without re-allocating that same
// array over and over on every later write to an already-used slot.
//
// Caller note: SearchNode's own TT probe (`const tte = transpositionTable
// [ttIndex]`) never holds onto `tte` across a recursive Search call, only
// reading its fields immediately and copying out `hashMove` (a Move
// reference, not the slot array itself) -- that invariant now matters for
// correctness, not just style, since a slot array can be mutated later by
// an unrelated node that happens to collide on the same ttIndex. Don't add
// a new `tte` read that survives across a recursive call without accounting
// for that.
function storeTTEntry(ttIndex, hash, depth, value, flag, move) {
    const existing = transpositionTable[ttIndex];
    if (existing === null) {
        transpositionTable[ttIndex] = [hash, depth, value, flag, move];
    } else if (existing[0] !== hash || depth >= existing[1]) {
        existing[0] = hash;
        existing[1] = depth;
        existing[2] = value;
        existing[3] = flag;
        existing[4] = move;
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

// Preallocated, ply-indexed scratch arrays for "quiet moves actually
// searched at this node so far" (see quietsSearched in SearchNode) --
// reused across calls instead of allocating a fresh array on every single
// SearchNode invocation, the same grow-on-demand pooling chess.js's
// getUndoSlot already uses for make/unmake. Indexing by ply (not depth) is
// what makes reuse safe: within one root-to-current-node call chain, ply
// increases by exactly one at every recursive Search call, so no two
// SIMULTANEOUSLY ACTIVE SearchNode frames ever share a slot -- a sibling
// reusing the same ply only ever does so after the previous occupant has
// already returned.
const quietsScratchPool = [];
function getQuietsScratch(ply) {
    while (quietsScratchPool.length <= ply) quietsScratchPool.push([]);
    const arr = quietsScratchPool[ply];
    arr.length = 0;
    return arr;
}

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

// Mate scoring: a forced mate is worth MATE_SCORE minus the number of plies
// it takes to deliver (see the moveList.length === 0 case in SearchNode
// below), instead of a single flat constant regardless of distance. Without
// this, every forced mate -- whether delivered in 2 plies or 20 -- looked
// identical to the search (exactly ±999999), so alpha-beta had no basis to
// prefer the faster one: whichever mating line move ordering happened to
// examine first won the tie, which is what let the AI "find a mate" while
// shuffling for many extra moves instead of finishing in the minimum number.
// Decaying by ply also gives the search a reason to keep pushing toward
// mate every move rather than drifting into a repetition/50-move draw once
// a won-but-not-yet-mating endgame (e.g. K+R vs K) is reached, since a
// nearer mate now strictly outscores a more distant one instead of tying.
const MATE_SCORE = 900000;
// Any |score| beyond this is a mate score (MATE_SCORE minus some ply count
// far below this margin) rather than a real positional evaluation -- used
// to tell the two apart when adjusting scores for TT storage/retrieval and
// when deciding whether iterative deepening can stop early.
const MATE_THRESHOLD = MATE_SCORE - 1000;

// Transposition table entries are keyed only by position, not by the ply at
// which they were reached, but a mate score returned from deep in the tree
// is only meaningful relative to the ply it was found at (e.g. "mate in 3
// from here"). Storing/retrieving it as one flat number would silently
// change its meaning ("mate in 3 from here" is a different absolute score
// depending on how far "here" is from the actual search root) the moment a
// transposition reaches that same position at a different ply. The
// standard fix: normalize to "distance from this node" before storing
// (independent of path), then re-express relative to the current root once
// retrieved.
function scoreToTT(score, ply) {
    if (score >= MATE_THRESHOLD) return score + ply;
    if (score <= -MATE_THRESHOLD) return score - ply;
    return score;
}
function scoreFromTT(score, ply) {
    if (score >= MATE_THRESHOLD) return score - ply;
    if (score <= -MATE_THRESHOLD) return score + ply;
    return score;
}

function Search(depth, WTM, boardPos, lm, WKPos, BKPos, alpha, beta, extensionsUsed, hash, ply) {
    asdsa++;
    if (searchAborted) return alpha;
    if ((asdsa & 2047) === 0 && Date.now() > searchDeadline) {
        searchAborted = true;
        return alpha;
    }
    if (depth === 0) {
        return SearchAllCapture(WTM, boardPos, lm, WKPos, BKPos, alpha, beta, ply, 0);
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
        result = SearchNode(depth, WTM, boardPos, lm, WKPos, BKPos, alpha, beta, hash, extensionsUsed || 0, ply);
    } finally {
        const c = searchPathCounts.get(hash) - 1;
        if (c <= 0) searchPathCounts.delete(hash);
        else searchPathCounts.set(hash, c);
    }
    return result;
}

function SearchNode(depth, WTM, boardPos, lm, WKPos, BKPos, alpha, beta, hash, extensionsUsed, ply) {
    const originalAlpha = alpha;
    const ttIndex = hash & TT_MASK;
    const tte = transpositionTable[ttIndex];
    let hashMove = null;

    if (tte !== null && tte[0] === hash) {
        // Always grab the stored best move for ordering, regardless of depth
        if (tte[4]) hashMove = tte[4];
        // Only use the stored eval if the entry was searched at least as deep
        if (tte[1] >= depth) {
            const ttScore = scoreFromTT(tte[2], ply);
            if (tte[3] === TT_EXACT)                     return ttScore;
            if (tte[3] === TT_ALPHA && ttScore <= alpha) return alpha;
            if (tte[3] === TT_BETA  && ttScore >= beta)  return beta;
        }
    }

    let color;
    let kingPos;
    if (((lm.piece) & 24) == White) {
        color = White;
        kingPos = BKPos;
    } else {
        color = Black;
        kingPos = WKPos;
    }
    const inCheck = isSquareAttacked(boardPos, kingPos, color);

    // Internal Iterative Reduction: no stored move from a prior search of
    // this exact position (hashMove above) means this node's move ordering
    // is flying blind -- searching it at full depth anyway is comparatively
    // expensive for what it's likely to learn. Shaving one ply off instead
    // (the same "look cheaper first" idea LMR already applies per-move,
    // just applied to the whole node) still populates the TT with a real
    // best move for this position, which any later revisit (a
    // transposition, or the next iterative-deepening pass) then gets to use
    // for full-strength ordering immediately. `depth` is mutated in place
    // (not just used locally) so every depth-dependent read below --
    // canPruneByEval, the RFP/futility margins, childDepth, LMR, and both
    // storeTTEntry calls at the bottom of this function -- consistently
    // reflects the node actually having been searched one ply shallower;
    // the TT entry MUST record the depth actually used, or a later
    // `tte[1] >= depth` check elsewhere would wrongly trust it as if it were
    // one ply deeper than it really is. Requires depth >= 5 (strictly above
    // PRUNING_MAX_DEPTH even after the decrement) so this never newly
    // qualifies a node for the shallow-depth pruning below that wouldn't
    // already have qualified without it, and pieceCount > 6 plus !inCheck
    // for the same sparse-endgame/unreliable-static-picture reasons
    // canPruneByEval itself is gated that way (see its own comment) --
    // guessing wrong about "probably not worth full depth" is most costly
    // in exactly those two situations.
    const IIR_MIN_DEPTH = 5;
    if (hashMove === null && depth >= IIR_MIN_DEPTH && !inCheck && pieceCount > 6) {
        depth--;
    }

    // Both reverse futility pruning (below) and per-move futility pruning
    // (in the move loop) need the position's static eval, but only at
    // shallow depth, never while in check (the static eval is unreliable
    // mid-check -- material can swing wildly on the very next forced
    // reply), and never near a mate score (a plain material margin
    // comparison is meaningless once mate distance dominates the score --
    // see MATE_THRESHOLD). Also gated on pieceCount > 6, the SAME threshold
    // null-move pruning above already uses and for the same underlying
    // reason: in a low-material endgame, a "quiet" move is often exactly
    // the precise check or king step that delivers the mate, and pruning
    // it because it doesn't change material is exactly wrong there. This
    // was verified empirically, not theoretically -- an earlier version
    // without this guard passed every other regression check but caused
    // the search to flicker between "mate found" and "no mate" forever in
    // a real K+R vs K endgame, never actually completing it, because the
    // one quiet check that finishes the mate kept getting futility-pruned
    // away. Dense middlegame positions (where this pruning's real payoff
    // is) are unaffected by the guard; sparse endgames already reach deep
    // depths easily without it, so there's little speed to trade away.
    const PRUNING_MAX_DEPTH = 3;
    const canPruneByEval = !inCheck && depth <= PRUNING_MAX_DEPTH && pieceCount > 6 &&
        Math.abs(beta) < MATE_THRESHOLD && Math.abs(alpha) < MATE_THRESHOLD;
    const staticEval = canPruneByEval ? Evaluate(WTM, boardPos) : null;

    // Reverse futility pruning (a.k.a. static null-move pruning): if the
    // position already looks this good from a plain static eval, well
    // beyond what any single real move at this shallow a depth could
    // plausibly swing away, assume the opponent has nothing that prevents
    // it from holding up and prune the entire node -- no moves generated,
    // no recursion. The margin widens per remaining ply since more depth
    // means more chances for the position to actually turn out worse than
    // it looks right now.
    const RFP_MARGIN_PER_DEPTH = 0.9;
    if (canPruneByEval && staticEval - RFP_MARGIN_PER_DEPTH * depth >= beta) {
        return beta;
    }

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
    // and right after another null move (((lm.piece) & 7) === None marks
    // that; two passes in a row just reproduce the original position).
    if (depth >= 3 && !inCheck && pieceCount > 6 && ((lm.piece) & 7) !== None) {
        const R = 2;
        const nullMove = { piece: ((WTM ? White : Black) | (None) | ((false) ? 32 : 0)), pos: -1, posTo: -1 };
        const nullScore = -Search(depth - 1 - R, !WTM, boardPos, nullMove, WKPos, BKPos, -beta, -beta + 1, extensionsUsed, nullMoveHash(hash), ply + 1);
        if (searchAborted) return alpha;
        if (nullScore >= beta) {
            return beta;
        }
    }

    let moveList = sortMoves(getAllMoves(WTM, boardPos, lm, WKPos, BKPos), boardPos, color, depth);

    // Move the hash move to the front so it is searched first
    if (hashMove !== null) {
        const hmIdx = moveList.findIndex((m) => moveEquals(m, hashMove));
        if (hmIdx > 0) moveList.unshift(moveList.splice(hmIdx, 1)[0]);
    }

    const nextWTM = !WTM;
    if (moveList.length === 0) {
        return inCheck ? -(MATE_SCORE - ply) : 0;
    }

    let bestMove = null;

    // Futility pruning margins for the per-move skip below: how much a
    // quiet move would need to be underestimated by for it to actually
    // matter, scaled by remaining depth the same way the reverse futility
    // margin above is.
    const FUTILITY_MARGIN_BASE = 0.75;
    const FUTILITY_MARGIN_PER_DEPTH = 0.75;

    // Late Move Pruning thresholds: how many quiet moves get a full look
    // before the rest are skipped outright, scaled quadratically with
    // remaining depth so deeper (more consequential) nodes stay more
    // lenient than shallow ones -- see the LMP skip below, which shares
    // canPruneByEval's safety gate with the futility pruning here.
    const LMP_BASE = 3;
    const LMP_SCALE = 2;

    // Quiet moves actually searched at this node so far (i.e. that reached
    // make/unmake below, not ones skipped by futility/LMP) -- used only by
    // the history-malus update on a beta cutoff further down, so every
    // OTHER quiet move tried and found wanting here gets pushed down in
    // future move ordering, not just the one move that eventually wins
    // gets pushed up. Pulled from a preallocated per-ply pool (see
    // getQuietsScratch) instead of `[]` here, since this function runs at
    // every non-leaf node in the tree.
    const quietsSearched = getQuietsScratch(ply);

    for (let i = 0; i < moveList.length; i++) {
        const move = moveList[i];
        const attType = ((move.attPiece) & 7);
        const isQuiet = attType === None && !move.isPromoted;

        // Futility pruning: once the position's static eval plus a
        // generous margin still can't reach alpha, a QUIET move this deep
        // in the tree essentially never recovers the gap -- it doesn't
        // change material, and everything else about the position is
        // already priced into staticEval. Skipped for captures/promotions
        // (they DO change material, the whole premise doesn't apply) and
        // never for the first, best-ordered move, so every node with any
        // moves at all still gets at least one full-strength search --
        // this can only ever fail low at the existing alpha, never starve
        // a node of real information entirely. Doesn't check whether the
        // move gives check, same accepted tradeoff as the LMR skip below:
        // a few quiet checks get pruned here that a check-aware version
        // would search, in exchange for not paying isSquareAttacked's cost
        // on every single candidate quiet move just to find out.
        if (canPruneByEval && i > 0 && isQuiet &&
            staticEval + FUTILITY_MARGIN_BASE + FUTILITY_MARGIN_PER_DEPTH * depth <= alpha) {
            continue;
        }

        // Late Move Pruning: past a certain move index (scaled by depth --
        // more room at deeper depths, since 20th-of-40 isn't nearly as
        // suspect as 20th-of-25), a QUIET move this shallow in the tree is
        // overwhelmingly likely to be exactly what its bad move-ordering
        // score already suggests. Same canPruneByEval safety gate as the
        // futility pruning just above -- including the same K+R-vs-K
        // mating-line guard described where canPruneByEval is defined --
        // since this prunes purely on move COUNT regardless of eval, and
        // would otherwise hit the exact same failure mode in a sparse
        // endgame.
        if (canPruneByEval && i > 0 && isQuiet &&
            i >= LMP_BASE + LMP_SCALE * depth * depth) {
            continue;
        }

        // SEE pruning: a capture that loses material outright by SEE
        // (already computed once by sortMoves into moveScoreGuess -- see
        // seeCapture) essentially never turns out to matter this shallow in
        // the tree -- exactly the same reasoning quiescence already applies
        // via its own `moveScoreGuess >= 0` filter (SearchAllCapture). This
        // just extends that identical, already-trusted filter to shallow
        // main-search nodes, reusing moveScoreGuess directly rather than
        // recomputing SEE. Explicitly requires attType !== None (a real
        // capture, not a quiet move) rather than trusting moveScoreGuess's
        // sign alone -- history malus below can drive a quiet move's guess
        // negative too, and this must never be the thing that prunes a
        // quiet move (that's LMP's job above, with its own move-count
        // rationale).
        if (canPruneByEval && i > 0 && attType !== None && !move.isPromoted &&
            move.moveScoreGuess < 0) {
            continue;
        }

        if (isQuiet) quietsSearched.push(move);

        let childWKPos = WKPos;
        let childBKPos = BKPos;
        if (((move.piece) & 7) == King) {
            if (((move.piece) & 24) == Black) childBKPos = move.posTo;
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
        const canReduce = i >= LMR_MIN_MOVE_INDEX && depth >= LMR_MIN_DEPTH && !inCheck && ((move.attPiece) & 7) === None && !move.isPromoted;
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
                evalScore = -Search(childDepth, nextWTM, boardPos, move, childWKPos, childBKPos, -beta, -alpha, childExtensions, childHash, ply + 1);
            } else {
                const reducedDepth = Math.max(0, childDepth - reduction);
                evalScore = -Search(reducedDepth, nextWTM, boardPos, move, childWKPos, childBKPos, -alpha - 1, -alpha, childExtensions, childHash, ply + 1);
                if (!searchAborted && reduction > 0 && evalScore > alpha) {
                    // The reduced look unexpectedly beat alpha -- confirm at the
                    // real depth before trusting it (still null-window).
                    evalScore = -Search(childDepth, nextWTM, boardPos, move, childWKPos, childBKPos, -alpha - 1, -alpha, childExtensions, childHash, ply + 1);
                }
                if (!searchAborted && evalScore > alpha && evalScore < beta) {
                    evalScore = -Search(childDepth, nextWTM, boardPos, move, childWKPos, childBKPos, -beta, -alpha, childExtensions, childHash, ply + 1);
                }
            }
        } finally {
            unmakeMove(undo, boardPos);
        }

        if (searchAborted) return alpha;

        if (evalScore >= beta) {
            if (isQuiet) {
                if (depth < MAX_KILLER_DEPTH && !moveEquals(killerMoves[depth][0], move)) {
                    killerMoves[depth][1] = killerMoves[depth][0];
                    killerMoves[depth][0] = move;
                }
                historyTable[move.pos * 64 + move.posTo] += depth * depth;
            }
            // History malus: every OTHER quiet move already searched at
            // this node (whether or not the move that actually caused this
            // cutoff was itself quiet) turned out not to be good enough to
            // cause it -- push their history score down by the same margin
            // a cutting quiet move gets pushed up just above. Without this,
            // a quiet move that gets tried constantly but rarely cuts looks
            // identical to sortMoves as one that's tried rarely but always
            // cuts, even though telling those two apart is the entire point
            // of the history heuristic. Compared by reference (not
            // moveEquals) since quietsSearched holds the exact Move objects
            // from this node's own moveList.
            for (let j = 0; j < quietsSearched.length; j++) {
                const qm = quietsSearched[j];
                if (qm !== move) historyTable[qm.pos * 64 + qm.posTo] -= depth * depth;
            }
            storeTTEntry(ttIndex, hash, depth, scoreToTT(beta, ply), TT_BETA, move);
            return beta;
        }
        if (evalScore > alpha) {
            alpha = evalScore;
            bestMove = move;
        }
    }

    const flag = alpha <= originalAlpha ? TT_ALPHA : TT_EXACT;
    storeTTEntry(ttIndex, hash, depth, scoreToTT(alpha, ply), flag, bestMove);

    return alpha;
}

function boardToText(boardPos) {
    let str = "";
    for (let i = 0; i < 64; i++) {
        if (((boardPos[i]) & 24) == Black) {
            if (((boardPos[i]) & 7) == King) {
                str += "k";
            } else if (((boardPos[i]) & 7) == Queen) {
                str += "q";
            } else if (((boardPos[i]) & 7) == Rook) {
                str += "r";
            } else if (((boardPos[i]) & 7) == Knight) {
                str += "n";
            } else if (((boardPos[i]) & 7) == Bishop) {
                str += "b";
            } else if (((boardPos[i]) & 7) == Pawn) {
                str += "p";
            }
        } else if (((boardPos[i]) & 24) == White) {
            if (((boardPos[i]) & 7) == King) {
                str += "K";
            } else if (((boardPos[i]) & 7) == Queen) {
                str += "Q";
            } else if (((boardPos[i]) & 7) == Rook) {
                str += "R";
            } else if (((boardPos[i]) & 7) == Knight) {
                str += "N";
            } else if (((boardPos[i]) & 7) == Bishop) {
                str += "B";
            } else if (((boardPos[i]) & 7) == Pawn) {
                str += "P";
            }
        } else {
            str += "0";
        }
    }
    return str;
}

// Unlike captures (naturally self-limiting -- there are only so many pieces
// left to take), a chain of checks isn't bounded by anything on its own: a
// forced sequence of check-evade-check-evade could otherwise recurse the
// full-legal-move branch below arbitrarily deep, burning the entire search's
// time budget inside one quiescence call instead of getting anywhere near
// the rest of the tree. Capped the same way the main search already caps
// check EXTENSIONS (see MAX_CHECK_EXTENSIONS in SearchNode) -- past this
// many chained in-check plies within a single quiescence call tree, fall
// back to the plain stand-pat/captures-only handling even though still in
// check, accepting the same small horizon imprecision the main search's own
// cap already accepts.
const MAX_QUIESCENCE_CHECK_PLIES = 6;

function SearchAllCapture(WTM, boardPos, lm, WKPos, BKPos, alpha, beta, ply, qCheckPlies) {
    asdsa++;
    if (searchAborted) return alpha;
    if ((asdsa & 2047) === 0 && Date.now() > searchDeadline) {
        searchAborted = true;
        return alpha;
    }

    // opponentColor (the side NOT currently to move) is needed both to
    // judge whether a capture's destination square is defended (the
    // sortMoves SEE-skip fast path below) and to tell whether the side to
    // move is in check (ownKingPos below).
    const opponentColor = WTM ? Black : White;
    const ownKingPos = WTM ? WKPos : BKPos;
    const inCheck = isSquareAttacked(boardPos, ownKingPos, opponentColor);

    // Captures alone aren't enough while in check: a forced king move,
    // block, or capture of the checking piece might be the ONLY way to
    // survive, and none of those are guaranteed to be a "capture" the
    // ordinary quiescence loop below would ever generate. Without this,
    // a checkmate landing exactly at the search horizon was invisible --
    // SearchAllCapture would just statically evaluate the position (still
    // materially fine-looking, one move before disaster) instead of
    // recognizing the forced loss. Falls back to searching every legal
    // reply, same as the main search, but only when in check -- doing this
    // unconditionally would mean generating full move lists at every single
    // quiescence node, defeating the point of a captures-only search.
    if (inCheck && qCheckPlies < MAX_QUIESCENCE_CHECK_PLIES) {
        const replies = sortMoves(getAllMoves(WTM, boardPos, lm, WKPos, BKPos), boardPos, opponentColor, null);
        if (replies.length === 0) {
            return -(MATE_SCORE - ply);
        }
        for (let i = 0; i < replies.length; i++) {
            const move = replies[i];
            let childWKPos = WKPos;
            let childBKPos = BKPos;
            if (((move.piece) & 7) == King) {
                if (((move.piece) & 24) == Black) childBKPos = move.posTo;
                else childWKPos = move.posTo;
            }
            let evalScore;
            const undo = makeMove(move, boardPos);
            try {
                evalScore = -SearchAllCapture(!WTM, boardPos, move, childWKPos, childBKPos, -beta, -alpha, ply + 1, qCheckPlies + 1);
            } finally {
                unmakeMove(undo, boardPos);
            }
            if (evalScore >= beta) return beta;
            if (evalScore > alpha) alpha = evalScore;
        }
        return alpha;
    }

    let eval = Evaluate(WTM, boardPos);
    if (eval >= beta) {
        return beta;
    }
    alpha = Math.max(alpha, eval);

    // sortMoves scores every capture by SEE (in moveScoreGuess, scaled by
    // 100) — reuse that instead of recomputing, and skip captures that lose
    // material outright: exploring them in quiescence essentially never
    // helps once the "stand pat" static eval is already being compared
    // against alpha above.
    let moveList = sortMoves(getAllCaptureMoves(WTM, boardPos, lm, WKPos, BKPos, ply), boardPos, opponentColor, null)
        .filter((move) => move.moveScoreGuess >= 0);

    for (let i = 0; i < moveList.length; i++) {
        const move = moveList[i];
        let childWKPos = WKPos;
        let childBKPos = BKPos;
        if (((move.piece) & 7) == King) {
            if (((move.piece) & 24) == Black) childBKPos = move.posTo;
            else childWKPos = move.posTo;
        }
        let evalScore;
        const undo = makeMove(move, boardPos);
        try {
            // qCheckPlies carries over unchanged here (not reset to 0): a
            // capture doesn't "use up" the in-check budget, but it also
            // shouldn't refill it -- only the in-check branch above ever
            // increments it, so an ordinary capture reply just passes
            // through whatever budget remains from before.
            evalScore = -SearchAllCapture(!WTM, boardPos, move, childWKPos, childBKPos, -beta, -alpha, ply + 1, qCheckPlies);
        } finally {
            unmakeMove(undo, boardPos);
        }
        if (evalScore >= beta) {
            return beta;
        }
        if (evalScore > alpha) alpha = evalScore;
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
    forEachBit(and64(rookAttacks(square, bb.all), rookQueenBB), (sq) => attackers.push(((boardPos[sq]) & 7)));

    const bishopQueenBB = or64(bb.piece[color][Bishop], bb.piece[color][Queen]);
    forEachBit(and64(bishopAttacks(square, bb.all), bishopQueenBB), (sq) => attackers.push(((boardPos[sq]) & 7)));

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
    const attackerColor = ((move.piece) & 24);
    const defenderColor = attackerColor === White ? Black : White;

    // Check the defender's pool first: if nothing recaptures at all, the
    // exchange ends after this one capture and SEE is trivially just the
    // captured piece's value -- skip computing our own attacker pool
    // entirely (a whole second getAttackers scan + sort) since it would
    // never be consulted anyway (most callers already skip this call
    // altogether via the same defenderType check, see sortMoves -- this is
    // a defensive fast path for any other caller).
    const theirPool = getAttackers(boardPos, square, defenderColor).map(pieceValue).sort((a, b) => a - b);
    if (theirPool.length === 0) {
        return pieceValue(((move.attPiece) & 7));
    }

    // getAttackers is queried against the board BEFORE the move, where the
    // moving piece is still at move.pos — since a legal capture move means
    // move.piece does attack move.posTo, it shows up in this scan too. It's
    // not "remaining" (it's the piece already used for the first capture,
    // now sitting ON the square as occupantValue below), so drop one
    // matching entry before treating the rest as our later recapture pool.
    const ourPool = getAttackers(boardPos, square, attackerColor).map(pieceValue).sort((a, b) => a - b);
    const moverIdx = ourPool.indexOf(pieceValue(((move.piece) & 7)));
    if (moverIdx !== -1) ourPool.splice(moverIdx, 1);

    const gain = [pieceValue(((move.attPiece) & 7))];
    let occupantValue = pieceValue(((move.piece) & 7));
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

function sortMoves(moveList, boardPos, defenderColor, depth) {
    const killers = depth != null && depth < MAX_KILLER_DEPTH ? killerMoves[depth] : null;
    for (let i = 0; i < moveList.length; i++) {
        const move = moveList[i];
        let moveScoreGuess = 0;
        const movePieceType = ((move.piece) & 7);
        const attPieceType = ((move.attPiece) & 7);
        // Per-move query (a small, bounded per-square scan) instead of a
        // precomputed whole-board attack map: profiling showed the old
        // getAttackedPosition-based version -- one O(64) full-board scan
        // per node, reused across all of that node's moves -- cost more
        // than just asking squareAttackerType once per move directly. A
        // typical node has far fewer moves than 64 squares, and unlike
        // getAttackedPosition this does no whole-board work and allocates
        // nothing.
        const defenderType = boardPos ? squareAttackerType(boardPos, move.posTo, defenderColor) : None;

        if (attPieceType != None) {
            // SEE accounts for defenders, unlike plain MVV-LVA — a capture
            // that just loses material outright sorts below quiet moves
            // instead of ahead of them.
            if (!boardPos) {
                moveScoreGuess = 10 * pieceValue(attPieceType) - pieceValue(movePieceType);
            } else if (defenderType === None) {
                // No defender at all on the destination square -- SEE's
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

        if (defenderType === Pawn) {
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
        if (((move.piece) & 7) == King) {
            if (((move.piece) & 24) == Black) {
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

            if (((match.piece) & 7) === King) {
                if (((match.piece) & 24) === Black) BKPos = match.posTo;
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
const AI_MAX_TIME_MS = 10000;
const AI_EXTEND_MIN_DEPTH = 4; // don't react to instability before this -- shallow iterations are cheap and naturally noisy

let lastSearchDepth = 0;
let lastSearchScore = null; // null means "no real search yet" (e.g. a book move)
let lastSearchTimeMs = 0;
let lastSearchNodes = 0;

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

// `options.rootMoveSubset`, when given, restricts the root loop to searching
// only that (already-generated, already-legal) subset of moves instead of
// the position's full legal move list -- used by the root-splitting worker
// pool (chess.js's requestAiMove) so each worker only ever searches its own
// slice. Omitting `options` entirely (the only way this was ever called
// before root-splitting existed) is byte-identical to the original
// behavior: book-move check included, full move generation every depth.
function playAi2(options) {
    const searchStartTime = Date.now();
    options = options || {};
    const usingSubset = !!options.rootMoveSubset;

    if (!usingSubset) {
        const bookMove = getBookMove(boardPosition, whiteToMove, lastMove, WhiteKingPos, BlackKingPos);
        if (bookMove) {
            lastSearchDepth = 0;
            lastSearchScore = null;
            lastSearchTimeMs = Date.now() - searchStartTime;
            updateSearchInfo();
            return bookMove;
        }
    }

    // A worker handed zero moves (only possible if there are fewer legal
    // moves than pool workers) has nothing to search -- return immediately
    // rather than spinning through 40 empty depth iterations until the
    // deadline. The real orchestrator never dispatches an empty subset, so
    // this is defensive, not something production traffic exercises.
    if (usingSubset && options.rootMoveSubset.length === 0) {
        lastSearchDepth = 0;
        lastSearchScore = null;
        lastSearchTimeMs = Date.now() - searchStartTime;
        updateSearchInfo();
        return null;
    }

    searchDeadline = options.deadline || Date.now() + AI_BASE_TIME_MS;
    const hardDeadline = options.hardDeadline || Date.now() + AI_MAX_TIME_MS;
    searchAborted = false;
    resetSearchState();

    // Computed once here (the root position doesn't change across
    // iterative-deepening passes) rather than being rederived from scratch
    // at every node below — see updateHashForMove.
    const rootHash = computeHash(boardPosition, whiteToMove);

    // Also invariant across depths when using a fixed subset: which color
    // sortMoves needs to query for defenders never changes mid-call, only
    // move *ordering* does (see below) -- computed once here instead of
    // every iteration.
    const subsetColor = usingSubset ? (whiteToMove ? Black : White) : null;

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
        let rootMoves;
        if (usingSubset) {
            // Re-sort (not just re-copy) every depth: sortMoves orders quiet
            // moves by historyTable/killer state, which keeps accumulating
            // across depths within this call -- reusing a stale sort would
            // search every depth after the first in a cold, uninformed
            // order, quietly forfeiting depth. Move *generation* is what's
            // skippable here (already done once by the orchestrator), not
            // move *ordering*.
            rootMoves = sortMoves(options.rootMoveSubset.slice(), boardPosition, subsetColor, null);
        } else {
            const color = whiteToMove ? Black : White;
            rootMoves = sortMoves(
                getAllMoves(whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos),
                boardPosition,
                color,
                null
            );
        }
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
                if (((move.piece) & 7) === King) {
                    if (((move.piece) & 24) === Black) childBKPos = move.posTo;
                    else childWKPos = move.posTo;
                }
                const childHash = updateHashForMove(rootHash, move);

                let val;
                if (i === 0) {
                    val = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -beta, -alpha, 0, childHash, 1);
                } else {
                    val = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -alpha - 1, -alpha, 0, childHash, 1);
                    if (!searchAborted && val > alpha && val < beta) {
                        val = -Search(depth - 1, nextWTM, newBoardPos, move, childWKPos, childBKPos, -beta, -alpha, 0, childHash, 1);
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

            // Only extend when NOT using a subset: with a small slice of the
            // full move list, "the best move among my few candidates
            // changed" is a much noisier signal than it is when comparing
            // the whole position's moves, so subset workers would extend
            // far more readily than a single full-list search ever did. The
            // orchestrator waits for every pooled worker (Promise.all), so
            // even one worker doing this turns the whole batch's wall time
            // into whatever its slowest, most-extended straggler takes --
            // silently erasing the parallel speedup this pool exists for.
            if (!usingSubset && !depthAborted && depth >= AI_EXTEND_MIN_DEPTH && (moveChanged || scoreDropped)) {
                // The answer just shifted or the score just dropped -- this
                // position needs more room before committing to it, rather
                // than cutting off on the original schedule.
                searchDeadline = Math.max(searchDeadline, Math.min(hardDeadline, Date.now() + AI_BASE_TIME_MS * 0.6));
            }

            previousBestMove = bestMove;
            previousScore = depthScore;
        }
        if (depthAborted) break;
        // Forced mate found for the side to move -- deeper search on this
        // depth's exhaustive root comparison already prefers the fastest
        // mate available (MATE_SCORE decays by ply, see scoreToTT/Search
        // above), so once one surfaces here it's already the quickest mate
        // reachable within this depth; no need to search deeper.
        if (depthScore !== null && depthScore > MATE_THRESHOLD) break;
        // "Nothing left to iterate on" only means the whole position is
        // forced when this loop sees ALL legal moves. With a subset, a
        // small rootMoves.length just means this worker got a small slice
        // of a much bigger move list -- it must not stop early on that
        // basis alone.
        if (!usingSubset && rootMoves.length <= 1) break;
        if (Date.now() >= searchDeadline) break;
    }

    lastSearchNodes = asdsa;
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
