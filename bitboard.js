// Bitboard engine core: 64-bit occupancy/attack bitboards represented as a
// pair of 32-bit integers {lo, hi} (lo = squares 0-31, hi = squares 32-63)
// rather than BigInt — V8 heap-allocates every BigInt, and native int32
// bitwise ops are substantially cheaper. Every bitboard value in this file
// (and everywhere chess.js/getcapture.js touch one) is one of these pairs;
// there is no raw `&`/`|`/`~` on bitboards anywhere outside the and64/or64/
// andNot64/not64 helpers below, since JS operators can't be overloaded for
// plain objects.
//
// Loaded after chess.js (reuses its fileAt/rankAt/diff edge-guard helpers
// and None/Pawn/.../White/Black constants) and before ai.js/getcapture.js.
// Nothing here is wired into the engine yet on its own -- chess.js's
// isSquareAttacked/getAttackedPosition/computePinnedPieces and the per-piece
// move generators call into bbIsSquareAttacked/bbGetAttackedPosition/
// bbComputePinnedPieces/attack tables directly.

function bb64(lo, hi) {
    return { lo: lo | 0, hi: hi | 0 };
}
const ZERO64 = bb64(0, 0);

function and64(a, b) {
    return bb64(a.lo & b.lo, a.hi & b.hi);
}
function or64(a, b) {
    return bb64(a.lo | b.lo, a.hi | b.hi);
}
function xor64(a, b) {
    return bb64(a.lo ^ b.lo, a.hi ^ b.hi);
}
// a & ~b, fused so ~b's intermediate result is never materialized.
function andNot64(a, b) {
    return bb64(a.lo & ~b.lo, a.hi & ~b.hi);
}
// Full complement. Unlike BigInt's `~` (unbounded, -x-1n) this is an exact
// 64-bit complement, since `~` on a Number is already a proper 32-bit
// complement — kept for clarity/tests; hot paths use andNot64 instead so
// they don't allocate the intermediate complement object.
function not64(a) {
    return bb64(~a.lo, ~a.hi);
}
function isZero64(a) {
    return a.lo === 0 && a.hi === 0;
}
function equals64(a, b) {
    return a.lo === b.lo && a.hi === b.hi;
}
function squareBit(sq) {
    return sq < 32 ? bb64(1 << sq, 0) : bb64(0, 1 << (sq - 32));
}
function testBit64(bb, sq) {
    return sq < 32 ? (bb.lo & (1 << sq)) !== 0 : (bb.hi & (1 << (sq - 32))) !== 0;
}
function bitScanForward32(x) {
    // x is a nonzero 32-bit value. `x & -x` isolates the lowest set bit (JS
    // `&`/unary `-` both coerce via ToInt32, so this is safe regardless of
    // x's sign bit).
    return 31 - Math.clz32(x & -x);
}
function bitScanReverse32(x) {
    return 31 - Math.clz32(x);
}
// Forward/reverse bitscan over a {lo, hi} pair. Undefined for a zero
// bitboard -- callers must only invoke these after confirming it's nonzero.
function bitScanForward(bb) {
    if (bb.lo !== 0) return bitScanForward32(bb.lo);
    return 32 + bitScanForward32(bb.hi);
}
function bitScanReverse(bb) {
    if (bb.hi !== 0) return 32 + bitScanReverse32(bb.hi);
    return bitScanReverse32(bb.lo);
}

// Naive O(64) reference implementations, used only by the self-test below to
// validate the fast clz32-based versions above before anything trusts them.
function bitScanForwardNaive(bb) {
    for (let i = 0; i < 64; i++) {
        if (testBit64(bb, i)) return i;
    }
    throw new Error("bitScanForwardNaive: zero input");
}
function bitScanReverseNaive(bb) {
    for (let i = 63; i >= 0; i--) {
        if (testBit64(bb, i)) return i;
    }
    throw new Error("bitScanReverseNaive: zero input");
}

// Iterates set bits of `bb` from lowest to highest square, invoking
// callback(sq) for each. Used by the per-piece move generators to turn a
// destination bitboard into a sequence of Move objects. Works on raw lo/hi
// locals (not clearLowestBit64/{lo,hi} allocation per bit) since a rook can
// have well over a dozen destinations per call.
function forEachBit(bb, callback) {
    let lo = bb.lo;
    while (lo !== 0) {
        callback(bitScanForward32(lo));
        lo &= lo - 1;
    }
    let hi = bb.hi;
    while (hi !== 0) {
        callback(32 + bitScanForward32(hi));
        hi &= hi - 1;
    }
}

// --- Precomputed attack tables -------------------------------------------
// Built by walking offsets/rays with the SAME edge-of-board guards already
// used throughout chess.js (fileAt/rankAt/diff — note chess.js's own naming
// is swapped vs standard chess terms: fileAt(pos) returns the RANK-group
// (floor(pos/8)+1) and rankAt(pos) returns the FILE-group ((pos%8)+1); this
// file just reuses those exact predicates rather than re-deriving wraparound
// conditions independently).

const KNIGHT_OFFSETS = [
    [15, 2, 1], [17, 2, 1], [6, 1, 2], [10, 1, 2],
    [-15, 2, 1], [-17, 2, 1], [-6, 1, 2], [-10, 1, 2],
];

const KNIGHT_ATTACKS = new Array(64).fill(ZERO64);
for (let sq = 0; sq < 64; sq++) {
    let bb = ZERO64;
    for (const [off, fd, rd] of KNIGHT_OFFSETS) {
        const t = sq + off;
        if (t < 0 || t > 63) continue;
        if (diff(fileAt(sq), fileAt(t)) === fd && diff(rankAt(sq), rankAt(t)) === rd) {
            bb = or64(bb, squareBit(t));
        }
    }
    KNIGHT_ATTACKS[sq] = bb;
}

