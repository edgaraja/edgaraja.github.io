function getCapturePawnMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos, lm) {
    let moveList = [];
    if (piece.color == White && color == White) {
        if (testBit64(PAWN_ATTACKS[White][pos], pos + 7)) {
            if (boardPos[pos + 7].type != None && boardPos[pos + 7].color == Black) {
                let move = new Move(piece, pos, pos + 7, boardPos[pos + 7], false, null, false, null, false, null);
                let move1;
                let move2;
                let move3;
                let move4;
                if (fileAt(pos + 7) == 8) {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                        move.isPromoted = true;
                        move.promotedTo = new Piece(White, Queen);
                        move1 = structuredClone(move);
                        move.promotedTo = new Piece(White, Rook);
                        move2 = structuredClone(move);
                        move.promotedTo = new Piece(White, Knight);
                        move3 = structuredClone(move);
                        move.promotedTo = new Piece(White, Bishop);
                        move4 = structuredClone(move);
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
            if (boardPos[pos + 9].type != None && boardPos[pos + 9].color == Black) {
                let move = new Move(piece, pos, pos + 9, boardPos[pos + 9], false, null, false, null, false, null);
                let move1;
                let move2;
                let move3;
                let move4;
                if (fileAt(pos + 9) == 8) {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                        move.isPromoted = true;
                        move.promotedTo = new Piece(White, Queen);
                        move1 = structuredClone(move);
                        move.promotedTo = new Piece(White, Rook);
                        move2 = structuredClone(move);
                        move.promotedTo = new Piece(White, Knight);
                        move3 = structuredClone(move);
                        move.promotedTo = new Piece(White, Bishop);
                        move4 = structuredClone(move);
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
            if (lm.piece.color == Black && lm.piece.type == Pawn && lm.pos - lm.posTo == 16) {
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
    } else if (piece.color == Black && color == Black) {
        if (testBit64(PAWN_ATTACKS[Black][pos], pos - 7)) {
            if (boardPos[pos - 7].type != None && boardPos[pos - 7].color == White) {
                let move = new Move(piece, pos, pos - 7, boardPos[pos - 7], false, null, false, null, false, null);
                let move1;
                let move2;
                let move3;
                let move4;
                if (fileAt(pos - 7) == 1) {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                        move.isPromoted = true;
                        move.promotedTo = new Piece(Black, Queen);
                        move1 = structuredClone(move);
                        move.promotedTo = new Piece(Black, Rook);
                        move2 = structuredClone(move);
                        move.promotedTo = new Piece(Black, Knight);
                        move3 = structuredClone(move);
                        move.promotedTo = new Piece(Black, Bishop);
                        move4 = structuredClone(move);
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
            if (boardPos[pos - 9].type != None && boardPos[pos - 9].color == White) {
                let move = new Move(piece, pos, pos - 9, boardPos[pos - 9], false, null, false, null, false, null);
                let move1;
                let move2;
                let move3;
                let move4;
                if (fileAt(pos - 9) == 1) {
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) {
                        move.isPromoted = true;
                        move.promotedTo = new Piece(Black, Queen);
                        move1 = structuredClone(move);
                        move.promotedTo = new Piece(Black, Rook);
                        move2 = structuredClone(move);
                        move.promotedTo = new Piece(Black, Knight);
                        move3 = structuredClone(move);
                        move.promotedTo = new Piece(Black, Bishop);
                        move4 = structuredClone(move);
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
            if (lm.piece.color == White && lm.piece.type == Pawn && lm.pos - lm.posTo == -16) {
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

function getCaptureKnightMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos) {
    let moveList = [];

    if (piece.color == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = piece.color == White ? bb.black : bb.white;
        const destBB = and64(KNIGHT_ATTACKS[pos], enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getCaptureBishopMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos) {
    let moveList = [];

    if (piece.color == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = piece.color == White ? bb.black : bb.white;
        const destBB = and64(bishopAttacks(pos, bb.all), enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getCaptureRookMoves(pos, piece, color, boardPos, WKPos, BKPos) {
    let moveList = [];
    piece = new Piece(piece.color, piece.type);
    piece.isMoved = true;

    if (piece.color == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = piece.color == White ? bb.black : bb.white;
        const destBB = and64(rookAttacks(pos, bb.all), enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getCaptureQueenMoves(pos, piece, color, boardPos, WKPos, BKPos) {
    let moveList = [];

    if (piece.color == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = piece.color == White ? bb.black : bb.white;
        const destBB = and64(queenAttacks(pos, bb.all), enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
        });
    }
    return moveList;
}

function getCaptureKingMoves(pos, piece, color, boardPos, WKPos, BKPos) {
    let moveList = [];
    piece = new Piece(piece.color, piece.type);
    piece.isMoved = true;
    if (piece.color == color) {
        const bb = syncBitboards(boardPos);
        const enemyOcc = piece.color == White ? bb.black : bb.white;
        const destBB = and64(KING_ATTACKS[pos], enemyOcc);
        forEachBit(destBB, (pos1) => {
            let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
            if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
        });
    }

    return moveList;
}

function getAllCaptureMoves(WTM, boardPos, lm, WKPos, BKPos) {
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
        if (piece.color !== color) continue;
        let pieceMoves;
        if (piece.type == Pawn) {
            pieceMoves = getCapturePawnMoves(sq, piece, color, boardPos, WKPos, BKPos, lm);
        } else if (piece.type == King) {
            pieceMoves = getCaptureKingMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else if (piece.type == Queen) {
            pieceMoves = getCaptureQueenMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else if (piece.type == Rook) {
            pieceMoves = getCaptureRookMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else if (piece.type == Knight) {
            pieceMoves = getCaptureKnightMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else if (piece.type == Bishop) {
            pieceMoves = getCaptureBishopMoves(sq, piece, color, boardPos, WKPos, BKPos);
        } else {
            continue;
        }
        for (let i = 0; i < pieceMoves.length; i++) moveList.push(pieceMoves[i]);
    }

    return moveList;
}
