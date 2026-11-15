let tilesDisplay = [];

let tiles = [];
let enpassantPos = -1;
let whiteCastleState = 3; // 0 = none, 1 = king side, 2 = queen side, 3 = both
let blackCastleState = 3;
let turn = "w";
let halfMovesClock = 0;
let fullMoves = 1;

let legalMoves = [];
let currentlyDragging = -1;
let isMouseDown = false;
const mouse = {
    x: 0,
    y: 0
};

window.addEventListener("pointermove", (e) => {
    mouse.x = e.pageX;
    mouse.y = e.pageY;
});

function getTileFromMouse() {
    const board = document.querySelector(".board");
    if (!board) {
        return -1;
    }

    const rect = board.getBoundingClientRect();

    const x = mouse.x - rect.left - window.scrollX;
    const y = mouse.y - rect.top - window.scrollY;

    if (
        x < 0 ||
        y < 0 ||
        x >= rect.width ||
        y >= rect.height
    ) {
        return -1;
    }

    const squareSize = rect.width / 8;

    const col = Math.floor(x / squareSize);
    const rowFromTop = Math.floor(y / squareSize);
    const row = 7 - rowFromTop;

    return row * 8 + col;

}

function isBlackPiece(piece) {
    return piece !== "" && piece.includes("B");
}

function isWhitePiece(piece) {
    return piece !== "" && !piece.includes("B");
}

function isSameColor(pieceA, pieceB) {
    return isBlackPiece(pieceA) === isBlackPiece(pieceB);
}