// step, and a guard(sq, target) that must hold for a single step from sq to
// target to be valid (prevents rank/file wraparound) — reused both for the
// single-step KING_ATTACKS table and for building each direction's full ray.
const DIRECTION_STEPS = [
    { step: 8, guard: () => true },
    { step: -8, guard: () => true },
    { step: 1, guard: (sq, t) => fileAt(sq) === fileAt(t) },
    { step: -1, guard: (sq, t) => fileAt(sq) === fileAt(t) },
    { step: 7, guard: (sq, t) => diff(fileAt(sq), fileAt(t)) === 1 },
    { step: -7, guard: (sq, t) => diff(fileAt(sq), fileAt(t)) === 1 },
    { step: 9, guard: (sq, t) => diff(fileAt(sq), fileAt(t)) === 1 },
    { step: -9, guard: (sq, t) => diff(fileAt(sq), fileAt(t)) === 1 },
];

const KING_ATTACKS = new Array(64).fill(ZERO64);
for (let sq = 0; sq < 64; sq++) {
    let bb = ZERO64;
    for (const dir of DIRECTION_STEPS) {
        const t = sq + dir.step;
        if (t < 0 || t > 63) continue;
        if (dir.guard(sq, t)) bb = or64(bb, squareBit(t));
    }
    KING_ATTACKS[sq] = bb;
}

// PAWN_ATTACKS[color][sq] = squares a pawn of `color` standing on `sq`
// attacks (diagonal captures only — pushes have no bitboard-table
// equivalent in this design, see getPawnMoves).
const PAWN_ATTACKS = { [White]: new Array(64).fill(ZERO64), [Black]: new Array(64).fill(ZERO64) };
for (let sq = 0; sq < 64; sq++) {
    let whiteBB = ZERO64;
    if (sq + 7 <= 63 && diff(rankAt(sq), rankAt(sq + 7)) === 1) whiteBB = or64(whiteBB, squareBit(sq + 7));
    if (sq + 9 <= 63 && diff(rankAt(sq), rankAt(sq + 9)) === 1) whiteBB = or64(whiteBB, squareBit(sq + 9));
    PAWN_ATTACKS[White][sq] = whiteBB;

    let blackBB = ZERO64;
    if (sq - 7 >= 0 && diff(rankAt(sq), rankAt(sq - 7)) === 1) blackBB = or64(blackBB, squareBit(sq - 7));
    if (sq - 9 >= 0 && diff(rankAt(sq), rankAt(sq - 9)) === 1) blackBB = or64(blackBB, squareBit(sq - 9));
    PAWN_ATTACKS[Black][sq] = blackBB;
}

// RAY_ATTACKS[step][sq]: every square from sq (exclusive) to the board edge
// in the direction `step`, ignoring occupancy. Indexed by the same 8 step
// values as DIRECTION_STEPS.
const RAY_ATTACKS = {};
for (const dir of DIRECTION_STEPS) {
    const table = new Array(64).fill(ZERO64);
    for (let sq = 0; sq < 64; sq++) {
        let bb = ZERO64;
        let cur = sq;
        for (;;) {
            const next = cur + dir.step;
            if (next < 0 || next > 63) break;
            if (!dir.guard(cur, next)) break;
            bb = or64(bb, squareBit(next));
            cur = next;
        }
        table[sq] = bb;
    }
    RAY_ATTACKS[dir.step] = table;
}

// Classical (non-magic) sliding attack: walk the full ray, find the nearest
// blocker via bitscan, then mask off everything beyond it — the remaining
// ray runs from sq up to and including the blocker (capturable regardless of
// its color; callers intersect with the enemy's piece bitboards to filter).
// Used only to build the PEXT-style lookup tables below (see rookAttacks/
// bishopAttacks further down for the actual runtime-hot versions) — kept
// under the "Slow" name since it's no longer the query-time implementation.
//
// Writes its result into the module-scratch _slideLo/_slideHi pair instead
// of returning a fresh {lo,hi} object, since it's called thousands of times
// while building the tables and there's no reason to allocate at table-build
// time either. Callers must read _slideLo/_slideHi immediately, before any
// other call that might write them.
let _slideLo, _slideHi;
function raySlideRaw(step, sq, occLo, occHi, positive) {
    const ray = RAY_ATTACKS[step][sq];
    const rLo = ray.lo, rHi = ray.hi;
    const bLo = rLo & occLo, bHi = rHi & occHi;
    if (bLo === 0 && bHi === 0) {
        _slideLo = rLo;
        _slideHi = rHi;
        return;
    }
    const blockerSq = positive
        ? (bLo !== 0 ? bitScanForward32(bLo) : 32 + bitScanForward32(bHi))
        : (bHi !== 0 ? 32 + bitScanReverse32(bHi) : bitScanReverse32(bLo));
    const sub = RAY_ATTACKS[step][blockerSq];
    _slideLo = rLo & ~sub.lo;
    _slideHi = rHi & ~sub.hi;
}

function rookAttacksSlow(sq, occ) {
    const occLo = occ.lo, occHi = occ.hi;
    let lo = 0, hi = 0;
    raySlideRaw(8, sq, occLo, occHi, true); lo |= _slideLo; hi |= _slideHi;
    raySlideRaw(-8, sq, occLo, occHi, false); lo |= _slideLo; hi |= _slideHi;
    raySlideRaw(1, sq, occLo, occHi, true); lo |= _slideLo; hi |= _slideHi;
    raySlideRaw(-1, sq, occLo, occHi, false); lo |= _slideLo; hi |= _slideHi;
    return bb64(lo, hi);
}
function bishopAttacksSlow(sq, occ) {
    const occLo = occ.lo, occHi = occ.hi;
    let lo = 0, hi = 0;
    raySlideRaw(7, sq, occLo, occHi, true); lo |= _slideLo; hi |= _slideHi;
    raySlideRaw(-7, sq, occLo, occHi, false); lo |= _slideLo; hi |= _slideHi;
    raySlideRaw(9, sq, occLo, occHi, true); lo |= _slideLo; hi |= _slideHi;
    raySlideRaw(-9, sq, occLo, occHi, false); lo |= _slideLo; hi |= _slideHi;
    return bb64(lo, hi);
}

