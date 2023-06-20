import { useState } from 'react';
import './Minesweeper.css';

function Square({ x, y, value, onMouseDown }) {

    const squareClass = value.revealed ? "square revealed" : "square";
    const squareDisplay = () => {
        if (value.revealed == true) {
            if (value.mine == true) {
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

    return (
        <button onMouseDown={(e) => onMouseDown(x, y, e.nativeEvent.button)} onContextMenu={(e) => e.preventDefault()} className={squareClass}>
          {squareDisplay()}
        </button>
      );
}

function Board({ squares, onClick }) {
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

    return (
        <div className="board">
            {gameboard}
        </div>
    );
}

export default function Minesweeper() {

    const [width, setWidth] = useState(9);
    const [height, setHeight] = useState(9);
    const [numMines, setNumMines] = useState(3);

    const [move, setMove] = useState(0)
    const [squares, setSquares] = useState(
        Array(width).fill(
            Array(height).fill({mine: false, revealed: false, flag: false, touchingMines: 0})
        )
    );

    const [winState, setWinState] = useState(false);
    const [loseState, setLoseState] = useState(false);

    // const numFlagged = squares.flat().reduce((p, c) =>
    //     p.push(c.filter(square => square.flag == true))
    // );

    function fillMinefield(clickedX, clickedY) {

        const nextSquares = JSON.parse(JSON.stringify(squares));

        let minePosX = 0;
        let minePosY = 0;

        for (let i = 0; i < numMines; i++) {

            do {
                minePosX = Math.floor(Math.random() * width);
                minePosY = Math.floor(Math.random() * height);
            } while (minePosX === clickedX && minePosY === clickedY);

            nextSquares[minePosY][minePosX].mine = true;
        }

        for (let i = 0; i < nextSquares.length; i++) {
            for (let j = 0; j < nextSquares[i].length; j++) {
                nextSquares[i][j].touchingMines = checkNeighborSquares(nextSquares, j, i);
            }
        }
        floodFill(nextSquares, clickedX, clickedY);
        setMove(move + 1);
        setSquares(nextSquares);
    }

    function handleSquareClick(clickedX, clickedY, button) {

        const nextSquares = JSON.parse(JSON.stringify(squares));

        if (button === 0) {
            if (nextSquares[clickedY][clickedX].mine == true){
                for (let row of nextSquares) {
                    for (let square of row) {
                        square.revealed = true;
                    }
                }
                setLoseState(true);
            }
            else{
                floodFill(nextSquares, clickedX, clickedY);
            }
        }
        else if (button === 2) {
            if (nextSquares[clickedY][clickedX].revealed == false) {
                nextSquares[clickedY][clickedX].flag = !nextSquares[clickedY][clickedX].flag;
            }
        }

        setMove(move + 1);
        setSquares(nextSquares);
        setWinState(checkWin(nextSquares));
    }

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
            <div className='game'>
                {(move == 0)
                    ? (<Board squares={squares} onClick={fillMinefield}/>) 
                    : (<Board squares={squares} onClick={handleSquareClick}/>)
                }               
            </div>
        </div>
    );
}


function floodFill(squares, x, y) {

    if (!isFillable(squares, x, y)) return;

    if (squares[y][x].touchingMines == 0) {
        squares[y][x].revealed = true;
        squares[y][x].flag = false;
        floodFill(squares, x+1, y);
        floodFill(squares, x-1, y);
        floodFill(squares, x, y-1);
        floodFill(squares, x, y+1);
    } else if (squares[y][x].touchingMines > 0) {
        squares[y][x].revealed = true;
        squares[y][x].flag = false;
    }
}

function isFillable(squares, x, y) {
    if (y >= squares.length || y < 0) {return false};
    if (x >= squares[y].length || x < 0) {return false};

    if (!squares[y][x]) {return false};
    if (squares[y][x].mine == true) {return false};
    if (squares[y][x].revealed == true) {return false};

    return true;
}

function checkNeighborSquares(squares, x, y) {
    let total = 0;

    // Check the 8 squares around the target square
    for (let dy = -1; dy <= 1; dy++) {
        // Make sure the row index is within bounds
        if ((y+dy) >= squares.length || (y+dy) < 0) continue;
        for (let dx = -1; dx <= 1; dx++) {
            // Make sure the column index is within bounds
            if ((x+dx) >= squares[y+dy].length || (x+dx) < 0) continue;
            // If the square contains a mine, increase the total
            if (squares[y+dy][x+dx].mine) total++;
        }
    }

    return total;
}

function checkWin(checkSquares) {

    for (let row of checkSquares) {
        for (let square of row) {
            if (square.mine === true) {

                if (square.flag === true) {
                    continue;
                }
                else {
                    return false;
                }

            }
            else if (square.flag === true) {
                return false;
            }
        }
    }

    return true;
}