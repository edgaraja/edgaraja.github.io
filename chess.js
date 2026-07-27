var lightColor = "#EEEED2";
var darkColor = "#769656";
var defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
var container = document.getElementById("container");
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
var evalBarWhiteFill = null;
var evalBarLabel = null;
var boardFlipped = false;
var rankLabelEls = [];
var fileLabelEls = [];
var searchInfoLabel = null;

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
class Piece {
    constructor(color, type) {
        this.color = color;
        this.type = type;
        this.isMoved = false;
    }
}
var lastMove = new Move(new Piece(None, None), 0, 0, 0, false, null, false, null, false, null);

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
            boardPosition.push(new Piece(None, None));
            attackedPosition.push(None);
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

    container.appendChild(boardWithLabels);
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
    container.insertBefore(wrapper, container.firstChild);

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

// Instant static evaluation (no search) so this can update after every
// move, human or AI, with no added delay.
function updateEvalBar() {
    if (!evalBarWhiteFill) return;
    var score = Evaluate(true, boardPosition);
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
    btn.style.display = "block";
    btn.style.margin = "16px auto";
    btn.style.padding = "8px 20px";
    btn.style.fontSize = "16px";
    btn.style.cursor = "pointer";
    btn.style.background = "#769656";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.addEventListener("click", function () {
        boardFlipped = !boardFlipped;
        applyBoardOrientation();
        updateBoardLabels();
    });
    document.body.appendChild(btn);
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
    label.style.margin = "8px 0";
    document.body.appendChild(label);
    searchInfoLabel = label;
}