// --- PEXT-style occupancy-extraction tables for sliding attacks -----------
// Classic magic bitboards hash the relevant occupancy through a 64-bit
// multiply+shift, but that needs an exact 64x64-bit product — any 32x32
// unsigned multiply in JS can already exceed Number's 53-bit safe-integer
// range, and hand-rolling a correct 64-bit multiply from 32-bit limbs is
// its own significant source of subtle bugs. This uses the software
// equivalent of the BMI2 PEXT instruction instead: precompute, per square, the exact
// set of "relevant" occupancy squares (its own rook/bishop rays, minus the
// single edge-most square in each direction — whether that specific square
// is occupied never changes the attack pattern, since the ray always stops
// there or earlier regardless), enumerate every subset of that mask via the
// standard carry-rippler trick, and store the true attack pattern for each
// subset (computed via rookAttacksSlow/bishopAttacksSlow above, still
// correct, just not fast). At query time: extract the relevant bits from
// the actual occupancy into a compact index (a tiny bit-extraction loop,
// no multiply, no magic numbers to source or verify) and do one array
// lookup — returning the SAME stored {lo,hi} object every time, so unlike
// every other function in this file, this path allocates nothing at all.
// Safe only because nothing anywhere ever mutates a bitboard's .lo/.hi in
// place — every bitboard in this codebase is treated as an immutable value.

const ROOK_DIRS = [8, -8, 1, -1];
const BISHOP_DIRS = [7, -7, 9, -9];

// The ray from sq in `step`'s direction with its single farthest (edge)
// square removed. For a positive step the ray's square numbers increase
// moving away from sq, so the edge square is the highest bit (reverse
// scan); for a negative step they decrease, so it's the lowest bit
// (forward scan). An empty ray (sq already on that edge) has nothing to
// remove.
function rayWithoutEdge(step, sq) {
    const ray = RAY_ATTACKS[step][sq];
    const rLo = ray.lo, rHi = ray.hi;
    if (rLo === 0 && rHi === 0) return ray;
    const positive = step > 0;
    const edgeSq = positive
        ? (rHi !== 0 ? 32 + bitScanReverse32(rHi) : bitScanReverse32(rLo))
        : (rLo !== 0 ? bitScanForward32(rLo) : 32 + bitScanForward32(rHi));
    if (edgeSq < 32) return bb64(rLo & ~(1 << edgeSq), rHi);
    return bb64(rLo, rHi & ~(1 << (edgeSq - 32)));
}

function buildRelevantMask(sq, dirs) {
    let lo = 0, hi = 0;
    for (const step of dirs) {
        const r = rayWithoutEdge(step, sq);
        lo |= r.lo;
        hi |= r.hi;
    }
    return bb64(lo, hi);
}

function maskBitPositions(mask) {
    const positions = [];
    for (let sq = 0; sq < 64; sq++) if (testBit64(mask, sq)) positions.push(sq);
    return positions;
}

const ROOK_MASK = new Array(64);
const BISHOP_MASK = new Array(64);
const ROOK_MASK_BITS = new Array(64);
const BISHOP_MASK_BITS = new Array(64);
for (let sq = 0; sq < 64; sq++) {
    ROOK_MASK[sq] = buildRelevantMask(sq, ROOK_DIRS);
    BISHOP_MASK[sq] = buildRelevantMask(sq, BISHOP_DIRS);
    ROOK_MASK_BITS[sq] = maskBitPositions(ROOK_MASK[sq]);
    BISHOP_MASK_BITS[sq] = maskBitPositions(BISHOP_MASK[sq]);
}

// Load-time only: BigInt makes the carry-rippler subset enumeration trivial
// to get right, and none of this runs again once the tables are built.
function bb64ToBigInt(bb) {
    return (BigInt(bb.hi >>> 0) << 32n) | BigInt(bb.lo >>> 0);
}
function bigIntToBB64(x) {
    return bb64(Number(x & 0xffffffffn), Number((x >> 32n) & 0xffffffffn));
}

// Enumerates every subset of `mask` (2^popcount(mask) of them, including the
// empty and full sets) via the standard carry-rippler identity
// `next = (subset - mask) & mask`, and for each, computes its compact index
// (bit i of the index = whether maskBits[i] is set in that subset) plus its
// true attack pattern via `slowAttackFn`, storing attackTable[index].
function buildAttackTable(sq, mask, maskBits, slowAttackFn) {
    const k = maskBits.length;
    const table = new Array(1 << k);
    const maskBig = bb64ToBigInt(mask);
    let subsetBig = 0n;
    do {
        const subsetBB = bigIntToBB64(subsetBig);
        let index = 0;
        for (let i = 0; i < k; i++) {
            if (testBit64(subsetBB, maskBits[i])) index |= 1 << i;
        }
        table[index] = slowAttackFn(sq, subsetBB);
        subsetBig = (subsetBig - maskBig) & maskBig;
    } while (subsetBig !== 0n);
    return table;
}

const ROOK_ATTACK_TABLE = new Array(64);
const BISHOP_ATTACK_TABLE = new Array(64);
for (let sq = 0; sq < 64; sq++) {
    ROOK_ATTACK_TABLE[sq] = buildAttackTable(sq, ROOK_MASK[sq], ROOK_MASK_BITS[sq], rookAttacksSlow);
    BISHOP_ATTACK_TABLE[sq] = buildAttackTable(sq, BISHOP_MASK[sq], BISHOP_MASK_BITS[sq], bishopAttacksSlow);
}

