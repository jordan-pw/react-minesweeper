import { useState } from 'react';
import './Minesweeper.css';

// Represents an individual square in the Minesweeper grid
function Square({ x, y, value, onMouseDown }) {

    // Determine the appropriate CSS class for the square
    const squareClass = value.revealed ? "square revealed" : "square";

     // Determine the display value for the square based on its state
    const squareDisplay = () => {
        if (value.revealed === true) {
            if (value.mine === true) {
                return "💣";
            }
            return value.touchingMines > 0 ? value.touchingMines : " ";
        }
        else if (value.flag == true) {
            return "🚩";
        }
        else {
            return " ";
        }
    }

    // Render the square component
    return (
        <button onMouseDown={(e) => onMouseDown(x, y, e.nativeEvent.button)} onContextMenu={(e) => e.preventDefault()} className={squareClass}>
          {squareDisplay()}
        </button>
      );
}

// Represents the Minesweeper game board
function Board({ squares, onClick }) {

    // Generate the game board from the squares array
    const gameboard = squares.map((row, rowIdx) => {
        return (
            <div key={rowIdx} className="board-row">
                {row.map((square, colIdx) => 
                    <Square 
                        key={(rowIdx * row.length) + colIdx} 
                        x={colIdx} 
                        y={rowIdx} 
                        value={square} 
                        onMouseDown={onClick}
                    />
                )}
            </div>
        )
    })

    // Render the game board
    return (
        <div className="board">
            {gameboard}
        </div>
    );
}

// Main Minesweeper component
export default function Minesweeper() {

    // Game settings state
    const [width, setWidth] = useState(9);
    const [height, setHeight] = useState(9);
    const [numMines, setNumMines] = useState(3);

    // Move state
    const [move, setMove] = useState(0)

    // Minesweeper grid state
    const [squares, setSquares] = useState(
        Array(width).fill(
            Array(height).fill({mine: false, revealed: false, flag: false, touchingMines: 0})
        )
    );

    // Game state
    const [winState, setWinState] = useState(false);
    const [loseState, setLoseState] = useState(false);

    // const numFlagged = squares.flat().reduce((p, c) =>
    //     p.push(c.filter(square => square.flag == true))
    // );

    // Fills the minefield with mines
    function fillMinefield(clickedX, clickedY) {
        // Create a new copy of the squares state
        const nextSquares = squares.map(row => [...row]);

        let minePosX = 0;
        let minePosY = 0;
        // Randomly place mines in the grid
        for (let i = 0; i < numMines; i++) {

            // Generate random positions until a non-clicked position is found
            do {
                minePosX = Math.floor(Math.random() * width);
                minePosY = Math.floor(Math.random() * height);
            } while (minePosX === clickedX && minePosY === clickedY);

            // Set the mine flag for the selected square
            nextSquares[minePosY][minePosX].mine = true;
        }

        // Calculate the number of mines touching each
        for (let i = 0; i < nextSquares.length; i++) {
            for (let j = 0; j < nextSquares[i].length; j++) {
                nextSquares[i][j].touchingMines = checkNeighborSquares(nextSquares, j, i);
            }
        }

        // Perform flood fill to reveal empty squares
        floodFill(nextSquares, clickedX, clickedY);

        // Update the move and squares state
        setMove(move + 1);
        setSquares(nextSquares);
    }

    // Handles square clicks
    function handleSquareClick(clickedX, clickedY, button) {
        // Create a new copy of the squares state
        const nextSquares = squares.map(row => [...row]);

        if (button === 0) {
            // Left-clicked on a square
            if (nextSquares[clickedY][clickedX].mine){
                // Game over, reveal all squares
                for (let row of nextSquares) {
                    for (let square of row) {
                        square.revealed = true;
                    }
                }
                setLoseState(true);
            }
            else{
                // Perform flood fill to reveal empty squares
                floodFill(nextSquares, clickedX, clickedY);
            }
        }
        else if (button === 2) {
            // Right-clicked on a square, toggle flag
            if (!nextSquares[clickedY][clickedX].revealed) {
                nextSquares[clickedY][clickedX].flag = !nextSquares[clickedY][clickedX].flag;
            }
        }

        // Update the move and squares state
        setMove(move + 1);
        setSquares(nextSquares);
        setWinState(checkWin(nextSquares));
    }

    // Render the Minesweeper component
    return (
        <div className='minesweeper'>
            <div className='settings'>
                <p>{numMines}</p>
                <button 
                    onClick={() => {
                        setSquares(Array(Number(width)).fill(
                            Array(Number(height)).fill({mine: false, revealed: false, flag: false, touchingMines: 0})
                        ));
                        setMove(0);
                    }
                }>
                Play
                </button>
                <ul className='settings-dropdown'>
                    <li>
                        <label>Width: </label>
                        <input type='number' value={width} onChange={e => setWidth(e.target.value)}/>
                    </li>
                    <li>
                        <label>Height: </label>
                        <input type='number' value={height} onChange={e => setHeight(e.target.value)} />
                    </li>
                    <li>
                        <label>Mines: </label>
                        <input type='number' value={numMines} onChange={e => setNumMines(e.target.value)} />
                    </li>
                </ul>
            </div>
            {/* Game board */}
            <div className='game'>
                {(move === 0)
                    ? (<Board squares={squares} onClick={fillMinefield}/>) // Initial board without revealed squares
                    : (<Board squares={squares} onClick={handleSquareClick}/>) // Board after the first move with revealed squares
                }               
            </div>
        </div>
    );
}

// Performs flood fill to reveal empty squares
function floodFill(squares, x, y) {
    // Check if the square is fillable
    if (!isFillable(squares, x, y)) return;

    // Reveal the square
    squares[y][x].revealed = true;
    squares[y][x].flag = false;

    // Recursive flood fill on neighbor squares if not touching nay mines
    if (squares[y][x].touchingMines == 0) {
        floodFill(squares, x+1, y);
        floodFill(squares, x-1, y);
        floodFill(squares, x, y-1);
        floodFill(squares, x, y+1);
    }
}

function isFillable(squares, x, y) {
    // Check if the coordinates are within the grid bounds
    if (x < 0 || x >= squares[0].length || y < 0 || y >= squares.length) {
        return false;
    }

    if (!squares[y][x]) {return false};
    if (squares[y][x].mine) {return false};
    if (squares[y][x].revealed) {return false};

    return true;
}

// Checks the number of mines touching a square
function checkNeighborSquares(squares, x, y) {
    let total = 0;

    // Define the neighboring squares' coordinates
    const neighbors = [
        [-1, -1], [0, -1], [1, -1],
        [-1,  0],          [1,  0],
        [-1,  1], [0,  1], [1,  1]
    ];
    
    // Count the number of mines in the neighboring squares
    for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;

        // Check if the neighboring square is within the grid bounds
        if (nx >= 0 && nx < squares[0].length && ny >= 0 && ny < squares.length) {
            if (squares[ny][nx].mine) {
                total++;
            }
        }
    }

    return total;
}

// Checks if the game has been won
function checkWin(checkSquares) {

    return !checkSquares.some(row =>
            row.some(square => (square.mine && !square.flag) || (!square.mine && square.flag))
    );
}