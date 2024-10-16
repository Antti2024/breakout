function playAudio(audioclip){
    let audio = new Audio(audioclip);
    audio.play()
}

let board;
let boardWidth = 500;
let boardHeight = 500;
let context; 

//players
let playerWidth = 80; //500 for testing, 80 normal
let playerHeight = 10;
let playerVelocityX = 10; //move 10 pixels each time

let player = {
    x : boardWidth/2 - playerWidth/2,
    y : boardHeight - playerHeight - 5,
    width: playerWidth,
    height: playerHeight,
    velocityX : playerVelocityX
}

//ball
let ballWidth = 10;
let ballHeight = 10;
let ballVelocityX = 3; //15 for testing, 3 normal
let ballVelocityY = 2; //10 for testing, 2 normal

let ball = {
    x : boardWidth/2,
    y : boardHeight/2,
    width: ballWidth,
    height: ballHeight,
    velocityX : ballVelocityX,
    velocityY : ballVelocityY
}

//blocks

let blockArray = [];
let blockWidth = 50;
let blockHeight = 10;
let blockColumns = 8; 
let blockRows = 3; //add more as game goes on
let blockMaxRows = 10; //limit how many rows
let blockCount = 0;

//starting block corners top left 
let blockX = 15;
let blockY = 45;

let score = 0;
let gameOver = false;

let lives = 3;
let level = 1; // Määritetään tason laskuri
const MAX_LEVELS = 10; // Määritetään maksimitaso

let obstacleWidth = 50;
let obstacleHeight = 10;
let obstacleVelocityX = 2; // Este liikkuu hitaasti sivulle

let obstacle = {
    x: boardWidth / 2 - obstacleWidth / 2,
    y: boardHeight / 3, // Voit säätää tätä korkeutta
    width: obstacleWidth,
    height: obstacleHeight,
    velocityX: obstacleVelocityX
}
let backgroundMusic; // Muuttuja taustamusiikille

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

     // Käynnistetään taustamusiikki
     backgroundMusic = new Audio("/sound effects/Phillip Gross - Verse.mp3");
     backgroundMusic.loop = true; // Asetetaan musiikki toistamaan jatkuvasti
     backgroundMusic.volume = 0.5; // Voit säätää äänenvoimakkuutta
     backgroundMusic.play(); // Käynnistä taustamusiikki

    //draw initial player
    context.fillStyle="skyblue";
    context.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(update);
    document.addEventListener("keydown", movePlayer);

    //create blocks
    createBlocks();
}

function update() {
    requestAnimationFrame(update);
    //stop drawing
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    // player
    context.fillStyle = "lightgreen";
    context.fillRect(player.x, player.y, player.width, player.height);

    // ball
    context.fillStyle = "white";
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    // Este
    context.fillStyle = "orange";
    obstacle.x += obstacle.velocityX;

    // Jos este osuu reunoihin, vaihda suuntaa
    if (obstacle.x <= 0 || (obstacle.x + obstacle.width >= boardWidth)) {
        obstacle.velocityX *= -1;
    }

    context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    // Pallo kimpoaa esteestä
    if (detectCollision(ball, obstacle)) {
        ball.velocityY *= -1;
        playAudio("/sound effects/hit.wav");
    }

    //bounce the ball off player paddle
    if (topCollision(ball, player) || bottomCollision(ball, player)) {
        ball.velocityY *= -1;   // flip y direction up or down
        playAudio ("/sound effects/hit.wav")
    }
    else if (leftCollision(ball, player) || rightCollision(ball, player)) {
        ball.velocityX *= -1;   // flip x direction left or right
        playAudio ("/sound effects/hit.wav")
    }

    if (ball.y <= 0) { 
        // if ball touches top of canvas
        ball.velocityY *= -1; //reverse direction
        playAudio ("/sound effects/hit.wav")
    }
    else if (ball.x <= 0 || (ball.x + ball.width >= boardWidth)) {
        // if ball touches left or right of canvas
        ball.velocityX *= -1; //reverse direction
        playAudio ("/sound effects/hit.wav")
    }
    else if (ball.y + ball.height >= boardHeight) {
        // Pallo osuu alareunaan, vähennä elämää
            lives -= 1; // vähennä yksi elämä
        if (lives > 0) {
            // Nollaa pallon sijainti ja suunta
            ball.x = boardWidth / 2;
            ball.y = boardHeight / 2;
            ball.velocityX = ballVelocityX;
            ball.velocityY = ballVelocityY;
            playAudio("/sound effects/game over.wav");
        } else {
            // Peli ohi, ei elämiä jäljellä
            context.font = "20px sans-serif";
            context.fillText("Game Over: Press 'Space' to Restart", 80, 400);
            gameOver = true;
            playAudio("/sound effects/game over.wav");
        }
    }

    //blocks
    context.fillStyle = "red";
    for (let i = 0; i < blockArray.length; i++) {
        let block = blockArray[i];
        if (!block.break) {
            if (topCollision(ball, block) || bottomCollision(ball, block)) {
                block.break = true;     // block is broken
                ball.velocityY *= -1;   // flip y direction up or down
                score += 100;
                blockCount -= 1;
                playAudio ("/sound effects/hit.wav")
            }
            else if (leftCollision(ball, block) || rightCollision(ball, block)) {
                block.break = true;     // block is broken
                ball.velocityX *= -1;   // flip x direction left or right
                score += 100;
                blockCount -= 1;
                playAudio ("/sound effects/hit.wav")
            }
            context.fillRect(block.x, block.y, block.width, block.height);
        }
    }

    //next level
    if (blockCount == 0) {
        score += 100 * blockRows * blockColumns; //bonus points :)
        blockRows = Math.min(blockRows + 1, blockMaxRows);
        level++; // Nosta tasoa
        createBlocks();
        resetBall(); // Nollaa pallon sijainti ja nopeus uudelle tasolle
        playAudio("/sound effects/victory.wav");
    
        // Tarkistetaan, onko saavutettu maksimitaso
        if (level > MAX_LEVELS) {
            context.font = "20px sans-serif";
            context.fillText("Voitit kaikki kymmenen tasoa!", 50, 250);
            gameOver = true;
            playAudio("/sound effects/game over.wav");
        }
    }
if (gameOver) {
    backgroundMusic.pause(); // Pysäytä taustamusiikki
    backgroundMusic.currentTime = 0; // Nollaa musiikki alkuun
    return;
}
    //score
    context.font = "20px sans-serif";
    context.fillText(score, 10, 25); // Näytä pisteet
    context.fillText("Lives: " + lives, boardWidth - 100, 25);// Näytä elämät
    context.fillText("Level: " + level, boardWidth - 300, 25); // Näytä taso
}