// Manual PEXT: extract exactly the relevant-mask bits from occ into a
// compact index, in the same bit order used to build the table above.
function extractIndex(bits, occLo, occHi) {
    let index = 0;
    for (let i = 0; i < bits.length; i++) {
        const b = bits[i];
        const set = b < 32 ? (occLo & (1 << b)) !== 0 : (occHi & (1 << (b - 32))) !== 0;
        if (set) index |= 1 << i;
    }
    return index;
}

function rookAttacks(sq, occ) {
    return ROOK_ATTACK_TABLE[sq][extractIndex(ROOK_MASK_BITS[sq], occ.lo, occ.hi)];
}
function bishopAttacks(sq, occ) {
    return BISHOP_ATTACK_TABLE[sq][extractIndex(BISHOP_MASK_BITS[sq], occ.lo, occ.hi)];
}
function queenAttacks(sq, occ) {
    const r = rookAttacks(sq, occ), b = bishopAttacks(sq, occ);
    return bb64(r.lo | b.lo, r.hi | b.hi);
}

// --- Mailbox -> bitboard sync ---------------------------------------------
// One O(64) pass building 12 piece bitboards + white/black/all occupancy
// from a mailbox array, memoized per array object: every move in this
// codebase either (a) clones the mailbox via moveToBoard's `.slice()`,
// producing a brand-new array used for exactly one logical position and
// then discarded (search-tree boards — safe to cache forever), or (b)
// mutates the single persistent `boardPosition` array in place
// (movePiece/generatePieces — must invalidate the cache entry when this
// happens, see invalidateBitboardCache below). Without memoization,
// isSquareAttacked/getAttackedPosition/computePinnedPieces and every
// per-piece move generator each re-synced the same board from scratch —
// up to ~18 redundant O(64) rebuilds per getAllMoves call.
const bbSyncCache = new WeakMap();

function invalidateBitboardCache(boardPos) {
    bbSyncCache.delete(boardPos);
}

// Set to true only by test harnesses. When on, every syncBitboards call that
// takes the __liveBB fast path also rebuilds from scratch and asserts the
// two agree bit-for-bit, at every single query -- the strongest available
// check that makeMove/unmakeMove's incremental XOR maintenance (chess.js)
// never drifts from ground truth. Left off in the real page: zero cost.
let DEBUG_VERIFY_BITBOARDS = false;

const PIECE_TYPES = [Pawn, Knight, Bishop, Rook, Queen, King];

function syncBitboards(boardPos) {
    // Incrementally-maintained state, kept up to date by chess.js's
    // makeMove/unmakeMove (see board.__liveBB). Takes priority over the
    // WeakMap cache below -- O(1), no rebuild -- for any board make/unmake
    // has initialized. Boards produced by moveToBoard's `.slice()` clone (or
    // any other path) never carry this property, so they fall through to the
    // cache/rebuild logic exactly as before.
    if (boardPos.__liveBB) {
        if (DEBUG_VERIFY_BITBOARDS) {
            verifyLiveBitboards(boardPos);
        }
        return boardPos.__liveBB;
    }

    const cached = bbSyncCache.get(boardPos);
    if (cached) return cached;

    const result = rebuildBitboardsFromScratch(boardPos);
    bbSyncCache.set(boardPos, result);
    return result;
}

// The full O(64) mailbox scan, with no caching -- used both by syncBitboards
// on a cold cache and by verifyLiveBitboards, which needs a from-scratch
// ground truth to compare __liveBB against without disturbing bbSyncCache.
function rebuildBitboardsFromScratch(boardPos) {
    // Accumulate as plain numbers first, not {lo,hi} objects — every slot
    // below starts out aliasing the very same object, so OR-ing into it in
    // place (rather than reassigning a fresh one each time) would corrupt
    // shared state across colors/types. Only wrap into real bitboards once,
    // at the end, when each bucket's final value is known.
    const lo = { [White]: {}, [Black]: {} };
    const hi = { [White]: {}, [Black]: {} };
    for (const color of [White, Black]) {
        for (const type of PIECE_TYPES) {
            lo[color][type] = 0;
            hi[color][type] = 0;
        }
    }
    let whiteLo = 0, whiteHi = 0, blackLo = 0, blackHi = 0, allLo = 0, allHi = 0;

    for (let sq = 0; sq < 64; sq++) {
        const p = boardPos[sq];
        const pType = ((p) & 7);
        if (pType === None) continue;
        const pColor = ((p) & 24);
        if (sq < 32) {
            const bit = 1 << sq;
            lo[pColor][pType] |= bit;
            allLo |= bit;
            if (pColor === White) whiteLo |= bit;
            else blackLo |= bit;
        } else {
            const bit = 1 << (sq - 32);
            hi[pColor][pType] |= bit;
            allHi |= bit;
            if (pColor === White) whiteHi |= bit;
            else blackHi |= bit;
        }
    }

    const piece = { [White]: {}, [Black]: {} };
    for (const color of [White, Black]) {
        for (const type of PIECE_TYPES) {
            piece[color][type] = bb64(lo[color][type], hi[color][type]);
        }
    }
    return {
        piece,
        white: bb64(whiteLo, whiteHi),
        black: bb64(blackLo, blackHi),
        all: bb64(allLo, allHi),
    };
}

