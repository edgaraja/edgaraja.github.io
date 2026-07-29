// Preallocated, ply-indexed Move-object pool for capture-only move
// generation. getAllCaptureMoves (the sole caller of every generator in
// this file) is called fresh at EVERY quiescence node (ai.js's
// SearchAllCapture), and its result is used exclusively within that same
// node's own SearchAllCapture call -- SearchAllCapture never stores a
// capture-move reference into the transposition table, the killer-move
// table, or anywhere else that outlives its own invocation (unlike
// chess.js's getAllMoves, which additionally serves the UI move-highlight
// path and ai.js's TT/killer bookkeeping -- pooling there would risk a
// human-facing move or a long-lived TT/killer entry getting silently
// overwritten by a later, unrelated call, so that function is deliberately
// left untouched). That makes every Move object generated here safe to
// reuse across calls, as long as reuse never crosses two calls that could
// be simultaneously in progress on the call stack -- which, same reasoning
// as ai.js's quietsScratchPool, means indexing the pool by ply (not
// resetting a single shared cursor unconditionally): within one
// root-to-current-node call chain, ply increases by exactly one at every
// recursive Search/SearchAllCapture call, so no two active invocations
// ever share a ply, and a slot only gets reused after its previous
// occupant's owning call has already returned.
const moveSlotPools = [];

function getPooledMove(ply, piece, pos, posTo, attPiece, isCastle, castleType, isPromoted, promotedTo, isEnp, enpTo) {
    let pool = moveSlotPools[ply];
    if (!pool) {
        pool = { slots: [], count: 0 };
        moveSlotPools[ply] = pool;
    }
    let slot = pool.slots[pool.count];
    if (!slot) {
        slot = new Move(piece, pos, posTo, attPiece, isCastle, castleType, isPromoted, promotedTo, isEnp, enpTo);
        pool.slots[pool.count] = slot;
    } else {
        slot.piece = piece;
        slot.pos = pos;
        slot.posTo = posTo;
        slot.attPiece = attPiece;
        slot.isCastle = isCastle;
        slot.castleType = castleType;
        slot.isPromoted = isPromoted;
        slot.promotedTo = promotedTo;
        slot.isEnp = isEnp;
        slot.enpTo = enpTo;
        slot.moveScoreGuess = 0;
    }
    pool.count++;
    return slot;
}

// Called once at the top of getAllCaptureMoves, before any of this node's
// captures are generated -- rewinds this ply's slot cursor to the start
// without discarding the underlying objects, so they get overwritten (not
// reallocated) by this call's moves.
function resetMoveSlotPool(ply) {
    const pool = moveSlotPools[ply];
    if (pool) pool.count = 0;
}

function getCapturePawnMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos, lm, ply) {
    let moveList = [];
    if (((piece) & 24) == White && color == White) {
        if (testBit64(PAWN_ATTACKS[White][pos], pos + 7)) {
            if (((boardPos[pos + 7]) & 7) != None && ((boardPos[pos + 7]) & 24) == Black) {
                const attPiece = boardPos[pos + 7];
                if (fileAt(pos + 7) == 8) {
                    // Promotion capture: validate once against a throwaway probe move
                    // (never returned -- pooled below only once validity is confirmed),
                    // then emit all 4 promotion choices as 4 separate pooled slots, since
                    // all 4 must coexist as distinct entries in the returned list.
                    const probe = new Move(piece, pos, pos + 7, attPiece, false, null, false, null, false, null);
                    if (isMoveValid(probe, whiteKingPos, blackKingPos, boardPos)) {
                        moveList.push(getPooledMove(ply, piece, pos, pos + 7, attPiece, false, null, true, ((White) | (Queen) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos + 7, attPiece, false, null, true, ((White) | (Rook) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos + 7, attPiece, false, null, true, ((White) | (Knight) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos + 7, attPiece, false, null, true, ((White) | (Bishop) | ((false) ? 32 : 0)), false, null));
                    }
                } else {
                    let move = getPooledMove(ply, piece, pos, pos + 7, attPiece, false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (testBit64(PAWN_ATTACKS[White][pos], pos + 9)) {
            if (((boardPos[pos + 9]) & 7) != None && ((boardPos[pos + 9]) & 24) == Black) {
                const attPiece = boardPos[pos + 9];
                if (fileAt(pos + 9) == 8) {
                    const probe = new Move(piece, pos, pos + 9, attPiece, false, null, false, null, false, null);
                    if (isMoveValid(probe, whiteKingPos, blackKingPos, boardPos)) {
                        moveList.push(getPooledMove(ply, piece, pos, pos + 9, attPiece, false, null, true, ((White) | (Queen) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos + 9, attPiece, false, null, true, ((White) | (Rook) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos + 9, attPiece, false, null, true, ((White) | (Knight) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos + 9, attPiece, false, null, true, ((White) | (Bishop) | ((false) ? 32 : 0)), false, null));
                    }
                } else {
                    let move = getPooledMove(ply, piece, pos, pos + 9, attPiece, false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 32 && pos <= 39) {
            if (((lm.piece) & 24) == Black && ((lm.piece) & 7) == Pawn && lm.pos - lm.posTo == 16) {
                if (diff(rankAt(pos), rankAt(pos - 1)) == 1) {
                    if (lm.posTo == pos - 1) {
                        let move = getPooledMove(ply, piece, pos, pos + 7, boardPos[pos - 1], false, null, false, null, true, pos - 1);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
                if (diff(rankAt(pos), rankAt(pos + 1)) == 1) {
                    if (lm.posTo == pos + 1) {
                        let move = getPooledMove(ply, piece, pos, pos + 9, boardPos[pos + 1], false, null, false, null, true, pos + 1);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
    } else if (((piece) & 24) == Black && color == Black) {
        if (testBit64(PAWN_ATTACKS[Black][pos], pos - 7)) {
            if (((boardPos[pos - 7]) & 7) != None && ((boardPos[pos - 7]) & 24) == White) {
                const attPiece = boardPos[pos - 7];
                if (fileAt(pos - 7) == 1) {
                    const probe = new Move(piece, pos, pos - 7, attPiece, false, null, false, null, false, null);
                    if (isMoveValid(probe, whiteKingPos, blackKingPos, boardPos)) {
                        moveList.push(getPooledMove(ply, piece, pos, pos - 7, attPiece, false, null, true, ((Black) | (Queen) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos - 7, attPiece, false, null, true, ((Black) | (Rook) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos - 7, attPiece, false, null, true, ((Black) | (Knight) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos - 7, attPiece, false, null, true, ((Black) | (Bishop) | ((false) ? 32 : 0)), false, null));
                    }
                } else {
                    let move = getPooledMove(ply, piece, pos, pos - 7, attPiece, false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (testBit64(PAWN_ATTACKS[Black][pos], pos - 9)) {
            if (((boardPos[pos - 9]) & 7) != None && ((boardPos[pos - 9]) & 24) == White) {
                const attPiece = boardPos[pos - 9];
                if (fileAt(pos - 9) == 1) {
                    const probe = new Move(piece, pos, pos - 9, attPiece, false, null, false, null, false, null);
                    if (isMoveValid(probe, whiteKingPos, blackKingPos, boardPos)) {
                        moveList.push(getPooledMove(ply, piece, pos, pos - 9, attPiece, false, null, true, ((Black) | (Queen) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos - 9, attPiece, false, null, true, ((Black) | (Rook) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos - 9, attPiece, false, null, true, ((Black) | (Knight) | ((false) ? 32 : 0)), false, null));
                        moveList.push(getPooledMove(ply, piece, pos, pos - 9, attPiece, false, null, true, ((Black) | (Bishop) | ((false) ? 32 : 0)), false, null));
                    }
                } else {
                    let move = getPooledMove(ply, piece, pos, pos - 9, attPiece, false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 24 && pos <= 31) {
            if (((lm.piece) & 24) == White && ((lm.piece) & 7) == Pawn && lm.pos - lm.posTo == -16) {
                if (diff(rankAt(pos), rankAt(pos - 1)) == 1) {
                    if (lm.posTo == pos - 1) {
                        let move = getPooledMove(ply, piece, pos, pos - 9, boardPos[pos - 1], false, null, false, null, true, pos - 1);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
                if (diff(rankAt(pos), rankAt(pos + 1)) == 1) {
                    if (lm.posTo == pos + 1) {
                        let move = getPooledMove(ply, piece, pos, pos - 7, boardPos[pos + 1], false, null, false, null, true, pos + 1);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
    }
    return moveList;
}

function getCaptureKnightMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos, ply) {
    let moveList = [];

    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = ((piece) & 24) == White ? bb.black : bb.white;
        const destBB = and64(KNIGHT_ATTACKS[pos], enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = getPooledMove(ply, piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getCaptureBishopMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos, ply) {
    let moveList = [];

    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = ((piece) & 24) == White ? bb.black : bb.white;
        const destBB = and64(bishopAttacks(pos, bb.all), enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = getPooledMove(ply, piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getCaptureRookMoves(pos, piece, color, boardPos, WKPos, BKPos, ply) {
    let moveList = [];
    piece = ((((piece) & 24)) | (((piece) & 7)) | ((true) ? 32 : 0));

    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = ((piece) & 24) == White ? bb.black : bb.white;
        const destBB = and64(rookAttacks(pos, bb.all), enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = getPooledMove(ply, piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getCaptureQueenMoves(pos, piece, color, boardPos, WKPos, BKPos, ply) {
    let moveList = [];

    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = ((piece) & 24) == White ? bb.black : bb.white;
        const destBB = and64(queenAttacks(pos, bb.all), enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = getPooledMove(ply, piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
        });
    }
    return moveList;
}

function getCaptureKingMoves(pos, piece, color, boardPos, WKPos, BKPos, ply) {
    let moveList = [];
    piece = ((((piece) & 24)) | (((piece) & 7)) | ((true) ? 32 : 0));
    if (((piece) & 24) == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = ((piece) & 24) == White ? bb.black : bb.white;
        const destBB = and64(KING_ATTACKS[pos], enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = getPooledMove(ply, piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getAllCaptureMoves(WTM, boardPos, lm, WKPos, BKPos, ply) {
    resetMoveSlotPool(ply);
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

    // See getAllMoves (chess.js) for why: skip opponent pieces before
    // calling a generator, and push into one array instead of
    // moveList.concat(...) reassigning/copying on every piece.
    for (let sq = 0; sq < 64; sq++) {
        const piece = boardPos[sq];
        if (((piece) & 24) !== color) continue;
        let pieceMoves;
        if (((piece) & 7) == Pawn) {
            pieceMoves = getCapturePawnMoves(sq, piece, color, boardPos, WKPos, BKPos, lm, ply);
        } else if (((piece) & 7) == King) {
            pieceMoves = getCaptureKingMoves(sq, piece, color, boardPos, WKPos, BKPos, ply);
        } else if (((piece) & 7) == Queen) {
            pieceMoves = getCaptureQueenMoves(sq, piece, color, boardPos, WKPos, BKPos, ply);
        } else if (((piece) & 7) == Rook) {
            pieceMoves = getCaptureRookMoves(sq, piece, color, boardPos, WKPos, BKPos, ply);
        } else if (((piece) & 7) == Knight) {
            pieceMoves = getCaptureKnightMoves(sq, piece, color, boardPos, WKPos, BKPos, ply);
        } else if (((piece) & 7) == Bishop) {
            pieceMoves = getCaptureBishopMoves(sq, piece, color, boardPos, WKPos, BKPos, ply);
        } else {
            continue;
        }
        for (let i = 0; i < pieceMoves.length; i++) moveList.push(pieceMoves[i]);
    }

    return moveList;
}