function getAttackedPosition(boardPos, color) {
    let newAttPos = attackedPosition.slice();
    for (let i = 0; i < 64; i++) {
        let pos = i;
        if (boardPos[pos].color == color) {
            if (boardPos[i].type == King) {
                if (pos <= 55) {
                    let pos1 = pos + 8;
                    if (newAttPos[pos1] != Pawn) newAttPos[pos1] = King;
                }
                if (pos >= 8) {
                    let pos1 = pos - 8;
                    if (newAttPos[pos1] != Pawn) newAttPos[pos1] = King;
                }
                if (diff(fileAt(pos), fileAt(pos - 1)) == 0) {
                    let pos1 = pos - 1;
                    if (newAttPos[pos1] != Pawn) newAttPos[pos1] = King;
                }
                if (diff(fileAt(pos), fileAt(pos + 1)) == 0) {
                    let pos1 = pos + 1;
                    if (newAttPos[pos1] != Pawn) newAttPos[pos1] = King;
                }
                if (pos <= 56) {
                    if (diff(fileAt(pos), fileAt(pos + 7)) == 1) {
                        let pos1 = pos + 7;
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = King;
                    }
                }
                if (pos <= 54) {
                    if (diff(fileAt(pos), fileAt(pos + 9)) == 1) {
                        let pos1 = pos + 9;
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = King;
                    }
                }
                if (pos >= 7) {
                    if (diff(fileAt(pos), fileAt(pos - 7)) == 1) {
                        let pos1 = pos - 7;
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = King;
                    }
                }
                if (pos >= 9) {
                    if (diff(fileAt(pos), fileAt(pos - 9)) == 1) {
                        let pos1 = pos - 9;
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = King;
                    }
                }
            }
            if (boardPos[i].type == Queen) {
                let pos1 = pos;
                let pos2 = pos;
                let pos3 = pos;
                let pos4 = pos;
                let pos5 = pos;
                let pos6 = pos;
                let pos7 = pos;
                let pos8 = pos;
                while (pos1 <= 56) {
                    pos1 += 7;
                    if (diff(fileAt(pos1 - 7), fileAt(pos1)) == 1) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Queen;
                        if (boardPos[pos1].type != None) {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                while (pos2 <= 54) {
                    pos2 += 9;
                    if (diff(fileAt(pos2 - 9), fileAt(pos2)) == 1) {
                        if (newAttPos[pos2] != Pawn) newAttPos[pos2] = Queen;
                        if (boardPos[pos2].type != None) {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                while (pos3 >= 7) {
                    pos3 -= 7;
                    if (diff(fileAt(pos3 + 7), fileAt(pos3)) == 1) {
                        if (newAttPos[pos3] != Pawn) newAttPos[pos3] = Queen;
                        if (boardPos[pos3].type != None) {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                while (pos4 >= 9) {
                    pos4 -= 9;
                    if (diff(fileAt(pos4 + 9), fileAt(pos4)) == 1) {
                        if (newAttPos[pos4] != Pawn) newAttPos[pos4] = Queen;
                        if (boardPos[pos4].type != None) {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                while (pos5 <= 55) {
                    pos5 += 8;
                    if (newAttPos[pos5] != Pawn) newAttPos[pos5] = Queen;
                    if (boardPos[pos5].type != None) {
                        break;
                    }
                }
                while (pos6 >= 8) {
                    pos6 -= 8;
                    if (newAttPos[pos6] != Pawn) newAttPos[pos6] = Queen;
                    if (boardPos[pos6].type != None) {
                        break;
                    }
                }
                while (diff(fileAt(pos), fileAt(pos7 - 1)) == 0) {
                    pos7 -= 1;
                    if (newAttPos[pos7] != Pawn) newAttPos[pos7] = Queen;
                    if (boardPos[pos7].type != None) {
                        break;
                    }
                }
                while (diff(fileAt(pos), fileAt(pos8 + 1)) == 0) {
                    pos8 += 1;
                    if (newAttPos[pos8] != Pawn) newAttPos[pos8] = Queen;
                    if (boardPos[pos8].type != None) {
                        break;
                    }
                }
            }
            if (boardPos[i].type == Bishop) {
                let pos1 = pos;
                let pos2 = pos;
                let pos3 = pos;
                let pos4 = pos;
                while (pos1 <= 56) {
                    pos1 += 7;
                    if (diff(fileAt(pos1 - 7), fileAt(pos1)) == 1) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Bishop;
                        if (boardPos[pos1].type != None) {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                while (pos2 <= 54) {
                    pos2 += 9;
                    if (diff(fileAt(pos2 - 9), fileAt(pos2)) == 1) {
                        if (newAttPos[pos2] != Pawn) newAttPos[pos2] = Bishop;
                        if (boardPos[pos2].type != None) {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                while (pos3 >= 7) {
                    pos3 -= 7;
                    if (diff(fileAt(pos3 + 7), fileAt(pos3)) == 1) {
                        if (newAttPos[pos3] != Pawn) newAttPos[pos3] = Bishop;
                        if (boardPos[pos3].type != None) {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                while (pos4 >= 9) {
                    pos4 -= 9;
                    if (diff(fileAt(pos4 + 9), fileAt(pos4)) == 1) {
                        if (newAttPos[pos4] != Pawn) newAttPos[pos4] = Bishop;
                        if (boardPos[pos4].type != None) {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }
            if (boardPos[i].type == Rook) {
                let pos5 = pos;
                let pos6 = pos;
                let pos7 = pos;
                let pos8 = pos;
                while (pos5 <= 55) {
                    pos5 += 8;
                    if (newAttPos[pos5] != Pawn) newAttPos[pos5] = Rook;
                    if (boardPos[pos5].type != None) {
                        break;
                    }
                }
                while (pos6 >= 8) {
                    pos6 -= 8;
                    if (newAttPos[pos6] != Pawn) newAttPos[pos6] = Rook;
                    if (boardPos[pos6].type != None) {
                        break;
                    }
                }
                while (diff(fileAt(pos), fileAt(pos7 - 1)) == 0) {
                    pos7 -= 1;
                    if (newAttPos[pos7] != Pawn) newAttPos[pos7] = Rook;
                    if (boardPos[pos7].type != None) {
                        break;
                    }
                }
                while (diff(fileAt(pos), fileAt(pos8 + 1)) == 0) {
                    pos8 += 1;
                    if (newAttPos[pos8] != Pawn) newAttPos[pos8] = Rook;
                    if (boardPos[pos8].type != None) {
                        break;
                    }
                }
            }
            if (boardPos[i].type == Knight) {
                if (pos <= 63 - 15) {
                    let pos1 = pos + 15;
                    if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Knight;
                    }
                }
                if (pos <= 63 - 17) {
                    let pos1 = pos + 17;
                    if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Knight;
                    }
                }
                if (pos <= 63 - 6) {
                    let pos1 = pos + 6;
                    if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Knight;
                    }
                }
                if (pos <= 63 - 10) {
                    let pos1 = pos + 10;
                    if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Knight;
                    }
                }
                if (pos >= 0 + 15) {
                    let pos1 = pos - 15;
                    if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Knight;
                    }
                }
                if (pos >= 0 + 17) {
                    let pos1 = pos - 17;
                    if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Knight;
                    }
                }
                if (pos >= 0 + 6) {
                    let pos1 = pos - 6;
                    if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Knight;
                    }
                }
                if (pos >= 0 + 10) {
                    let pos1 = pos - 10;
                    if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                        if (newAttPos[pos1] != Pawn) newAttPos[pos1] = Knight;
                    }
                }
            }
            if (boardPos[i].type == Pawn) {
                if (boardPos[i].color == White) {
                    if (pos + 7 <= 63) {
                        if (diff(rankAt(pos), rankAt(pos + 7)) == 1) {
                            newAttPos[pos + 7] = Pawn;
                        }
                    }
                    if (pos + 9 <= 63) {
                        if (diff(rankAt(pos), rankAt(pos + 9)) == 1) {
                            newAttPos[pos + 9] = Pawn;
                        }
                    }
                } else if (boardPos[i].color == Black) {
                    if (pos - 7 >= 0) {
                        if (diff(rankAt(pos), rankAt(pos - 7)) == 1) {
                            newAttPos[pos - 7] = Pawn;
                        }
                    }
                    if (pos - 9 >= 0) {
                        if (diff(rankAt(pos), rankAt(pos - 9)) == 1) {
                            newAttPos[pos - 9] = Pawn;
                        }
                    }
                }
            }
        }
    }
    return newAttPos;
}

// Like getAttackedPosition, but answers "is this one square attacked by
// byColor?" by scanning outward from `square` and stopping at the first
// piece found in each direction, instead of building an attack map for
// every square on the board. Used on the legality-check hot path, where
// getAttackedPosition's full-board scan was the dominant search cost.
function isSquareAttacked(boardPos, square, byColor) {
    // Straight lines (rook/queen)
    let r1 = square;
    while (r1 <= 55) {
        r1 += 8;
        if (boardPos[r1].type != None) {
            if (boardPos[r1].color == byColor && (boardPos[r1].type == Rook || boardPos[r1].type == Queen)) return true;
            break;
        }
    }
    let r2 = square;
    while (r2 >= 8) {
        r2 -= 8;
        if (boardPos[r2].type != None) {
            if (boardPos[r2].color == byColor && (boardPos[r2].type == Rook || boardPos[r2].type == Queen)) return true;
            break;
        }
    }
    let r3 = square;
    while (diff(fileAt(square), fileAt(r3 - 1)) == 0) {
        r3 -= 1;
        if (boardPos[r3].type != None) {
            if (boardPos[r3].color == byColor && (boardPos[r3].type == Rook || boardPos[r3].type == Queen)) return true;
            break;
        }
    }
    let r4 = square;
    while (diff(fileAt(square), fileAt(r4 + 1)) == 0) {
        r4 += 1;
        if (boardPos[r4].type != None) {
            if (boardPos[r4].color == byColor && (boardPos[r4].type == Rook || boardPos[r4].type == Queen)) return true;
            break;
        }
    }

    // Diagonals (bishop/queen)
    let d1 = square;
    while (d1 <= 56 && diff(fileAt(d1), fileAt(d1 + 7)) == 1) {
        d1 += 7;
        if (boardPos[d1].type != None) {
            if (boardPos[d1].color == byColor && (boardPos[d1].type == Bishop || boardPos[d1].type == Queen)) return true;
            break;
        }
    }
    let d2 = square;
    while (d2 <= 54 && diff(fileAt(d2), fileAt(d2 + 9)) == 1) {
        d2 += 9;
        if (boardPos[d2].type != None) {
            if (boardPos[d2].color == byColor && (boardPos[d2].type == Bishop || boardPos[d2].type == Queen)) return true;
            break;
        }
    }
    let d3 = square;
    while (d3 >= 7 && diff(fileAt(d3), fileAt(d3 - 7)) == 1) {
        d3 -= 7;
        if (boardPos[d3].type != None) {
            if (boardPos[d3].color == byColor && (boardPos[d3].type == Bishop || boardPos[d3].type == Queen)) return true;
            break;
        }
    }
    let d4 = square;
    while (d4 >= 9 && diff(fileAt(d4), fileAt(d4 - 9)) == 1) {
        d4 -= 9;
        if (boardPos[d4].type != None) {
            if (boardPos[d4].color == byColor && (boardPos[d4].type == Bishop || boardPos[d4].type == Queen)) return true;
            break;
        }
    }

    // Knight
    if (square <= 63 - 15) {
        let p = square + 15;
        if (diff(fileAt(square), fileAt(p)) == 2 && diff(rankAt(square), rankAt(p)) == 1 && boardPos[p].color == byColor && boardPos[p].type == Knight) return true;
    }
    if (square <= 63 - 17) {
        let p = square + 17;
        if (diff(fileAt(square), fileAt(p)) == 2 && diff(rankAt(square), rankAt(p)) == 1 && boardPos[p].color == byColor && boardPos[p].type == Knight) return true;
    }
    if (square <= 63 - 6) {
        let p = square + 6;
        if (diff(fileAt(square), fileAt(p)) == 1 && diff(rankAt(square), rankAt(p)) == 2 && boardPos[p].color == byColor && boardPos[p].type == Knight) return true;
    }
    if (square <= 63 - 10) {
        let p = square + 10;
        if (diff(fileAt(square), fileAt(p)) == 1 && diff(rankAt(square), rankAt(p)) == 2 && boardPos[p].color == byColor && boardPos[p].type == Knight) return true;
    }
    if (square >= 15) {
        let p = square - 15;
        if (diff(fileAt(square), fileAt(p)) == 2 && diff(rankAt(square), rankAt(p)) == 1 && boardPos[p].color == byColor && boardPos[p].type == Knight) return true;
    }
    if (square >= 17) {
        let p = square - 17;
        if (diff(fileAt(square), fileAt(p)) == 2 && diff(rankAt(square), rankAt(p)) == 1 && boardPos[p].color == byColor && boardPos[p].type == Knight) return true;
    }
    if (square >= 6) {
        let p = square - 6;
        if (diff(fileAt(square), fileAt(p)) == 1 && diff(rankAt(square), rankAt(p)) == 2 && boardPos[p].color == byColor && boardPos[p].type == Knight) return true;
    }
    if (square >= 10) {
        let p = square - 10;
        if (diff(fileAt(square), fileAt(p)) == 1 && diff(rankAt(square), rankAt(p)) == 2 && boardPos[p].color == byColor && boardPos[p].type == Knight) return true;
    }

    // King
    if (square <= 55) {
        let p = square + 8;
        if (boardPos[p].color == byColor && boardPos[p].type == King) return true;
    }
    if (square >= 8) {
        let p = square - 8;
        if (boardPos[p].color == byColor && boardPos[p].type == King) return true;
    }
    if (diff(fileAt(square), fileAt(square - 1)) == 0) {
        let p = square - 1;
        if (boardPos[p].color == byColor && boardPos[p].type == King) return true;
    }
    if (diff(fileAt(square), fileAt(square + 1)) == 0) {
        let p = square + 1;
        if (boardPos[p].color == byColor && boardPos[p].type == King) return true;
    }
    if (square <= 56 && diff(fileAt(square), fileAt(square + 7)) == 1) {
        let p = square + 7;
        if (boardPos[p].color == byColor && boardPos[p].type == King) return true;
    }
    if (square <= 54 && diff(fileAt(square), fileAt(square + 9)) == 1) {
        let p = square + 9;
        if (boardPos[p].color == byColor && boardPos[p].type == King) return true;
    }
    if (square >= 7 && diff(fileAt(square), fileAt(square - 7)) == 1) {
        let p = square - 7;
        if (boardPos[p].color == byColor && boardPos[p].type == King) return true;
    }
    if (square >= 9 && diff(fileAt(square), fileAt(square - 9)) == 1) {
        let p = square - 9;
        if (boardPos[p].color == byColor && boardPos[p].type == King) return true;
    }

    // Pawn
    if (byColor == White) {
        if (square - 7 >= 0 && diff(rankAt(square), rankAt(square - 7)) == 1) {
            let p = square - 7;
            if (boardPos[p].color == White && boardPos[p].type == Pawn) return true;
        }
        if (square - 9 >= 0 && diff(rankAt(square), rankAt(square - 9)) == 1) {
            let p = square - 9;
            if (boardPos[p].color == White && boardPos[p].type == Pawn) return true;
        }
    } else {
        if (square + 7 <= 63 && diff(rankAt(square), rankAt(square + 7)) == 1) {
            let p = square + 7;
            if (boardPos[p].color == Black && boardPos[p].type == Pawn) return true;
        }
        if (square + 9 <= 63 && diff(rankAt(square), rankAt(square + 9)) == 1) {
            let p = square + 9;
            if (boardPos[p].color == Black && boardPos[p].type == Pawn) return true;
        }
    }

    return false;
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
    const enemyColor = kingColor === White ? Black : White;
    const pinned = new Map();

    const dirs = [
        { step: 8, bound: (p) => p <= 55, guard: () => true, sliders: [Rook, Queen] },
        { step: -8, bound: (p) => p >= 8, guard: () => true, sliders: [Rook, Queen] },
        { step: -1, bound: () => true, guard: (p) => diff(fileAt(kingPos), fileAt(p - 1)) == 0, sliders: [Rook, Queen] },
        { step: 1, bound: () => true, guard: (p) => diff(fileAt(kingPos), fileAt(p + 1)) == 0, sliders: [Rook, Queen] },
        { step: 7, bound: (p) => p <= 56, guard: (p) => diff(fileAt(p), fileAt(p + 7)) == 1, sliders: [Bishop, Queen] },
        { step: 9, bound: (p) => p <= 54, guard: (p) => diff(fileAt(p), fileAt(p + 9)) == 1, sliders: [Bishop, Queen] },
        { step: -7, bound: (p) => p >= 7, guard: (p) => diff(fileAt(p), fileAt(p - 7)) == 1, sliders: [Bishop, Queen] },
        { step: -9, bound: (p) => p >= 9, guard: (p) => diff(fileAt(p), fileAt(p - 9)) == 1, sliders: [Bishop, Queen] },
    ];

    for (const dir of dirs) {
        let cur = kingPos;
        const rayLine = [];
        let friendlyPos = -1;
        while (dir.bound(cur) && dir.guard(cur)) {
            cur += dir.step;
            rayLine.push(cur);
            if (boardPos[cur].type != None) {
                if (friendlyPos === -1 && boardPos[cur].color === kingColor) {
                    friendlyPos = cur;
                    continue;
                }
                if (friendlyPos !== -1 && boardPos[cur].color === enemyColor && dir.sliders.includes(boardPos[cur].type)) {
                    pinned.set(friendlyPos, new Set(rayLine));
                }
                break;
            }
        }
    }

    return pinned;
}

function isMoveValidForCastle(move, WKPos, BKPos, Bpos) {
    let kingPos;
    let color;
    if (move.piece.color == White) {
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
    if (!currentKingInCheck && move.piece.type !== King && !move.isEnp && currentPinnedMap) {
        const allowed = currentPinnedMap.get(move.pos);
        if (!allowed) return true;
        return allowed.has(move.posTo);
    }

    let boardPos = moveToBoard(move, Bpos);
    if (move.piece.type == King) {
        if (move.piece.color == Black) {
            BKPos = move.posTo;
        } else {
            WKPos = move.posTo;
        }
    }
    let color;
    let kingPos;
    if (move.piece.color == White) {
        color = Black;
        kingPos = WKPos;
    } else {
        color = White;
        kingPos = BKPos;
    }
    return !isSquareAttacked(boardPos, kingPos, color);
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
        newBoardPos[move.pos] = new Piece(None, None);
        newBoardPos[move.posTo] = move.piece;
    } else if (move.isEnp) {
        newBoardPos[move.pos] = new Piece(None, None);
        newBoardPos[move.posTo] = move.piece;
        newBoardPos[move.enpTo] = new Piece(None, None);
    } else if (move.isCastle) {
        if (move.castleType == "l") {
            newBoardPos[move.pos] = new Piece(None, None);
            newBoardPos[move.posTo] = move.piece;
            newBoardPos[move.posTo + 1] = newBoardPos[move.posTo - 2];
            newBoardPos[move.posTo - 2] = new Piece(None, None);
        } else if (move.castleType == "s") {
            newBoardPos[move.pos] = new Piece(None, None);
            newBoardPos[move.posTo] = move.piece;
            newBoardPos[move.posTo - 1] = newBoardPos[move.posTo + 1];
            newBoardPos[move.posTo + 1] = new Piece(None, None);
        }
    } else if (move.isPromoted == true) {
        newBoardPos[move.pos] = new Piece(None, None);
        newBoardPos[move.posTo] = move.promotedTo;
    }

    return newBoardPos;
}

function fileAt(pos) {
    if (pos >= 0 && pos <= 7) {
        return 1;
    } else if (pos >= 8 && pos <= 15) {
        return 2;
    } else if (pos >= 16 && pos <= 23) {
        return 3;
    } else if (pos >= 24 && pos <= 31) {
        return 4;
    } else if (pos >= 32 && pos <= 39) {
        return 5;
    } else if (pos >= 40 && pos <= 47) {
        return 6;
    } else if (pos >= 48 && pos <= 55) {
        return 7;
    } else if (pos >= 56 && pos <= 63) {
        return 8;
    }
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
        if (boardPos[i].color == White) {
            if (boardPos[i].type == King) {
                pos.classList.add("WhiteKing");
            } else if (boardPos[i].type == Queen) {
                pos.classList.add("WhiteQueen");
            } else if (boardPos[i].type == Rook) {
                pos.classList.add("WhiteRook");
            } else if (boardPos[i].type == Knight) {
                pos.classList.add("WhiteKnight");
            } else if (boardPos[i].type == Bishop) {
                pos.classList.add("WhiteBishop");
            } else if (boardPos[i].type == Pawn) {
                pos.classList.add("WhitePawn");
            }
        } else if (boardPos[i].color == Black) {
            if (boardPos[i].type == King) {
                pos.classList.add("BlackKing");
            } else if (boardPos[i].type == Queen) {
                pos.classList.add("BlackQueen");
            } else if (boardPos[i].type == Rook) {
                pos.classList.add("BlackRook");
            } else if (boardPos[i].type == Knight) {
                pos.classList.add("BlackKnight");
            } else if (boardPos[i].type == Bishop) {
                pos.classList.add("BlackBishop");
            } else if (boardPos[i].type == Pawn) {
                pos.classList.add("BlackPawn");
            }
        }
        pos.setAttribute("color", boardPos[i].color);
        pos.setAttribute("type", boardPos[i].type);
    }
}

function generatePieces(FEN) {
    let pos = 56;
    let flag = 0;
    for (i = 0; i < FEN.length; i++) {
        if (flag == 0) {
            if (FEN[i] == "K") {
                boardPosition[pos] = new Piece(White, King);
                WhiteKingPos = pos;
                pos++;
                pieceCount++;
            } else if (FEN[i] == "Q") {
                boardPosition[pos] = new Piece(White, Queen);
                pos++;
                pieceCount++;
            } else if (FEN[i] == "R") {
                boardPosition[pos] = new Piece(White, Rook);
                pos++;
                pieceCount++;
            } else if (FEN[i] == "N") {
                boardPosition[pos] = new Piece(White, Knight);
                pos++;
                pieceCount++;
            } else if (FEN[i] == "B") {
                boardPosition[pos] = new Piece(White, Bishop);
                pos++;
                pieceCount++;
            } else if (FEN[i] == "P") {
                boardPosition[pos] = new Piece(White, Pawn);
                pos++;
                pieceCount++;
            } else if (FEN[i] == "k") {
                boardPosition[pos] = new Piece(Black, King);
                BlackKingPos = pos;
                pos++;
                pieceCount++;
            } else if (FEN[i] == "q") {
                boardPosition[pos] = new Piece(Black, Queen);
                pos++;
                pieceCount++;
            } else if (FEN[i] == "r") {
                boardPosition[pos] = new Piece(Black, Rook);
                pos++;
                pieceCount++;
            } else if (FEN[i] == "n") {
                boardPosition[pos] = new Piece(Black, Knight);
                pos++;
                pieceCount++;
            } else if (FEN[i] == "b") {
                boardPosition[pos] = new Piece(Black, Bishop);
                pos++;
                pieceCount++;
            } else if (FEN[i] == "p") {
                boardPosition[pos] = new Piece(Black, Pawn);
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
    if (piece.color == White && color == White) {
        if (pos >= 8 && pos <= 15) {
            if (boardPos[pos + 8].type == None) {
                let move = new Move(piece, pos, pos + 8, boardPos[pos + 8], false, null, false, null, false, null);
                if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                if (boardPos[pos + 16].type == None) {
                    let move = new Move(piece, pos, pos + 16, boardPos[pos + 16], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        } else {
            if (pos + 8 <= 63) {
                if (boardPos[pos + 8].type == None) {
                    let move = new Move(piece, pos, pos + 8, boardPos[pos + 8], false, null, false, null, false, null);
                    let move1;
                    let move2;
                    let move3;
                    let move4;
                    if (fileAt(pos + 8) == 8) {
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
        if (pos >= 48 && pos <= 55) {
            if (boardPos[pos - 8].type == None) {
                let move = new Move(piece, pos, pos - 8, boardPos[pos - 8], false, null, false, null, false, null);
                if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                if (boardPos[pos - 16].type == None) {
                    let move = new Move(piece, pos, pos - 16, boardPos[pos - 16], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        } else {
            if (pos - 8 >= 0) {
                if (boardPos[pos - 8].type == None) {
                    let move = new Move(piece, pos, pos - 8, boardPos[pos - 8], false, null, false, null, false, null);
                    let move1;
                    let move2;
                    let move3;
                    let move4;
                    if (fileAt(pos - 8) == 1) {
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

function getKnightMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos) {
    let moveList = [];

    if (piece.color == color) {
        if (pos <= 63 - 15) {
            let pos1 = pos + 15;
            if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos <= 63 - 17) {
            let pos1 = pos + 17;
            if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos <= 63 - 6) {
            let pos1 = pos + 6;
            if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos <= 63 - 10) {
            let pos1 = pos + 10;
            if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 0 + 15) {
            let pos1 = pos - 15;
            if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 0 + 17) {
            let pos1 = pos - 17;
            if (diff(fileAt(pos), fileAt(pos1)) == 2 && diff(rankAt(pos), rankAt(pos1)) == 1) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 0 + 6) {
            let pos1 = pos - 6;
            if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 0 + 10) {
            let pos1 = pos - 10;
            if (diff(fileAt(pos), fileAt(pos1)) == 1 && diff(rankAt(pos), rankAt(pos1)) == 2) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            }
        }
    }

    return moveList;
}

function getBishopMoves(pos, piece, color, boardPos, whiteKingPos, blackKingPos) {
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
                } else {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
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
                } else {
                    let move = new Move(piece, pos, pos2, boardPos[pos2], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
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
                } else {
                    let move = new Move(piece, pos, pos3, boardPos[pos3], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
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
                } else {
                    let move = new Move(piece, pos, pos4, boardPos[pos4], false, null, false, null, false, null);
                    if (isMoveValid(move, whiteKingPos, blackKingPos, boardPos)) moveList.push(move);
                }
            } else {
                break;
            }
        }
    }

    return moveList;
}

function getRookMoves(pos, piece, color, boardPos, WKPos, BKPos) {
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
            } else {
                let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
            } else {
                let move = new Move(piece, pos, pos2, boardPos[pos2], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
            } else {
                let move = new Move(piece, pos, pos3, boardPos[pos3], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
            } else {
                let move = new Move(piece, pos, pos4, boardPos[pos4], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
            }
        }
    }

    return moveList;
}

function getQueenMoves(pos, piece, color, boardPos, WKPos, BKPos) {
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
                } else {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
                } else {
                    let move = new Move(piece, pos, pos2, boardPos[pos2], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
                } else {
                    let move = new Move(piece, pos, pos3, boardPos[pos3], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
                } else {
                    let move = new Move(piece, pos, pos4, boardPos[pos4], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
            } else {
                let move = new Move(piece, pos, pos5, boardPos[pos5], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
            } else {
                let move = new Move(piece, pos, pos6, boardPos[pos6], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
            } else {
                let move = new Move(piece, pos, pos7, boardPos[pos7], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
            } else {
                let move = new Move(piece, pos, pos8, boardPos[pos8], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
            }
        }
    }
    return moveList;
}

function getKingMoves(pos, piece, color, boardPos, WKPos, BKPos) {
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
            } else {
                let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
            }
        }
        if (pos >= 8) {
            let pos1 = pos - 8;
            if (boardPos[pos1].type != None) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            } else {
                let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
            }
        }
        if (diff(fileAt(pos), fileAt(pos - 1)) == 0) {
            let pos1 = pos - 1;
            if (boardPos[pos1].type != None) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            } else {
                let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
            }
        }
        if (diff(fileAt(pos), fileAt(pos + 1)) == 0) {
            let pos1 = pos + 1;
            if (boardPos[pos1].type != None) {
                if (boardPos[pos1].color != piece.color) {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            } else {
                let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
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
                } else {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos <= 54) {
            if (diff(fileAt(pos), fileAt(pos + 9)) == 1) {
                let pos1 = pos + 9;
                if (boardPos[pos1].type != None) {
                    if (boardPos[pos1].color != piece.color) {
                        let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                } else {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 7) {
            if (diff(fileAt(pos), fileAt(pos - 7)) == 1) {
                let pos1 = pos - 7;
                if (boardPos[pos1].type != None) {
                    if (boardPos[pos1].color != piece.color) {
                        let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                } else {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos >= 9) {
            if (diff(fileAt(pos), fileAt(pos - 9)) == 1) {
                let pos1 = pos - 9;
                if (boardPos[pos1].type != None) {
                    if (boardPos[pos1].color != piece.color) {
                        let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                        if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                } else {
                    let move = new Move(piece, pos, pos1, boardPos[pos1], false, null, false, null, false, null);
                    if (isMoveValid(move, WKPos, BKPos, boardPos)) moveList.push(move);
                }
            }
        }
        if (pos == 4 && piece.color == White) {
            if (boardPos[0].type == Rook && boardPos[0].color == White) {
                if (boardPos[1].type == None && boardPos[2].type == None && boardPos[3].type == None) {
                    if (!boardPos[0].isMoved && !boardPos[pos].isMoved) {
                        let move = new Move(piece, pos, 2, new Piece(None, None), true, "l", false, null, false, null);
                        if (isMoveValidForCastle(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
            if (boardPos[7].type == Rook && boardPos[7].color == White) {
                if (boardPos[5].type == None && boardPos[6].type == None) {
                    if (!boardPos[7].isMoved && !boardPos[pos].isMoved) {
                        let move = new Move(piece, pos, 6, new Piece(None, None), true, "s", false, null, false, null);
                        if (isMoveValidForCastle(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
        }
        if (pos == 60 && piece.color == Black) {
            if (boardPos[56].type == Rook && boardPos[56].color == Black) {
                if (boardPos[57].type == None && boardPos[58].type == None && boardPos[59].type == None) {
                    if (!boardPos[56].isMoved && !boardPos[pos].isMoved) {
                        let move = new Move(piece, pos, 58, new Piece(None, None), true, "l", false, null, false, null);
                        if (isMoveValidForCastle(move, WKPos, BKPos, boardPos)) moveList.push(move);
                    }
                }
            }
            if (boardPos[63].type == Rook && boardPos[63].color == Black) {
                if (boardPos[61].type == None && boardPos[62].type == None) {
                    if (!boardPos[63].isMoved && !boardPos[pos].isMoved) {
                        let move = new Move(piece, pos, 62, new Piece(None, None), true, "s", false, null, false, null);
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
    if (piece.type == Pawn) {
        moveList = moveList.concat(getPawnMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos, lastMove));
    } else if (piece.type == Bishop) {
        moveList = moveList.concat(getBishopMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos));
    } else if (piece.type == Rook) {
        moveList = moveList.concat(getRookMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos));
    } else if (piece.type == Queen) {
        moveList = moveList.concat(getQueenMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos));
    } else if (piece.type == King) {
        moveList = moveList.concat(getKingMoves(pos, piece, color, boardPosition, WhiteKingPos, BlackKingPos));
    } else if (piece.type == Knight) {
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
        if (boardPosition[i].color == White && boardPosition[i].type != None) {
            whitePieces.push({ type: boardPosition[i].type, sq: i });
        } else if (boardPosition[i].color == Black && boardPosition[i].type != None) {
            blackPieces.push({ type: boardPosition[i].type, sq: i });
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

async function movePiece(move) {
    if (gameOver) return;
    if (!move.isCastle && !move.isPromoted && !move.isEnp) {
        boardPosition[move.pos] = new Piece(None, None);
        boardPosition[move.posTo] = move.piece;
    } else if (move.isEnp) {
        boardPosition[move.pos] = new Piece(None, None);
        boardPosition[move.posTo] = move.piece;
        boardPosition[move.enpTo] = new Piece(None, None);
    } else if (move.isCastle) {
        if (move.castleType == "l") {
            boardPosition[move.pos] = new Piece(None, None);
            boardPosition[move.posTo] = move.piece;
            boardPosition[move.posTo + 1] = boardPosition[move.posTo - 2];
            boardPosition[move.posTo - 2] = new Piece(None, None);
        } else if (move.castleType == "s") {
            boardPosition[move.pos] = new Piece(None, None);
            boardPosition[move.posTo] = move.piece;
            boardPosition[move.posTo - 1] = boardPosition[move.posTo + 1];
            boardPosition[move.posTo + 1] = new Piece(None, None);
        }
    } else if (move.isPromoted == true) {
        boardPosition[move.pos] = new Piece(None, None);
        boardPosition[move.posTo] = move.promotedTo;
    }
    if (move.attPiece.type != None) {
        pieceCount--;
    }
    if (whiteToMove) {
        whiteToMove = false;
    } else {
        whiteToMove = true;
    }
    lastMove = move;
    if (move.piece.type == King) {
        if (move.piece.color == Black) {
            BlackKingPos = move.posTo;
        } else {
            WhiteKingPos = move.posTo;
        }
    }
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
    updateEvalBar();
    await sleep(10);

    // Half-move clock: reset on any pawn move or capture, else increment
    if (move.piece.type === Pawn || move.attPiece.type !== None || move.isEnp) {
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

    // Checkmate / stalemate: check if the side now to move has any legal moves
    var legalMoves = getAllMoves(whiteToMove, boardPosition, lastMove, WhiteKingPos, BlackKingPos);
    if (legalMoves.length === 0) {
        var attackingColor = whiteToMove ? Black : White;
        var kingPos = whiteToMove ? WhiteKingPos : BlackKingPos;
        var attPos = getAttackedPosition(boardPosition, attackingColor);
        if (isChecked(kingPos, attPos)) {
            showGameOver("Checkmate — " + (whiteToMove ? "Black" : "White") + " wins!");
        } else {
            showGameOver("Stalemate — Draw");
        }
        return;
    }

    moveCntr++;
    if (playAsW) {
        if (!whiteToMove) {
            movePiece(playAi2());
        }
    }
    if (playAsB) {
        if (whiteToMove) {
            movePiece(playAi2());
        }
    }
    removeEventListener();
}

function showedMoveClicked(e) {
    if (gameOver) return;
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
                        move.promotedTo = new Piece(White, Queen);
                        movePiece(move);
                    }
                });
                let btnKnight = document.createElement("div");
                btnKnight.classList.add("WhiteKnightMenu");
                btnKnight.style.width = "75px";
                btnKnight.style.height = "75px";
                btnKnight.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = new Piece(White, Knight);
                        movePiece(move);
                    }
                });
                let btnBishop = document.createElement("div");
                btnBishop.classList.add("WhiteBishopMenu");
                btnBishop.style.width = "75px";
                btnBishop.style.height = "75px";
                btnBishop.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = new Piece(White, Bishop);
                        movePiece(move);
                    }
                });
                let btnRook = document.createElement("div");
                btnRook.classList.add("WhiteRookMenu");
                btnRook.style.width = "75px";
                btnRook.style.height = "75px";
                btnRook.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = new Piece(White, Rook);
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
                        move.promotedTo = new Piece(Black, Queen);
                        movePiece(move);
                    }
                });
                let btnKnight = document.createElement("div");
                btnKnight.classList.add("BlackKnightMenu");
                btnKnight.style.width = "75px";
                btnKnight.style.height = "75px";
                btnKnight.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = new Piece(Black, Knight);
                        movePiece(move);
                    }
                });
                let btnBishop = document.createElement("div");
                btnBishop.classList.add("BlackBishopMenu");
                btnBishop.style.width = "75px";
                btnBishop.style.height = "75px";
                btnBishop.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = new Piece(Black, Bishop);
                        movePiece(move);
                    }
                });
                let btnRook = document.createElement("div");
                btnRook.classList.add("BlackRookMenu");
                btnRook.style.width = "75px";
                btnRook.style.height = "75px";
                btnRook.addEventListener("mousedown", function (e) {
                    if (e.button == 0) {
                        move.promotedTo = new Piece(Black, Rook);
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
        } else if (move.attPiece.type == None) {
            pos.classList.add("moveList");
        } else {
            pos.classList.add("moveListCapture");
        }
        pos.setAttribute("moveIndex", moveIndex);
        pos.addEventListener("mousedown", showedMoveClicked);
        moveIndex++;
    });
}

function showMove() {
    for (let i = 0; i < 64; i++) {
        let pcs = document.getElementById(i);
        pcs.addEventListener("mousedown", function (e) {
            if (gameOver) return;
            if (e.button == 0) {
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
                        let piece = new Piece(pieceColor, pieceType);
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
    let pos = 0;
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

    boardPos.forEach((piece) => {
        if (piece.type == Pawn) {
            moveList = moveList.concat(getPawnMoves(pos, piece, color, boardPos, WKPos, BKPos, lm));
        } else if (piece.type == King) {
            moveList = moveList.concat(getKingMoves(pos, piece, color, boardPos, WKPos, BKPos));
        } else if (piece.type == Queen) {
            moveList = moveList.concat(getQueenMoves(pos, piece, color, boardPos, WKPos, BKPos));
        } else if (piece.type == Rook) {
            moveList = moveList.concat(getRookMoves(pos, piece, color, boardPos, WKPos, BKPos));
        } else if (piece.type == Knight) {
            moveList = moveList.concat(getKnightMoves(pos, piece, color, boardPos, WKPos, BKPos));
        } else if (piece.type == Bishop) {
            moveList = moveList.concat(getBishopMoves(pos, piece, color, boardPos, WKPos, BKPos));
        }
        pos++;
    });

    return moveList;
}

function getEval() {
    let evalWhite = 0;
    let evalBlack = 0;
    for (let i = 0; i < 64; i++) {
        if (boardPosition[i].color == Black) {
            if (boardPosition[i].type == King) {
                if (pieceCount >= 6) {
                    evalBlack += kingMapMiddle[i] / 10;
                } else {
                    evalBlack += kingMapEnd[i] / 10;
                }
            } else if (boardPosition[i].type == Queen) {
                evalBlack += 900;
                evalBlack += queenMap[i] / 10;
            } else if (boardPosition[i].type == Rook) {
                evalBlack += 500;
                evalBlack += rookMap[i] / 10;
            } else if (boardPosition[i].type == Knight) {
                evalBlack += 300;
                evalBlack += knightMap[i] / 10;
            } else if (boardPosition[i].type == Bishop) {
                evalBlack += 300;
                evalBlack += bishopMap[i] / 10;
            } else if (boardPosition[i].type == Pawn) {
                evalBlack += 100;
                evalBlack += pawnMap[i] / 10;
            }
        } else {
            if (boardPosition[i].type == King) {
                if (pieceCount >= 6) {
                    evalWhite += kingMapMiddle[i] / 10;
                } else {
                    evalWhite += kingMapEnd[i] / 10;
                }
            } else if (boardPosition[i].type == Queen) {
                evalWhite += 900;
                evalWhite += queenMap[i] / 10;
            } else if (boardPosition[i].type == Rook) {
                evalWhite += 500;
                evalWhite += rookMap[i] / 10;
            } else if (boardPosition[i].type == Knight) {
                evalWhite += 300;
                evalWhite += knightMap[i] / 10;
            } else if (boardPosition[i].type == Bishop) {
                evalWhite += 300;
                evalWhite += bishopMap[i] / 10;
            } else if (boardPosition[i].type == Pawn) {
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
}

function playAsBlack() {
    let move = playAi2();
    movePiece(move);
    playAsB = true;
}

// window.onload(function () {
// });

createEvalBar();
createBoard();
createFlipButton();
createSearchInfoLabel();
applyBoardOrientation();
updateBoardLabels();
generatePieces(defaultFEN);
// generatePieces("r1b1kbr1/ppqnp2B/5p1n/2pPp1p1/8/2N1BN2/PPP2PPP/R2Q1RK1 w q - 0 1");
// generatePieces("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w");
// generatePieces("8/8/8/4Q3/8/8/8/8 w");
// generatePieces("r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b");
// whiteToMove = false;
// generatePieces("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w");
// generatePieces("r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w");
// generatePieces("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w - - 0 1");
showPiece(boardPosition);
// getAllMoves();
showMove();

// Seed position history and the eval bar's initial reading.
// Runs after ai.js is loaded so computeHash/Evaluate are available.
window.addEventListener("load", function () {
    positionHistory.set(computeHash(boardPosition, whiteToMove), 1);
    updateEvalBar();
});