// Asserts board.__liveBB (incrementally maintained by chess.js's
// makeMove/unmakeMove) exactly matches a from-scratch rebuild. Only ever
// called when DEBUG_VERIFY_BITBOARDS is on (test harnesses).
function verifyLiveBitboards(boardPos) {
    const live = boardPos.__liveBB;
    const truth = rebuildBitboardsFromScratch(boardPos);
    for (const color of [White, Black]) {
        for (const type of PIECE_TYPES) {
            if (!equals64(live.piece[color][type], truth.piece[color][type])) {
                throw new Error(
                    `__liveBB drift: piece[${color}][${type}] live={lo:${live.piece[color][type].lo},hi:${live.piece[color][type].hi}} ` +
                    `truth={lo:${truth.piece[color][type].lo},hi:${truth.piece[color][type].hi}}`
                );
            }
        }
    }
    for (const bucket of ["white", "black", "all"]) {
        if (!equals64(live[bucket], truth[bucket])) {
            throw new Error(
                `__liveBB drift: ${bucket} live={lo:${live[bucket].lo},hi:${live[bucket].hi}} ` +
                `truth={lo:${truth[bucket].lo},hi:${truth[bucket].hi}}`
            );
        }
    }
}

// --- Attack / check / pin queries ------------------------------------------

// Like bbIsSquareAttacked, but reports WHICH piece type is attacking (the
// cheapest one, checked in ascending-value order so it's also usable as a
// rough "what's the cheapest attacker here" query -- e.g. for a per-piece
// hanging-material eval term), or None if nothing attacks the square at
// all. King is checked LAST (rather than bbGetAttackedPosition's pawn/
// knight/king/rook/bishop order) specifically so that a real attacker
// (pawn/knight/bishop/rook/queen) sharing the square with an attacking king
// is never masked by the king -- important for a caller that wants to
// treat "only a lone king attacks this" as a materially different case
// from "a real piece attacks this, and the king happens to also be nearby".
// Rook and queen share one combined bitboard check (as do bishop and
// queen), same simplification bbGetAttackedPosition/bbIsSquareAttacked
// already make -- this can't tell a queen's straight-line attack from a
// rook's, or its diagonal attack from a bishop's, but callers that only
// need "roughly how cheap is the cheapest attacker" don't need that
// distinction.
function bbSquareAttackerType(boardPos, square, byColor) {
    const bb = syncBitboards(boardPos);
    const oppositeOfByColor = byColor === White ? Black : White;

    const pawnAtk = PAWN_ATTACKS[oppositeOfByColor][square], pawnBB = bb.piece[byColor][Pawn];
    if ((pawnAtk.lo & pawnBB.lo) !== 0 || (pawnAtk.hi & pawnBB.hi) !== 0) return Pawn;

    const knightAtk = KNIGHT_ATTACKS[square], knightBB = bb.piece[byColor][Knight];
    if ((knightAtk.lo & knightBB.lo) !== 0 || (knightAtk.hi & knightBB.hi) !== 0) return Knight;

    const queen = bb.piece[byColor][Queen];
    const bishop = bb.piece[byColor][Bishop];
    const bishopQueenLo = bishop.lo | queen.lo, bishopQueenHi = bishop.hi | queen.hi;
    const bishopAtk = bishopAttacks(square, bb.all);
    if ((bishopAtk.lo & bishopQueenLo) !== 0 || (bishopAtk.hi & bishopQueenHi) !== 0) return Bishop;

    const rook = bb.piece[byColor][Rook];
    const rookQueenLo = rook.lo | queen.lo, rookQueenHi = rook.hi | queen.hi;
    const rookAtk = rookAttacks(square, bb.all);
    if ((rookAtk.lo & rookQueenLo) !== 0 || (rookAtk.hi & rookQueenHi) !== 0) return Rook;

    const kingAtk = KING_ATTACKS[square], kingBB = bb.piece[byColor][King];
    if ((kingAtk.lo & kingBB.lo) !== 0 || (kingAtk.hi & kingBB.hi) !== 0) return King;

    return None;
}

// Is `square` attacked by any piece of `byColor` on `boardPos`? Stateless —
// makes no assumption about how boardPos was produced, so callers that pass
// a post-move simulated board (castling-through-check, en-passant
// discovered check) get correct answers automatically.
function bbIsSquareAttacked(boardPos, square, byColor) {
    const bb = syncBitboards(boardPos);
    const oppositeOfByColor = byColor === White ? Black : White;

    const knightAtk = KNIGHT_ATTACKS[square], knightBB = bb.piece[byColor][Knight];
    if ((knightAtk.lo & knightBB.lo) !== 0 || (knightAtk.hi & knightBB.hi) !== 0) return true;

    const kingAtk = KING_ATTACKS[square], kingBB = bb.piece[byColor][King];
    if ((kingAtk.lo & kingBB.lo) !== 0 || (kingAtk.hi & kingBB.hi) !== 0) return true;

    const pawnAtk = PAWN_ATTACKS[oppositeOfByColor][square], pawnBB = bb.piece[byColor][Pawn];
    if ((pawnAtk.lo & pawnBB.lo) !== 0 || (pawnAtk.hi & pawnBB.hi) !== 0) return true;

    const rook = bb.piece[byColor][Rook], queen = bb.piece[byColor][Queen];
    const rookQueenLo = rook.lo | queen.lo, rookQueenHi = rook.hi | queen.hi;
    const rookAtk = rookAttacks(square, bb.all);
    if ((rookAtk.lo & rookQueenLo) !== 0 || (rookAtk.hi & rookQueenHi) !== 0) return true;

    const bishop = bb.piece[byColor][Bishop];
    const bishopQueenLo = bishop.lo | queen.lo, bishopQueenHi = bishop.hi | queen.hi;
    const bishopAtk = bishopAttacks(square, bb.all);
    if ((bishopAtk.lo & bishopQueenLo) !== 0 || (bishopAtk.hi & bishopQueenHi) !== 0) return true;

    return false;
}