function isInsideBoard(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function createMove(start, end, options = {}) {
    return {
        start,
        end,
        isEnPassant: options.isEnPassant ?? false,
        isDoublePawnMove: options.isDoublePawnMove ?? false,
        capturedPawnPos: options.capturedPawnPos ?? -1,
        promoteTo: options.promoteTo ?? "",
        castling: options.castling ?? false
    };
}

function doMove(move) {
    const movingPiece = tiles[move.start];
    if (!movingPiece) {
        return;
    }

    const capturedPiece = tiles[move.end];

    const oldEnPassantPos = enpassantPos;
    enpassantPos = -1;
    if (move.isEnPassant) {
        const capturedPawnPos = move.capturedPawnPos;

        if (
            capturedPawnPos >= 0 &&
            capturedPawnPos < 64 &&
            tiles[capturedPawnPos] !== ""
        ) {
            tiles[capturedPawnPos] = "";
        }
    }

    if (move.castling) {
        let direction = (move.end - move.start) / 2;
        if (direction == 1) {
            tiles[move.start + direction] = tiles[move.end + direction];
            tiles[move.end + direction] = "";
        } else {
            tiles[move.start + direction] = tiles[move.end + direction * 2];
            tiles[move.end + direction * 2] = "";
        }
        if (turn == "w") whiteCastleState = 0; else blackCastleState = 0;
    }

    tiles[move.end] = movingPiece;
    tiles[move.start] = "";

    if (
        movingPiece.startsWith("pawn") &&
        Math.abs(move.end - move.start) === 16
    ) {
        enpassantPos = (move.start + move.end) / 2;
    }

    if (
        movingPiece.startsWith("pawn") ||
        capturedPiece !== "" ||
        move.isEnPassant
    ) {
        halfMovesClock = 0;
    } else {
        halfMovesClock++;
    }

    if (move.promoteTo != "") {
        tiles[move.end] = move.promoteTo;
    }

    //white
    if (whiteCastleState == 3) //both
    {
        if (tiles[0] !== "rook")
            whiteCastleState = 1;
        else if (tiles[7] !== "rook")
            whiteCastleState = 2;
    }
    if (whiteCastleState == 1) //kingside
    {
        if (tiles[7] !== "rook")
            whiteCastleState = 0;
    }
    if (whiteCastleState == 2) //queenside
    {
        if (tiles[0] !== "rook")
            whiteCastleState = 0;
    }

    if (whiteCastleState !== 0) {
        if (tiles[4] !== "king")
            whiteCastleState = 0;
    }

    //black
    if (blackCastleState == 3) //both
    {
        if (tiles[56] !== "rookB")
            blackCastleState = 1;
        else if (tiles[63] !== "rookB")
            blackCastleState = 2;
    }
    if (blackCastleState == 1) //kingside
    {
        if (tiles[63] !== "rookB")
            blackCastleState = 0;
    }
    if (blackCastleState == 2) //queenside
    {
        if (tiles[56] !== "rookB")
            blackCastleState = 0;
    }

    if (blackCastleState !== 0) {
        if (tiles[60] !== "kingB")
            blackCastleState = 0;
    }

    if (turn === "b") {
        turn = "w";
        fullMoves++;
    } else {
        turn = "b";
    }
}

window.addEventListener("pointerup", () => {
    isMouseDown = false;
    if (currentlyDragging === -1) {
        return;
    }

    const start = currentlyDragging;
    const end = getTileFromMouse();

    if (end !== -1) {
        const move = legalMoves.find(
            (candidate) =>
                candidate.start === start &&
                candidate.end === end
        );

        if (move) {
            doMove(move);
            legalMoves = GetLegalMoves();
        }
    }

    updateDisplay();

    currentlyDragging = -1;

});

function doDrag() {
    if (!isMouseDown || currentlyDragging === -1) {
        return;
    }
    const tile = tilesDisplay[currentlyDragging];

    if (tile && tile.children.length > 0) {
        const piece = tile.children[0];

        piece.style.position = "absolute";
        piece.style.left = `${mouse.x}px`;
        piece.style.top = `${mouse.y}px`;
        piece.style.transform = "translate(-50%, -50%)";
    }

    requestAnimationFrame(doDrag);

}

function startDragging(id) {
    if (tiles[id] === "") {
        return;
    }
    if (!isPieceTurn(tiles[id])) {
        return;
    }

    currentlyDragging = id;
    isMouseDown = true;

    doDrag();

}

function isPieceTurn(piece) {
    if (turn === "w") {
        return isWhitePiece(piece);
    }
    return isBlackPiece(piece);

}

function setDisplayTile(id, type) {
    if (type === "") {
        tilesDisplay[id].innerHTML = "";
    } else {
        tilesDisplay[id].innerHTML = `<div class="piece" id="${type}"></div>`;
    }
}

function setTile(id, type) {
    if (id >= 0 && id < 64) {
        tiles[id] = type;
    }
}

function updateDisplay() {
    for (let i = 0; i < 64; i++) {
        setDisplayTile(i, tiles[i]);
    }
}

function loadFEN(fenCode) {
    const fields = fenCode.trim().split(/\s+/);
    const boardCode = fields[0];
    tiles.fill("");

    let tileID = 56;

    for (const char of boardCode) {
        if (char === "/") {
            tileID -= 16;
            continue;
        }

        if (char >= "1" && char <= "8") {
            tileID += Number(char);
            continue;
        }

        switch (char) {
            case "r":
                setTile(tileID, "rookB");
                break;
            case "n":
                setTile(tileID, "knightB");
                break;
            case "b":
                setTile(tileID, "bishopB");
                break;
            case "q":
                setTile(tileID, "queenB");
                break;
            case "k":
                setTile(tileID, "kingB");
                break;
            case "p":
                setTile(tileID, "pawnB");
                break;
            case "R":
                setTile(tileID, "rook");
                break;
            case "N":
                setTile(tileID, "knight");
                break;
            case "B":
                setTile(tileID, "bishop");
                break;
            case "Q":
                setTile(tileID, "queen");
                break;
            case "K":
                setTile(tileID, "king");
                break;
            case "P":
                setTile(tileID, "pawn");
                break;
        }

        tileID++;
    }

    turn = fields[1] ?? "w";

    const castling = fields[2] ?? "-";

    whiteCastleState = 0;

    if (castling.includes("K")) {
        whiteCastleState += 1;
    }

    if (castling.includes("Q")) {
        whiteCastleState += 2;
    }

    blackCastleState = 0;

    if (castling.includes("k")) {
        blackCastleState += 1;
    }

    if (castling.includes("q")) {
        blackCastleState += 2;
    }

    const fenEnPassant = fields[3] ?? "-";

    if (fenEnPassant === "-") {
        enpassantPos = -1;
    } else {
        const file = fenEnPassant.charCodeAt(0) - "a".charCodeAt(0);
        const rank = Number(fenEnPassant[1]) - 1;

        if (
            file >= 0 &&
            file < 8 &&
            rank >= 0 &&
            rank < 8
        ) {
            enpassantPos = rank * 8 + file;
        } else {
            enpassantPos = -1;
        }
    }

    halfMovesClock = Number(fields[4] ?? 0);
    fullMoves = Number(fields[5] ?? 1);

}

function generateFEN() {
    let fen = "";
    let emptySpaces = 0;
    for (let ia = 0; ia < 64; ia++) {
        let i = 56 + (ia % 8) - Math.floor(ia / 8) * 8;
        if (tiles[i] == "")
            emptySpaces++;
        else {
            if (emptySpaces != 0)
                fen += emptySpaces;
            emptySpaces = 0;
            switch (tiles[i]) {
                case "pawn":
                    fen += "P";
                    break;
                case "rook":
                    fen += "R";
                    break;
                case "knight":
                    fen += "N";
                    break;
                case "bishop":
                    fen += "B";
                    break;
                case "queen":
                    fen += "Q";
                    break;
                case "king":
                    fen += "K";
                    break;
                case "pawnB":
                    fen += "p";
                    break;
                case "rookB":
                    fen += "r";
                    break;
                case "knightB":
                    fen += "n";
                    break;
                case "bishopB":
                    fen += "b";
                    break;
                case "queenB":
                    fen += "q";
                    break;
                case "kingB":
                    fen += "k";
                    break;
            }
        }
        if (i % 8 == 7 && i / 8 > 1) {
            if (emptySpaces != 0)
                fen += emptySpaces;
            emptySpaces = 0;
            fen += "/";
        }
    }
    const castling =
        (whiteCastleState & 1 ? "K" : "") +
        (whiteCastleState & 2 ? "Q" : "") +
        (blackCastleState & 1 ? "k" : "") +
        (blackCastleState & 2 ? "q" : "");

    return [
        fen,
        turn,
        castling || "-",
        enpassantPos === -1 ? "-" : indexToSquare(enpassantPos),
        halfMovesClock,
        fullMoves
    ].join(" ");
}

function indexToSquare(index) 
{ 
    const file = String.fromCharCode("a".charCodeAt(0) + (index % 8));
    const rank = Math.floor(index / 8) + 1; 
    return file + rank; 
}

const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 2],
    [-1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1]
];

