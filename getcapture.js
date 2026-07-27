function getCapturePawnMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos, lm) {
    let moveList = [];
    if (piece.color == White && color == White) {
        if (pos + 7 <= 63) {
            if (diff(rankAt(pos), rankAt(pos + 7)) == 1) {
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
        }
        if (pos + 9 <= 63) {
            if (diff(rankAt(pos), rankAt(pos + 9)) == 1) {
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
        if (pos - 7 >= 0) {
            if (diff(rankAt(pos), rankAt(pos - 7)) == 1) {
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
        }
        if (pos - 9 >= 0) {
            if (diff(rankAt(pos), rankAt(pos - 9)) == 1) {
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
        if (pos <= 63 - 15) {
            let pos1 = pos + 15;
            if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (move.attPiece.type != None) if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos <= 63 - 17) {
            let pos1 = pos + 17;
            if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (move.attPiece.type != None) if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos <= 63 - 6) {
            let pos1 = pos + 6;
            if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (move.attPiece.type != None) if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos <= 63 - 10) {
            let pos1 = pos + 10;
            if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (move.attPiece.type != None) if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 0 + 15) {
            let pos1 = pos - 15;
            if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (move.attPiece.type != None) if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 0 + 17) {
            let pos1 = pos - 17;
            if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (move.attPiece.type != None) if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 0 + 6) {
            let pos1 = pos - 6;
            if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (move.attPiece.type != None) if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 0 + 10) {
            let pos1 = pos - 10;
            if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (move.attPiece.type != None) if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
    }

    return moveList;
}

function getCaptureBishopMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos) {
    let moveList = [];

    let pos1 = pos;
    let pos2 = pos;
    let pos3 = pos;
    let pos4 = pos;

    if (piece.color == color) {
        while (pos1 <= 56) {
            pos1 += 7;
            if (diff(fileAt(pos1), fileAt(pos1 - 7)) == 1) {
                if (boardPos[pos1].type != None) {
                    if (boardPos[pos1].color == piece.color) {
                        break;
                    } else {
                        let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                        break;
                    }
                }
            } else {
                break;
            }
        }
        while (pos2 <= 54) {
            pos2 += 9;
            if (diff(fileAt(pos2), fileAt(pos2 - 9)) == 1) {
                if (boardPos[pos2].type != None) {
                    if (boardPos[pos2].color == piece.color) {
                        break;
                    } else {
                        let move = new Move(piece, pos, pos2, boardPos[pos2], false, null, false, null, false, null);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                        break;
                    }
                }
            } else {
                break;
            }
        }
        while (pos3 >= 7) {
            pos3 -= 7;
            if (diff(fileAt(pos3), fileAt(pos3 + 7)) == 1) {
                if (boardPos[pos3].type != None) {
                    if (boardPos[pos3].color == piece.color) {
                        break;
                    } else {
                        let move = new Move(piece, pos, pos3, boardPos[pos3], false, null, false, null, false, null);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                        break;
                    }
                }
            } else {
                break;
            }
        }
        while (pos4 >= 9) {
            pos4 -= 9;
            if (diff(fileAt(pos4), fileAt(pos4 + 9)) == 1) {
                if (boardPos[pos4].type != None) {
                    if (boardPos[pos4].color == piece.color) {
                        break;
                    } else {
                        let move = new Move(piece, pos, pos4, boardPos[pos4], false, null, false, null, false, null);
                        if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                        break;
                    }
                }
            } else {
                break;
            }
        }
    }

    return moveList;
}

function getCaptureRookMoves(pos, piece, color, boardPos, WKPos, BKPos) {
    let moveList = [];
    piece = new Piece(piece.color, piece.type);
    piece.isMoved = true;

    let pos1 = pos;
    let pos2 = pos;
    let pos3 = pos;
    let pos4 = pos;
    if (piece.color == color) {
        while (pos1 <= 55) {
            pos1 += 8;
            if (boardPos[pos1].type != None) {
                if (boardPos[pos1].color == piece.color) {
                    break;
                } else {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    break;
                }
            }
        }
        while (pos2 >= 8) {
            pos2 -= 8;
            if (boardPos[pos2].type != None) {
                if (boardPos[pos2].color == piece.color) {
                    break;
                } else {
                    let move = new Move(piece, pos, pos2, boardPos[pos2], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    break;
                }
            }
        }
        while (diff(fileAt(pos), fileAt(pos3 - 1)) == 0) {
            pos3 -= 1;
            if (boardPos[pos3].type != None) {
                if (boardPos[pos3].color == piece.color) {
                    break;
                } else {
                    let move = new Move(piece, pos, pos3, boardPos[pos3], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    break;
                }
            }
        }
        while (diff(fileAt(pos), fileAt(pos4 + 1)) == 0) {
            pos4 += 1;
            if (boardPos[pos4].type != None) {
                if (boardPos[pos4].color == piece.color) {
                    break;
                } else {
                    let move = new Move(piece, pos, pos4, boardPos[pos4], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    break;
                }
            }
        }
    }

    return moveList;
}

function getCaptureQueenMoves(pos, piece, color, boardPos, WKPos, BKPos) {
    let moveList = [];

    let pos1 = pos;
    let pos2 = pos;
    let pos3 = pos;
    let pos4 = pos;
    let pos5 = pos;
    let pos6 = pos;
    let pos7 = pos;
    let pos8 = pos;

    if (piece.color == color) {
        while (pos1 <= 56) {
            pos1 += 7;
            if (diff(fileAt(pos1), fileAt(pos1 - 7)) == 1) {
                if (boardPos[pos1].type != None) {
                    if (boardPos[pos1].color == piece.color) {
                        break;
                    } else {
                        let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                        break;
                    }
                }
            } else {
                break;
            }
        }
        while (pos2 <= 54) {
            pos2 += 9;
            if (diff(fileAt(pos2), fileAt(pos2 - 9)) == 1) {
                if (boardPos[pos2].type != None) {
                    if (boardPos[pos2].color == piece.color) {
                        break;
                    } else {
                        let move = new Move(piece, pos, pos2, boardPos[pos2], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                        break;
                    }
                }
            } else {
                break;
            }
        }
        while (pos3 >= 7) {
            pos3 -= 7;
            if (diff(fileAt(pos3), fileAt(pos3 + 7)) == 1) {
                if (boardPos[pos3].type != None) {
                    if (boardPos[pos3].color == piece.color) {
                        break;
                    } else {
                        let move = new Move(piece, pos, pos3, boardPos[pos3], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                        break;
                    }
                }
            } else {
                break;
            }
        }
        while (pos4 >= 9) {
            pos4 -= 9;
            if (diff(fileAt(pos4), fileAt(pos4 + 9)) == 1) {
                if (boardPos[pos4].type != None) {
                    if (boardPos[pos4].color == piece.color) {
                        break;
                    } else {
                        let move = new Move(piece, pos, pos4, boardPos[pos4], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                        break;
                    }
                }
            } else {
                break;
            }
        }
        while (pos5 <= 55) {
            pos5 += 8;
            if (boardPos[pos5].type != None) {
                if (boardPos[pos5].color == piece.color) {
                    break;
                } else {
                    let move = new Move(piece, pos, pos5, boardPos[pos5], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    break;
                }
            }
        }
        while (pos6 >= 8) {
            pos6 -= 8;
            if (boardPos[pos6].type != None) {
                if (boardPos[pos6].color == piece.color) {
                    break;
                } else {
                    let move = new Move(piece, pos, pos6, boardPos[pos6], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    break;
                }
            }
        }
        while (diff(fileAt(pos), fileAt(pos7 - 1)) == 0) {
            pos7 -= 1;
            if (boardPos[pos7].type != None) {
                if (boardPos[pos7].color == piece.color) {
                    break;
                } else {
                    let move = new Move(piece, pos, pos7, boardPos[pos7], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    break;
                }
            }
        }
        while (diff(fileAt(pos), fileAt(pos8 + 1)) == 0) {
            pos8 += 1;
            if (boardPos[pos8].type != None) {
                if (boardPos[pos8].color == piece.color) {
                    break;
                } else {
                    let move = new Move(piece, pos, pos8, boardPos[pos8], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    break;
                }
            }
        }
    }
    return moveList;
}

function getCaptureKingMoves(pos, piece, color, boardPos, WKPos, BKPos) {
    let moveList = [];
    piece = new Piece(piece.color, piece.type);
    piece.isMoved = true;
    if (piece.color == color) {
        if (pos <= 55) {
            let pos1 = pos + 8;
            if (boardPos[pos1].type != None) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 8) {
            let pos1 = pos - 8;
            if (boardPos[pos1].type != None) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (diff(fileAt(pos), fileAt(pos - 1)) == 0) {
            let pos1 = pos - 1;
            if (boardPos[pos1].type != None) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (diff(fileAt(pos), fileAt(pos + 1)) == 0) {
            let pos1 = pos + 1;
            if (boardPos[pos1].type != None) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos <= 56) {
            if (diff(fileAt(pos), fileAt(pos + 7)) == 1) {
                let pos1 = pos + 7;
                if (boardPos[pos1].type != None) {
                    if (boardPos[pos1].color != piece.color) {
                        let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
        if (pos <= 54) {
            if (diff(fileAt(pos), fileAt(pos + 9)) == 1) {
                let pos1 = pos + 9;
                if (boardPos[pos1].type != None) {
                    if (boardPos[pos1].color == piece.color) {
                    } else {
                        let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
        if (pos >= 7) {
            if (diff(fileAt(pos), fileAt(pos - 7)) == 1) {
                let pos1 = pos - 7;
                if (boardPos[pos1].type != None) {
                    if (boardPos[pos1].color == piece.color) {
                    } else {
                        let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
        if (pos >= 9) {
            if (diff(fileAt(pos), fileAt(pos - 9)) == 1) {
                let pos1 = pos - 9;
                if (boardPos[pos1].type != None) {
                    if (boardPos[pos1].color == piece.color) {
                    } else {
                        let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
    }

    return moveList;
}

function getAllCaptureMoves(WTM, boardPos, lm, WKPos, BKPos) {
    let pos = 0;
    let moveList = [];
    let color;
    if (WTM) {
        color = White;
    } else {
        color = Black;
    }
    boardPos.forEach((piece) => {
        if (piece.type == Pawn) {
            moveList = moveList.concat(getCapturePawnMoves(pos, piece, color, boardPos, WKPos, BKPos, lm));
        } else if (piece.type == King) {
            moveList = moveList.concat(getCaptureKingMoves(pos, piece, color, boardPos, WKPos, BKPos));
        } else if (piece.type == Queen) {
            moveList = moveList.concat(getCaptureQueenMoves(pos, piece, color, boardPos, WKPos, BKPos));
        } else if (piece.type == Rook) {
            moveList = moveList.concat(getCaptureRookMoves(pos, piece, color, boardPos, WKPos, BKPos));
        } else if (piece.type == Knight) {
            moveList = moveList.concat(getCaptureKnightMoves(pos, piece, color, boardPos, WKPos, BKPos));
        } else if (piece.type == Bishop) {
            moveList = moveList.concat(getCaptureBishopMoves(pos, piece, color, boardPos, WKPos, BKPos));
        }
        pos++;
    });

    return moveList;
}