// Would `kingSquare` be attacked by `byColor` if `move` were applied to
// `boardPos`? Answers the same question isMoveValid's slow path needs
// (chess.js) WITHOUT cloning the mailbox (moveToBoard) or rebuilding all 15
// bitboard buckets from scratch.
//
// Key simplification: the mover's own piece-type bucket (and, for castling,
// the rook's) is always the SAME color as the moving side, i.e. the
// opposite of `byColor` -- so it never affects any of byColor's own
// knight/king/pawn/rook+queen/bishop+queen bitboards, which is all this
// function ever reads for the attack scan. The only piece-type bucket that
// can ever change from byColor's perspective is the captured piece's (a
// capture always removes a byColor piece, never the mover's own color), so
// at most ONE bucket ever needs a one-bit override here -- everything else
// reads the real, already-synced bitboards directly. `all` occupancy still
// needs every touched square accounted for, since sliding attacks depend on
// the full board regardless of whose pieces occupy it.
function bbWouldBeAttackedAfterMove(boardPos, move, kingSquare, byColor) {
    const bb = syncBitboards(boardPos);

    let capturedType = None, capturedSq = -1;
    let overlayAll = xor64(bb.all, squareBit(move.pos));

    if (move.isCastle) {
        const rookFrom = move.castleType === "l" ? move.posTo - 2 : move.posTo + 1;
        const rookTo = move.castleType === "l" ? move.posTo + 1 : move.posTo - 1;
        overlayAll = xor64(overlayAll, squareBit(move.posTo));
        overlayAll = xor64(overlayAll, squareBit(rookFrom));
        overlayAll = xor64(overlayAll, squareBit(rookTo));
    } else if (move.isEnp) {
        capturedType = Pawn;
        capturedSq = move.enpTo;
        overlayAll = xor64(overlayAll, squareBit(move.enpTo));
        overlayAll = xor64(overlayAll, squareBit(move.posTo));
    } else {
        // Normal move or promotion (posTo may or may not be a capture).
        const captured = boardPos[move.posTo];
        if (((captured) & 7) !== None) {
            capturedType = ((captured) & 7);
            capturedSq = move.posTo;
            // `all` at posTo was occupied (captured piece) and stays
            // occupied (mover arrives) -- no net change, skip the toggle.
        } else {
            overlayAll = xor64(overlayAll, squareBit(move.posTo));
        }
    }

    function pieceBB(type) {
        const base = bb.piece[byColor][type];
        return type === capturedType ? xor64(base, squareBit(capturedSq)) : base;
    }

    const oppositeOfByColor = byColor === White ? Black : White;
    const knightAtk = KNIGHT_ATTACKS[kingSquare], knightBB = pieceBB(Knight);
    if ((knightAtk.lo & knightBB.lo) !== 0 || (knightAtk.hi & knightBB.hi) !== 0) return true;

    const kingAtk = KING_ATTACKS[kingSquare], kingBB = pieceBB(King);
    if ((kingAtk.lo & kingBB.lo) !== 0 || (kingAtk.hi & kingBB.hi) !== 0) return true;

    const pawnAtk = PAWN_ATTACKS[oppositeOfByColor][kingSquare], pawnBB = pieceBB(Pawn);
    if ((pawnAtk.lo & pawnBB.lo) !== 0 || (pawnAtk.hi & pawnBB.hi) !== 0) return true;

    const rook = pieceBB(Rook), queen = pieceBB(Queen);
    const rookQueenLo = rook.lo | queen.lo, rookQueenHi = rook.hi | queen.hi;
    const rookAtk = rookAttacks(kingSquare, overlayAll);
    if ((rookAtk.lo & rookQueenLo) !== 0 || (rookAtk.hi & rookQueenHi) !== 0) return true;

    const bishop = pieceBB(Bishop);
    const bishopQueenLo = bishop.lo | queen.lo, bishopQueenHi = bishop.hi | queen.hi;
    const bishopAtk = bishopAttacks(kingSquare, overlayAll);
    if ((bishopAtk.lo & bishopQueenLo) !== 0 || (bishopAtk.hi & bishopQueenHi) !== 0) return true;

    return false;
}

// Per-square attacker-type map for all of `color`'s pieces. Only two things
// are ever read from the result elsewhere: `!= None` (boolean "attacked?")
// and, in exactly one place (ai.js's sortMoves, `attackedPos[sq] == Pawn`),
// the specific Pawn marker — so Pawn must win whenever a pawn attacks a
// square; any other attacker type is an arbitrary-but-deterministic
// non-None/non-Pawn marker, which is all downstream code ever depends on.
function bbGetAttackedPosition(boardPos, color) {
    const bb = syncBitboards(boardPos);
    const oppositeOfColor = color === White ? Black : White;
    const result = attackedPosition.slice();

    const pawnBB = bb.piece[color][Pawn];
    const knightBB = bb.piece[color][Knight];
    const kingBB = bb.piece[color][King];
    const rook = bb.piece[color][Rook], queen = bb.piece[color][Queen], bishop = bb.piece[color][Bishop];
    const rookQueenLo = rook.lo | queen.lo, rookQueenHi = rook.hi | queen.hi;
    const bishopQueenLo = bishop.lo | queen.lo, bishopQueenHi = bishop.hi | queen.hi;

    for (let sq = 0; sq < 64; sq++) {
        const pawnAtk = PAWN_ATTACKS[oppositeOfColor][sq];
        if ((pawnAtk.lo & pawnBB.lo) !== 0 || (pawnAtk.hi & pawnBB.hi) !== 0) {
            result[sq] = Pawn;
            continue;
        }
        const knightAtk = KNIGHT_ATTACKS[sq];
        if ((knightAtk.lo & knightBB.lo) !== 0 || (knightAtk.hi & knightBB.hi) !== 0) {
            result[sq] = Knight;
            continue;
        }
        const kingAtk = KING_ATTACKS[sq];
        if ((kingAtk.lo & kingBB.lo) !== 0 || (kingAtk.hi & kingBB.hi) !== 0) {
            result[sq] = King;
            continue;
        }
        const rookAtk = rookAttacks(sq, bb.all);
        if ((rookAtk.lo & rookQueenLo) !== 0 || (rookAtk.hi & rookQueenHi) !== 0) {
            result[sq] = Rook;
            continue;
        }
        const bishopAtk = bishopAttacks(sq, bb.all);
        if ((bishopAtk.lo & bishopQueenLo) !== 0 || (bishopAtk.hi & bishopQueenHi) !== 0) {
            result[sq] = Bishop;
            continue;
        }
    }
    return result;
}