function GetSlidingMoves(startLocation, directionListStart, directionListEnd, maxSteps, attacking) {
    const moves = [];
    const startRow = Math.floor(startLocation / 8);
    const startCol = startLocation % 8;
    const movingPiece = tiles[startLocation];

    for (
        let directionIndex = directionListStart;
        directionIndex <= directionListEnd;
        directionIndex++
    ) {
        const [rowChange, colChange] = directions[directionIndex];

        for (let step = 1; step <= maxSteps; step++) {
            const row = startRow + step * rowChange;
            const col = startCol + step * colChange;

            if (!isInsideBoard(row, col)) {
                break;
            }

            const endLocation = row * 8 + col;
            const targetPiece = tiles[endLocation];

            if (targetPiece !== "") {
                if (isSameColor(movingPiece, targetPiece)) {
                    break;
                }

                moves.push(createMove(startLocation, endLocation));
                break;
            }
            if (!attacking)
                moves.push(createMove(startLocation, endLocation));
        }
    }

    return moves;

}

function GetPawnMoves(piece, attacking) {
    const moves = [];
    const movingPiece = tiles[piece];
    const isBlack = isBlackPiece(movingPiece);

    const startRow = Math.floor(piece / 8);
    const startCol = piece % 8;

    const direction = isBlack ? -1 : 1;
    const oneStep = piece + direction * 8;
    const twoSteps = piece + direction * 16;

    if (
        oneStep >= 0 &&
        oneStep < 64 &&
        tiles[oneStep] === ""
    ) {
        let targetRow = startRow + (isBlack ? -1 : 1);
        let promoteTo = "";
        if (targetRow == 0) {
            promoteTo = "queenB";
        }
        if (targetRow == 7) {
            promoteTo = "queen";
        }
        if (!attacking)
            moves.push(createMove(piece, oneStep, { promoteTo: promoteTo }));

        const homeRow = isBlack ? 6 : 1;

        if (
            startRow === homeRow &&
            tiles[twoSteps] === ""
        ) {
            if (!attacking)
                moves.push(
                    createMove(piece, twoSteps, {
                        isDoublePawnMove: true
                    })
                );
        }
    }

    for (const columnOffset of [-1, 1]) {
        const targetCol = startCol + columnOffset;
        const targetRow = startRow + direction;
        let promoteTo = "";
        if (targetRow == 0) {
            promoteTo = "queenB";
        }
        if (targetRow == 7) {
            promoteTo = "queen";
        }

        if (!isInsideBoard(targetRow, targetCol)) {
            continue;
        }

        const target = targetRow * 8 + targetCol;
        const targetPiece = tiles[target];

        if (
            targetPiece !== "" &&
            !isSameColor(movingPiece, targetPiece)
        ) {
            moves.push(createMove(piece, target, {
                promoteTo: promoteTo
            }));
        }

        if (target === enpassantPos && targetPiece === "") {
            const capturedPawnPos = target - direction * 8;
            const capturedPawn = tiles[capturedPawnPos];

            if (
                capturedPawn !== "" &&
                capturedPawn.startsWith("pawn") &&
                !isSameColor(movingPiece, capturedPawn)
            ) {
                moves.push(
                    createMove(piece, target, {
                        isEnPassant: true,
                        capturedPawnPos,
                        promoteTo: promoteTo
                    })
                );
            }
        }
    }

    return moves;

}

