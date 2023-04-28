// program states
let player_id = "";
let turn = "";
let board = [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
];
let timer = null;

// wait for DOM to be ready
window.onload = function () {
    start_game();
}

// everything starts from here
function start_game() {
    // to capture mouse-clicks on board
    add_click_listeners();

    // register our client with server
    register_player();

    // ping server every 3 secs to
    // get latest update 
    timer = setInterval(ping, 3000);    
}

// tears down everything
function end_game() {
    // igmore mouse-clicks on board
    remove_click_listeners();

    // no need to keep pinging server anymore
    clearInterval(timer);
}

// listen to mouse-clicks on board
function add_click_listeners() {
    let list = document.getElementsByClassName("cell");

    for (let i = 0; i < list.length; i++) {
        list[i].addEventListener("click", on_cell_click);
    }
}

// stop listening to mouse-clicks on board
// so that players clicking on their boards
// have no more effect on the game because
// we are running the game (e.g. contacting
// the server to make more moves).
function remove_click_listeners() {
    let list = document.getElementsByClassName("cell");

    for (let i = 0; i < list.length; i++) {
        list[i].removeEventListener("click", on_cell_click);
    }
}

// handle the event when one of our cells
// has been clicked
function on_cell_click(event) {
    let elem = event.currentTarget;

    // the element's id is in form of "row_col"
    parts = elem.id.split("_");

    // can only request to add piece if it's your turn
    if (turn == player_id) {
        // parts[0] is row, parts[1] is col
        request_add_piece(parts[0], parts[1]);
    }    
}

// register ourselves as a player with the server
function register_player() {
    let xhr = new XMLHttpRequest();

    xhr.open("POST", "/Game/RegisterPlayer");
    xhr.setRequestHeader("Content-Type",
        "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {
        if (this.readyState == XMLHttpRequest.DONE) {
            let data = JSON.parse(this.responseText);

            if (data.status == true) {
                player_id = data.player_id;
                update_game_loop(data);
            }
        }
    }

    xhr.send();
}

// get server's permission to add a piece on the board
// only when the server has responsed with a status=true,
// do we add the piece on the board (else, the client's 
// states will be different from the server's).
function request_add_piece(row, col) {
    let xhr = new XMLHttpRequest();

    xhr.open("POST", "/Game/AddPiece");
    xhr.setRequestHeader("Content-Type",
        "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {
        if (this.readyState == XMLHttpRequest.DONE) {
            let data = JSON.parse(this.responseText);

            // if server allows, then add to our board
            if (data.status == true) {
                update_game_loop(data);
            }                
        }
    }

    xhr.send("player=" + player_id + "&row=" + row + "&col=" + col);
}

// ping the server to always get the latest
// states of the two-player game, and to know
// if the other player has made a move and that
// it's now our turn to move.
function ping() {
    let xhr = new XMLHttpRequest();

    xhr.open("POST", "/Game/Ping");

    xhr.onreadystatechange = function () {
        if (this.readyState == XMLHttpRequest.DONE) {
            let data = JSON.parse(this.responseText);
            update_game_loop(data);
        }
    }

    // send AJAX request without any payload
    xhr.send();        
}

// sync client's board with server's
function sync_board(board_as_str) {
    let pieces = board_as_str.split(";");

    for (row = 0; row < 3; row++) {
        for (col = 0; col < 3; col++) {
            let piece = pieces[row * 3 + col];
            board[row][col] = piece;
        }
    }
}

// update our game's states and UI
function update_game_loop(data) {
    sync_board(data.board);
    update_board();

    win_piece = check_win_piece();

    if (!win_piece) {
        turn = data.turn;
        update_move_status();
    }
    else {        
        let winner_id = (win_piece == "X") ? "player1" : "player2";
        update_win_status(winner_id);
        end_game();
    }    
}

// render UI with latest board
function update_board() {
    for (row = 0; row < 3; row++) {
        for (col = 0; col < 3; col++) {
            let elem = document.getElementById(row + "_" + col);

            let piece = board[row][col];

            if (piece == "X") {
                elem.innerHTML = "<img src=/images/X.png />";
            }
            else if (piece == "O") {
                elem.innerHTML = "<img src=/images/O.png />";
            }
        }
    }
}

// display who's turn to move right now
function update_move_status() {
    let elem = document.getElementById("msg");

    let msg = player_id + ": ";

    if (turn == player_id) {
        msg += "please make your move";
    }
    else {
        msg += "please wait for your turn";
    }

    elem.innerHTML = msg;
}

// display the winner
function update_win_status(winner_id) {
    let elem = document.getElementById("msg");

    let msg = player_id + ": ";

    if (winner_id == player_id) {
        msg += "you won!";
    }
    else {
        msg += "you lost!";
    }

    elem.innerHTML = msg;
}

// determine if there is a winning piece
// either 'X' or 'O'
function check_win_piece() {
    for (i = 0; i < 3; i++) {
        // check row-by-row
        if ((board[i][0] == board[i][1]) &&
            (board[i][1] == board[i][2]) &&
            board[i][2] != " ") {
            return board[i][0];
        }
    }

    for (j = 0; j < 3; j++) {
        // check col-by-col
        if ((board[0][j] == board[1][j]) &&
            (board[1][j] == board[2][j]) &&
            board[2][j] != " ") {
            return board[0][j];
        }
    }

    // check diagonal top-left to bottom-right
    if ((board[0][0] == board[1][1]) &&
        (board[1][1] == board[2][2]) &&
        board[2][2] != " ") {
        return board[0][0];
    }

    // check diagonal top-right to bottom-left
    if ((board[0][2] == board[1][1]) &&
        (board[1][1] == board[2][0]) &&
        board[2][0] != " ") {
        return board[0][2];
    }

    // no winner
    return null;
}





