// For the side-to-move's king at kingPos: per direction, finds the nearest
// blocker; if friendly, finds the next blocker beyond it; if THAT is an
// enemy slider of the matching type, the friendly piece is pinned, and the
// allowed-squares set is every square from king+step through and including
// the pinner (matching computePinnedPieces's original rayLine semantics
// exactly, since isMoveValid's fast path depends on that exact shape).
function bbComputePinnedPieces(boardPos, kingPos, kingColor) {
    const bb = syncBitboards(boardPos);
    const enemyColor = kingColor === White ? Black : White;
    const friendlyAll = kingColor === White ? bb.white : bb.black;
    const friendlyLo = friendlyAll.lo, friendlyHi = friendlyAll.hi;
    const allLo = bb.all.lo, allHi = bb.all.hi;

    const rook = bb.piece[enemyColor][Rook], queen = bb.piece[enemyColor][Queen], bishop = bb.piece[enemyColor][Bishop];
    const rookQueenLo = rook.lo | queen.lo, rookQueenHi = rook.hi | queen.hi;
    const bishopQueenLo = bishop.lo | queen.lo, bishopQueenHi = bishop.hi | queen.hi;

    const DIRS = [
        { step: 8, positive: true, sliderLo: rookQueenLo, sliderHi: rookQueenHi },
        { step: -8, positive: false, sliderLo: rookQueenLo, sliderHi: rookQueenHi },
        { step: 1, positive: true, sliderLo: rookQueenLo, sliderHi: rookQueenHi },
        { step: -1, positive: false, sliderLo: rookQueenLo, sliderHi: rookQueenHi },
        { step: 7, positive: true, sliderLo: bishopQueenLo, sliderHi: bishopQueenHi },
        { step: -7, positive: false, sliderLo: bishopQueenLo, sliderHi: bishopQueenHi },
        { step: 9, positive: true, sliderLo: bishopQueenLo, sliderHi: bishopQueenHi },
        { step: -9, positive: false, sliderLo: bishopQueenLo, sliderHi: bishopQueenHi },
    ];

    const pinned = new Map();

    for (const dir of DIRS) {
        const fullRay = RAY_ATTACKS[dir.step][kingPos];
        const fLo = fullRay.lo, fHi = fullRay.hi;
        if (fLo === 0 && fHi === 0) continue;

        const b1Lo = fLo & allLo, b1Hi = fHi & allHi;
        if (b1Lo === 0 && b1Hi === 0) continue;
        const firstSq = dir.positive
            ? (b1Lo !== 0 ? bitScanForward32(b1Lo) : 32 + bitScanForward32(b1Hi))
            : (b1Hi !== 0 ? 32 + bitScanReverse32(b1Hi) : bitScanReverse32(b1Lo));
        const firstIsFriendly = firstSq < 32 ? (friendlyLo & (1 << firstSq)) !== 0 : (friendlyHi & (1 << (firstSq - 32))) !== 0;
        if (!firstIsFriendly) continue;

        // RAY_ATTACKS[dir.step][firstSq] is exactly the suffix of fullRay
        // strictly beyond firstSq (same direction, continuing from there).
        const raySuffix = RAY_ATTACKS[dir.step][firstSq];
        const rsLo = raySuffix.lo, rsHi = raySuffix.hi;
        const b2Lo = rsLo & allLo, b2Hi = rsHi & allHi;
        if (b2Lo === 0 && b2Hi === 0) continue;
        const secondSq = dir.positive
            ? (b2Lo !== 0 ? bitScanForward32(b2Lo) : 32 + bitScanForward32(b2Hi))
            : (b2Hi !== 0 ? 32 + bitScanReverse32(b2Hi) : bitScanReverse32(b2Lo));
        const secondIsSlider = secondSq < 32 ? (dir.sliderLo & (1 << secondSq)) !== 0 : (dir.sliderHi & (1 << (secondSq - 32))) !== 0;
        if (!secondIsSlider) continue;

        const secondRay = RAY_ATTACKS[dir.step][secondSq];
        const allowed = new Set();
        let allowedLo = fLo & ~secondRay.lo;
        while (allowedLo !== 0) {
            allowed.add(bitScanForward32(allowedLo));
            allowedLo &= allowedLo - 1;
        }
        let allowedHi = fHi & ~secondRay.hi;
        while (allowedHi !== 0) {
            allowed.add(32 + bitScanForward32(allowedHi));
            allowedHi &= allowedHi - 1;
        }
        pinned.set(firstSq, allowed);
    }

    return pinned;
}