function GetMovesForPiece(pieceID, attacking) {
    const moves = [];
    const type = tiles[pieceID].replace("B", "");
    switch (type) {
        case "rook":
            moves.push(...GetSlidingMoves(pieceID, 0, 3, 7, attacking));
            break;

        case "bishop":
            moves.push(...GetSlidingMoves(pieceID, 4, 7, 7, attacking));
            break;

        case "king":
            moves.push(...GetSlidingMoves(pieceID, 0, 7, 1, attacking));
            break;

        case "queen":
            moves.push(...GetSlidingMoves(pieceID, 0, 7, 7, attacking));
            break;

        case "knight":
            moves.push(...GetSlidingMoves(pieceID, 8, 15, 1, attacking));
            break;

        case "pawn":
            moves.push(...GetPawnMoves(pieceID, attacking));
            break;
    }

    return moves;

}

function GetPseudoMoves(attacking = false) {
    const moves = [];
    for (let i = 0; i < 64; i++) {
        if (
            tiles[i] !== "" &&
            isPieceTurn(tiles[i])
        ) {
            moves.push(...GetMovesForPiece(i, attacking));
        }
    }

    return moves;
}

function GetLegalMoves() {
    let currenttiles = [...tiles];
    let currentenpassantPos = enpassantPos;
    let currentwhiteCastleState = whiteCastleState;
    let currentblackCastleState = blackCastleState;
    let currentturn = turn;
    let currenthalfMovesClock = halfMovesClock;
    let currentfullMoves = fullMoves;

    const moves = GetPseudoMoves();

    //Check for check
    for (let i = moves.length - 1; i >= 0; i--) {
        doMove(moves[i]);

        const kingPosition = tiles.findIndex(
            piece => piece === (turn == "b" ? "king" : "kingB")
        );

        let attackingMoves = GetPseudoMoves(true);
        const checkmove = attackingMoves.find(
            (candidate) =>
                candidate.end === kingPosition
        );

        if (checkmove) {
            moves.splice(i, 1);
        }

        tiles = [...currenttiles];
        enpassantPos = currentenpassantPos;
        whiteCastleState = currentwhiteCastleState; // 0 = none, 1 = king side, 2 = queen side, 3 = both
        blackCastleState = currentblackCastleState;
        turn = currentturn;
        halfMovesClock = currenthalfMovesClock;
        fullMoves = currentfullMoves;
    }
    const kingPosition = tiles.findIndex(
        piece => piece === (turn == "w" ? "king" : "kingB")
    );
    if (turn == "w")
        turn = "b";
    else
        turn = "w";
    let attackingMoves = GetPseudoMoves(true);
    if (turn == "w")
        turn = "b";
    else
        turn = "w";
    const checkmove = attackingMoves.find(
        (candidate) =>
            candidate.end === kingPosition
    );

    if (!checkmove) {
        if (turn == "w") {
            if (whiteCastleState == 1 || whiteCastleState == 3) {
               moves.push( createMove(4, 6, {castling: true}));
            }
            if (whiteCastleState == 2 || whiteCastleState == 3) {
                moves.push(createMove(4, 2, {castling: true}));
            }
        } else {
            if (blackCastleState == 1 || blackCastleState == 3) {
                moves.push(createMove(60, 62, {castling: true}));
            }
            if (blackCastleState == 2 || blackCastleState == 3) {
                moves.push(createMove(60, 58, {castling: true}));
            }
        }
    }

    if (moves.length == 0) {
        if (checkmove) //in check?
            alert("checkmate"); //mate
        else
            alert("stalemate"); //stalemate
    }

    return moves;
}

for (let i = 0; i < 64; i++) {
    tilesDisplay[i] = document.getElementById(i);
    tiles[i] = "";
    if (tilesDisplay[i]) {
        tilesDisplay[i].addEventListener("pointerdown", (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            startDragging(i);
        });
    }

}

loadFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
updateDisplay();
legalMoves = GetLegalMoves();