function outOfBounds(xPosition) {
    return (xPosition < 0 || xPosition + playerWidth > boardWidth);
}

function movePlayer(e) {
    if (gameOver) {
        if (e.code == "Space") {
            resetGame();
            console.log("RESET");
        }
        return;
    }
    if (e.code == "ArrowLeft") {
        // player.x -= player.velocityX;
        let nextplayerX = player.x - player.velocityX;
        if (!outOfBounds(nextplayerX)) {
            player.x = nextplayerX;
        }
    }
    else if (e.code == "ArrowRight") {
        let nextplayerX = player.x + player.velocityX;
        if (!outOfBounds(nextplayerX)) {
            player.x = nextplayerX;
        }
        // player.x += player.velocityX;    
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function topCollision(ball, block) { //a is above b (ball is above block)
    return detectCollision(ball, block) && (ball.y + ball.height) >= block.y;
}

function bottomCollision(ball, block) { //a is above b (ball is below block)
    return detectCollision(ball, block) && (block.y + block.height) >= ball.y;
}

function leftCollision(ball, block) { //a is left of b (ball is left of block)
    return detectCollision(ball, block) && (ball.x + ball.width) >= block.x;
}

function rightCollision(ball, block) { //a is right of b (ball is right of block)
    return detectCollision(ball, block) && (block.x + block.width) >= ball.x;
}

function createBlocks() {
    blockArray = []; //clear blockArray
    for (let c = 0; c < blockColumns; c++) {
        for (let r = 0; r < blockRows; r++) {
            let block = {
                x : blockX + c*blockWidth + c*10, //c*10 space 10 pixels apart columns
                y : blockY + r*blockHeight + r*10, //r*10 space 10 pixels apart rows
                width : blockWidth,
                height : blockHeight,
                break : false
            }
            blockArray.push(block);
        }
    }
    blockCount = blockArray.length;
}
function resetBall() {
    ball.x = boardWidth / 2;
    ball.y = boardHeight / 2;
    ball.velocityX = ballVelocityX;
    ball.velocityY = ballVelocityY;
}

function resetGame() {
    gameOver = false;
    lives = 3; // Palauta elämät kolmeen
    level = 1; // Nollaa taso
    backgroundMusic.play(); // Käynnistä musiikki uudelleen
    player = {
        x : boardWidth/2 - playerWidth/2,
        y : boardHeight - playerHeight - 5,
        width: playerWidth,
        height: playerHeight,
        velocityX : playerVelocityX
    }
    ball = {
        x : boardWidth/2,
        y : boardHeight/2,
        width: ballWidth,
        height: ballHeight,
        velocityX : ballVelocityX,
        velocityY : ballVelocityY
    }
    blockArray = [];
    blockRows = 3;
    score = 0;
    createBlocks();
} 