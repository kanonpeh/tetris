document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('tetris');
    canvas.width = 300;
    canvas.height = 500;
    const context = canvas.getContext('2d');
    context.scale(25, 25);

    const colors = [
        null,
        '#FF0D72', // T
        '#0DC2FF', // O
        '#0DFF72', // L
        '#F538FF', // J
        '#FF8E0D', // I
        '#FFE138', // S
        '#3877FF'  // Z
    ];

    // スコア表示をcanvasの上に
    const scoreDiv = document.createElement('div');
    scoreDiv.innerHTML = 'Score: <span id="score">0</span>';
    canvas.parentNode.insertBefore(scoreDiv, canvas);

    function arenaSweep() {
        let lines = 0;
        for (let y = arena.length - 1; y >= 0; --y) {
            if (arena[y].every(cell => cell !== 0)) {
                const row = arena.splice(y, 1)[0].fill(0);
                arena.unshift(row);
                ++lines;
                ++y;
            }
        }
        // テトリス基本スコア方式
        if (lines === 1) player.score += 40;
        else if (lines === 2) player.score += 100;
        else if (lines === 3) player.score += 300;
        else if (lines === 4) player.score += 1200;
    }

    function collide(arena, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] &&
                     arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }

    function createPiece(type) {
        if (type === 'T') {
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        } else if (type === 'O') {
            return [
                [2, 2],
                [2, 2],
            ];
        } else if (type === 'L') {
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ];
        } else if (type === 'J') {
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0],
            ];
        } else if (type === 'I') {
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ];
        } else if (type === 'S') {
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        } else if (type === 'Z') {
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ];
        }
    }

    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = colors[value];
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    function draw() {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawMatrix(arena, {x:0, y:0});
        drawMatrix(player.matrix, player.pos);
    }

    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
        }
    }

    let isGameOver = false;

    function playerReset() {
        const pieces = 'TJLOSZI';
        player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
        if (player.pos.y < 0) player.pos.y = 0;
        if (collide(arena, player)) {
            arena.forEach(row => row.fill(0));
            player.score = 0;
            isGameOver = true;
            showGameOver();
        }
    }

    function showGameOver() {
        const overDiv = document.createElement('div');
        overDiv.textContent = 'ゲームオーバー';
        overDiv.style.fontSize = '2em';
        overDiv.style.color = 'red';
        overDiv.style.margin = '20px';
        scoreDiv.parentNode.insertBefore(overDiv, scoreDiv.nextSibling);
    }

    function updateScore() {
        document.getElementById('score').innerText = player.score;
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    function playerRotate(dir) {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    let arena = createMatrix(12, 20);
    let player = {
        pos: {x:0, y:0},
        matrix: null,
        score: 0
    };

    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;

    function update(time = 0) {
        if (isGameOver) return;
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        draw();
        requestAnimationFrame(update);
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') {
            playerMove(-1);
        } else if (event.key === 'ArrowRight') {
            playerMove(1);
        } else if (event.key === 'ArrowDown') {
            playerDrop();
        } else if (event.key === 'ArrowUp') {
            playerRotate(1);
        }
    });

    playerReset();
    updateScore();
    update();
});