// --- Self-test --------------------------------------------------------------
// Runs once at load, before anything above is trusted. Cross-validates
// against a genuinely independent implementation (plain row/col arithmetic,
// not reusing fileAt/rankAt/diff at all) rather than re-checking the same
// logic against itself.
(function selfTest() {
    function bitsToSet(bb) {
        const s = new Set();
        for (let i = 0; i < 64; i++) if (testBit64(bb, i)) s.add(i);
        return s;
    }
    function setsEqual(a, b) {
        if (a.size !== b.size) return false;
        for (const x of a) if (!b.has(x)) return false;
        return true;
    }
    function fail(msg) {
        throw new Error("bitboard.js self-test failed: " + msg);
    }

    // Bitscan: fast (clz32-based) vs naive, across boundary-crossing patterns.
    for (let i = 0; i < 64; i++) {
        const single = squareBit(i);
        if (bitScanForward(single) !== i) fail("bitScanForward single bit " + i);
        if (bitScanReverse(single) !== i) fail("bitScanReverse single bit " + i);
        if (bitScanForward(single) !== bitScanForwardNaive(single)) fail("bitScanForward vs naive @" + i);
        if (bitScanReverse(single) !== bitScanReverseNaive(single)) fail("bitScanReverse vs naive @" + i);
    }
    for (let i = 0; i < 32; i++) {
        for (let j = 32; j < 64; j++) {
            const bb = or64(squareBit(i), squareBit(j));
            if (bitScanForward(bb) !== i) fail("bitScanForward combined low/high " + i + "/" + j);
            if (bitScanReverse(bb) !== j) fail("bitScanReverse combined low/high " + i + "/" + j);
        }
    }

    // and64/or64/xor64/andNot64/not64/equals64 sanity.
    const a = or64(squareBit(3), squareBit(40));
    const b = or64(squareBit(3), squareBit(50));
    if (!equals64(and64(a, b), squareBit(3))) fail("and64");
    if (!equals64(or64(a, b), or64(squareBit(3), or64(squareBit(40), squareBit(50))))) fail("or64");
    if (!equals64(xor64(a, b), or64(squareBit(40), squareBit(50)))) fail("xor64");
    if (!equals64(andNot64(a, squareBit(40)), squareBit(3))) fail("andNot64");
    if (!isZero64(and64(a, not64(a)))) fail("not64");

    // Attack tables vs an independent row/col-arithmetic reference.
    for (let sq = 0; sq < 64; sq++) {
        const row = sq >> 3;
        const col = sq & 7;

        const knightRef = new Set();
        for (const [dr, dc] of [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]]) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) knightRef.add(r * 8 + c);
        }
        if (!setsEqual(bitsToSet(KNIGHT_ATTACKS[sq]), knightRef)) fail("KNIGHT_ATTACKS @" + sq);

        const kingRef = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) kingRef.add(r * 8 + c);
            }
        }
        if (!setsEqual(bitsToSet(KING_ATTACKS[sq]), kingRef)) fail("KING_ATTACKS @" + sq);

        const whitePawnRef = new Set();
        for (const dc of [-1, 1]) {
            const r = row + 1, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) whitePawnRef.add(r * 8 + c);
        }
        if (!setsEqual(bitsToSet(PAWN_ATTACKS[White][sq]), whitePawnRef)) fail("PAWN_ATTACKS[White] @" + sq);

        const blackPawnRef = new Set();
        for (const dc of [-1, 1]) {
            const r = row - 1, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) blackPawnRef.add(r * 8 + c);
        }
        if (!setsEqual(bitsToSet(PAWN_ATTACKS[Black][sq]), blackPawnRef)) fail("PAWN_ATTACKS[Black] @" + sq);

        // Rays: walk each of the 8 directions via row/col deltas to the edge.
        const rayDirs = { 8: [1, 0], "-8": [-1, 0], 1: [0, 1], "-1": [0, -1], 7: [1, -1], "-7": [-1, 1], 9: [1, 1], "-9": [-1, -1] };
        for (const step of Object.keys(rayDirs)) {
            const [dr, dc] = rayDirs[step];
            const ref = new Set();
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                ref.add(r * 8 + c);
                r += dr;
                c += dc;
            }
            if (!setsEqual(bitsToSet(RAY_ATTACKS[Number(step)][sq]), ref)) fail("RAY_ATTACKS[" + step + "] @" + sq);
        }
    }

    // Sliding attacks with blockers: spot-check a handful of occupancies
    // against a direct ray-walk-with-stop reference (independent of raySlide).
    function slideRef(sq, occ, dr, dc) {
        const ref = new Set();
        const row = sq >> 3, col = sq & 7;
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const t = r * 8 + c;
            ref.add(t);
            if (testBit64(occ, t)) break;
            r += dr;
            c += dc;
        }
        return ref;
    }
    const sampleOccupancies = [
        ZERO64,
        squareBit(27),
        or64(squareBit(20), squareBit(35)),
        or64(squareBit(0), or64(squareBit(63), squareBit(28))),
        or64(squareBit(8), or64(squareBit(9), or64(squareBit(10), squareBit(11)))), // dense rank
        or64(squareBit(3), or64(squareBit(11), or64(squareBit(19), squareBit(27)))), // dense file
        or64(squareBit(0), or64(squareBit(9), or64(squareBit(18), or64(squareBit(27), or64(squareBit(36), or64(squareBit(45), or64(squareBit(54), squareBit(63)))))))), // full main diagonal
        or64(squareBit(1), or64(squareBit(3), or64(squareBit(5), or64(squareBit(7), or64(squareBit(9), or64(squareBit(11), or64(squareBit(13), squareBit(15)))))))), // dense low half
        or64(squareBit(48), or64(squareBit(50), or64(squareBit(52), or64(squareBit(54), or64(squareBit(56), or64(squareBit(58), or64(squareBit(60), squareBit(62)))))))), // dense high half
    ];
    for (const occ of sampleOccupancies) {
        for (let sq = 0; sq < 64; sq++) {
            let rookRef = new Set();
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                for (const s of slideRef(sq, occ, dr, dc)) rookRef.add(s);
            }
            if (!setsEqual(bitsToSet(rookAttacks(sq, occ)), rookRef)) fail("rookAttacks @" + sq + " occ=" + JSON.stringify(occ));

            let bishopRef = new Set();
            for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                for (const s of slideRef(sq, occ, dr, dc)) bishopRef.add(s);
            }
            if (!setsEqual(bitsToSet(bishopAttacks(sq, occ)), bishopRef)) fail("bishopAttacks @" + sq + " occ=" + JSON.stringify(occ));
        }
    }
})();
