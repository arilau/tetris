// app.js

var tetrisApp = angular.module('Tetris', []);


var GAME_BOARD_ROWS = 22;
var GAME_BOARD_COLUMNS = 10;
var START_ROW = 0;
var START_COLUMN = 4;
var SCOPE;

var GAME_DELAY = 1100;

var normalDelay = GAME_DELAY;
var fallingDelay = 100;
var currentDelay = normalDelay;
var gameBoard = [];

var nextPieceTable = [];

var piece;
var pieceOnBoard = false;

var linesCleared = 0;

var score = 0;
var level = 0;

clearBoard();

document.onkeydown = checkKey;
document.onkeyup = checkKeyUp;


 

//----------------------


var highScores = [];

//localStorage. removeItem("tetris_highscores");

if (localStorage.getItem("tetris_highscores")) {
	// console.log("found local storage");
    hs = JSON.parse(localStorage["tetris_highscores"]);
    for (var i = 0; i < 10; i++) {
    	highScores.push({name:hs[i].name, score:hs[i].score});
    };
 } else {
 	// console.log("generating local storage");

 	// highScores.push({name:'ARI', score:73463});
 	// highScores.push({name:'ARI', score:61681});
 	// highScores.push({name:'ARI', score:19707});

 	for (var i = 10-highScores.length; i > 0; i--) {
		highScores.push({name:'UNKNOWN', score:i*100});
	};
	localStorage.setItem("tetris_highscores", JSON.stringify(highScores));
 }

// for (var i = 0; i < highScores.length; i++) {
// 	console.log(highScores[i].name + ": " + highScores[i].score);
// };

//----------------------

tetrisApp.controller('GameController', function GameController($scope, $timeout) {

	$scope.gameStarted = false;
	$scope.gameStartPopup = true;
	$scope.gameOverPopup = false;
	$scope.nameInputPopup = false;
	$scope.loopCount = 0;
	$scope.score = 0;

	$scope.highScores = highScores;
	
	$scope.gameBoard = gameBoard;


	SCOPE = angular.element(document.getElementById("tetrisBody")).scope();


	var nextPieces = [];

	var delayUntilNextLoop;


	$scope.init = function() {
		// All init stuff goes here
		console.log("init()");

		$scope.fillNextPieces();
		$scope.updateData();


	}

	// ********************************************************************************************

	$scope.gameLoop = function() {

		// console.log("gameLoop()");

		$scope.loopCount++;

		if( !pieceOnBoard ) {
			piece = new Piece(START_ROW, START_COLUMN, nextPieces.shift());
			// console.log("Created new piece");
			$scope.fillNextPieces();

			generateNextPieceData(nextPieces[0]);

			pieceOnBoard = true;	
		}

		var pieceFell = piece.fall();

		if( !pieceFell ) {
			pieceOnBoard = false;
			piece = null;
			// console.log("Piece has landed!");
			removeFullRowsFromBoard();
		}

		//console.log($scope.loopCount + " LOOP END Piece: " + piece.toString());

		

		$scope.updateData();

		if( pieceOnBoard ) {
			delayUntilNextLoop = currentDelay;
		} else {
			delayUntilNextLoop = 50;
		}

		$timeout(function() { $scope.restartGameLoop(); }, delayUntilNextLoop);
	}

	$scope.restartGameLoop = function() {
		// console.log("restartGameLoop()");

		if ($scope.gameStarted) {
			$scope.gameLoop();
		}
		
	}

	// ********************************************************************************************


	$scope.startGame = function() {
		console.log("startGame()");
		score = 0;
		level = 0;
		normalDelay = GAME_DELAY;
		currentDelay = normalDelay;
		linesCleared = 0;

		clearBoard();
		$scope.gameStarted = true;
		$scope.gameStartPopup = false;
		$scope.loopCount = 0;
		nextPieces = [];
		$scope.fillNextPieces();
		$scope.updateData();
		$timeout(function() { $scope.restartGameLoop(); }, GAME_DELAY);
	}

	$scope.fillNextPieces = function() {
		while(nextPieces.length < 5) {
			// console.log("Generate piece to queue");
			nextPieces.push(getNewPiece());
		}
	}

	$scope.updateData = function() {
		// console.log("Updating game data to scope");
		$scope.gameBoard = gameBoard;
		$scope.score = score;
		$scope.nextPieceTable = nextPieceTable;
		$scope.level = level;
		$scope.linesCleared = linesCleared;
		$scope.currentDelay = currentDelay;

	}
	
	


	$scope.gameOver = function() {

		$scope.gameOverPopup = true;
		$scope.gameStarted = false;


		$timeout(function() { $scope.clearGameOverPopup(); }, 4000);

		

	}

	$scope.clearGameOverPopup = function() {
		$scope.gameOverPopup = false;
		// $scope.gameStartPopup = true;
		nextPieces = [];
		nextPieceTable = [];
		$scope.updateData();

		// gameStartPopup = false
		// namePopup = true
		$scope.checkIfHighScore();
	}

	$scope.checkIfHighScore = function() {
		if( scoreIsHighScore(score) ) {
			$scope.nameInputPopup = true;
		} else {
			$scope.gameStartPopup = true;
			console.log("Did not make to high score list.");
		}

	}

	$scope.saveScore = function() {
		$scope.nameInputPopup = false;
		saveHighScore($scope.userName.toUpperCase(), score);
		$scope.gameStartPopup = true;
	}

	$scope.init();

});  // controller ends


// <div ng-repeat="item in items | slice:6:10">{{item}}</div>

tetrisApp.filter('slice', function() {
  return function(arr, start, end) {
    return (arr || []).slice(start, end);
  };
});


// *************************************************
// **
// **  FUNCTIONS
// **



function checkKey(e) {
	e = e || window.event;
	if (e.keyCode == '38') {
		// SCOPE.$apply(function () {
		// 	SCOPE.key('up');
		// });

		piece.rotate();

	}
	else if (e.keyCode == '40') {
		if (piece ) {
			piece.fall();
		}
		currentDelay = fallingDelay;
	}
	else if (e.keyCode == '37') {
		piece.move('left');
		
	}
	else if (e.keyCode == '39') {
		piece.move('right');
	}
}

function checkKeyUp(e) {
	e = e || window.event;
	if (e.keyCode == '40') {
		
		currentDelay = normalDelay;
	}
}

function Piece(row,column,color) {
	this.color = color
	this.row = row;
	this.column = column;
	this.rotation = 0;
	this.rotationsCount = 4;
	if( color === 1 ) { this.rotationsCount = 1; }
	else if( color > 1 && color < 5 ) { this.rotationsCount = 2; }
	var success = this.draw();
	if( !success ) {
		this.erase();
		SCOPE.$apply(function () {
			SCOPE.gameOver();
		});
	}
}

Piece.prototype.toString = function() {
	return "(" + this.row + ", " + this.column + ": " + this.color + ", r" + this.rotation + ")";
}

Piece.prototype.fall = function() {

	this.erase();

	this.row++;

	var spaceAvailable = this.draw();

	if( spaceAvailable ) {
		// console.log("Piece fell to row: " + this.row);	
	} else {
		// Cancel movement
		this.row--;
		this.draw();
		// console.log("Can't fall anymore.");
	}

	score++;
	return spaceAvailable;
	
}

Piece.prototype.move = function(direction) {

	this.erase();
	if(direction === 'left') {
		this.column--;
	}
	if(direction === 'right') {
		this.column++;
	}

	var spaceAvailable = this.draw();

	if( !spaceAvailable ) {
		// Cancel movement
		if(direction === 'left') {
			this.column++;
		}
		if(direction === 'right') {
			this.column--;
		}
		this.draw();
	}
}


Piece.prototype.rotate = function() {
	this.erase();
	this.rotation++;
	var spaceAvailable = this.draw();
	if( spaceAvailable ) {
		// console.log("Rotation OK");	
	} else {
		// Cancel movement
		this.rotation--;
		this.draw();
		// console.log("Can't rotate.");
	}

	// console.log("Rotated Piece: " + piece.toString());
}

Piece.prototype.erase = function() {
	this.draw('remove');
}

Piece.prototype.draw = function(mode) {

	// return;		// DEBUGGING

	var color = this.color;

	if( mode === 'remove' ) {
		color = 0;
	} else {

		r = rotationArray(this.color, this.rotation % this.rotationsCount );

		// Simulate draw to new location and check if board is empty
		while (r.length > 0) {
			var col = getTile(this.row+r.shift(), this.column+r.shift()).color;
			// console.log("check tile: " + col);
			if( col > 0 ) {
				return false;
			}
		}

	}

	r = rotationArray(this.color, this.rotation % this.rotationsCount );

	// Actual draw
	while (r.length > 0) {
		setTile(this.row+r.shift(), this.column+r.shift(), color);
	}

	SCOPE.$apply(function () {
		SCOPE.updateData();
	});

	return true;

}

function rotationArray(color, rotation) {

	var r = {
		1 : { 	0:[0, -1, 0, 0, 1, -1, 1, 0] },
		
		2 : { 	0:[0, -2, 0, -1, 0, 0, 0, 1], 
				1:[-1, 0, 0, 0, 1, 0, 2, 0]  
			},

		3 : { 	0:[0, 0, 0, 1, 1, -1, 1, 0], 
				1:[-1, 0, 0, 0, 0, 1, 1, 1]  
			},

		4 : { 	0:[0, -1, 0, 0, 1, 0, 1, 1], 
				1:[-1, 1, 0, 0, 0, 1, 1, 0]  
			},

		5 : { 	0:[0, -1, 0, 0, 0, 1, 1, -1], 
				1:[-1, 0, 0, 0, 1, 0, 1, 1], 
				2:[-1, 1, 0, -1, 0, 0, 0, 1], 
				3:[-1, -1, -1, 0, 0, 0, 1, 0] 
			},

		6 : { 	0:[0, -1, 0, 0, 0, 1, 1, 1], 
				1:[-1, 0, -1, 1, 0, 0, 1, 0], 
				2:[-1, -1, 0, -1, 0, 0, 0, 1], 
				3:[-1, 0, 0, 0, 1, -1, 1, 0] 
			},
		7 : { 	0:[0, -1, 0, 0, 0, 1, 1, 0], 
				1:[-1, 0, 0, 0, 0, 1, 1, 0], 
				2:[-1, 0, 0, -1, 0, 0, 0, 1], 
				3:[-1, 0, 0, -1, 0, 0, 1, 0] 
			}
	};

	return r[color][rotation];

}




function setTile(row, column, color) {
	// console.log("setTile(" + row + ", " + column + ": " + color + ")");
	gameBoard[row][column].color = color;
}

function getTile(row, column) {
	if( row > GAME_BOARD_ROWS-1 ||column > GAME_BOARD_COLUMNS-1 || column < 0 ) {
		return new Tile(0,0,99);
	}

	return gameBoard[row][column];
}

function removeTile(row, column) {
	gameBoard[row][column].color = 0;
}

function removeFullRowsFromBoard() {
	// console.log("removeFullRowsFromBoard()");
	var numberOfRowsRemoved = 0;
	for (var row = 0; row < GAME_BOARD_ROWS; row++) {
		if( isRowFull(row) ) {
			removeRow(row);
			numberOfRowsRemoved++;
		}
	}
	updateScore(numberOfRowsRemoved);
	checkLevel(numberOfRowsRemoved);
}

function checkLevel(rowsRemoved) {
	linesCleared = linesCleared + rowsRemoved;

	for(var newLevel=1; newLevel<100; newLevel++) {
		if( linesCleared >= level*5+5) {
			level++;
			normalDelay = normalDelay * 0.85;
			if (normalDelay < 150) {
				normalDelay = 150;
			}
			currentDelay = normalDelay;
		}
	}

}

function updateScore(numberOfRowsRemoved) {
	// Level	Points for
	// 0	40	100	300	1200
	// 1	80	200	600	2400
	// 2	120	300	900	3600
	// ...
	// 9	400	1000	3000	12000
	// n	40 * (n + 1)	100 * (n + 1)	300 * (n + 1)	1200 * (n + 1)

	switch( numberOfRowsRemoved ){
		case 1:
			score = score + 40 * (level + 1);
			break; 
		case 2:
			score = score + 100 * (level + 1);
			break;
		case 3:
			score = score + 300 * (level + 1);
			break;
		case 4:
			score = score + 1200 * (level + 1);
			break;
		default:
			break;
	}
}

function removeRow(r) {
	// drop everything above 1 line starting from row above
	// console.log("removeRow() " + r);
	for(var row=r; row > 0; row--) {
		for (var column = 0; column < GAME_BOARD_COLUMNS; column++) {
			var color = getTile(row-1,column).color;
			setTile(row, column, color);
		}
	}

}

function isRowFull(row) {
	for (var column = 0; column < GAME_BOARD_COLUMNS; column++) {
		if(getTile(row,column).color == 0) {
			return false;
		}
	}
	// console.log("Full row: " + row);
	return true;
}

function getNewPiece() {
	return Math.floor((Math.random() * 7) + 1);
	//return 1;

}

function getRandomColumn() {
	return Math.floor((Math.random() * 10) );
}


function generateNextPieceData(nextColor) {
		// console.log("generateNextPieceData()");
		// console.log("next piece color: " + nextColor);
		nextPieceTable = [];
		switch( nextColor ) {
			case 1:
				nextPieceTable.push([new Tile(0,0,1), new Tile(0,0,1)]);
				nextPieceTable.push([new Tile(0,0,1), new Tile(0,0,1)]);
				break;
			case 2:
				nextPieceTable.push([new Tile(0,0,2), new Tile(0,0,2), new Tile(0,0,2), new Tile(0,0,2)]);
				break;
			case 3:
				nextPieceTable.push([new Tile(0,0,0), new Tile(0,0,3), new Tile(0,0,3)]);
				nextPieceTable.push([new Tile(0,0,3), new Tile(0,0,3), new Tile(0,0,0)]);
				break;
			case 4:
				nextPieceTable.push([new Tile(0,0,4), new Tile(0,0,4), new Tile(0,0,0)]);
				nextPieceTable.push([new Tile(0,0,0), new Tile(0,0,4), new Tile(0,0,4)]);
				break;
			case 5:
				nextPieceTable.push([new Tile(0,0,5), new Tile(0,0,5), new Tile(0,0,5)]);
				nextPieceTable.push([new Tile(0,0,5), new Tile(0,0,0), new Tile(0,0,0)]);
				break;
			case 6:
				nextPieceTable.push([new Tile(0,0,6), new Tile(0,0,6), new Tile(0,0,6)]);
				nextPieceTable.push([new Tile(0,0,0), new Tile(0,0,0), new Tile(0,0,6)]);
				break;
			case 7:
				nextPieceTable.push([new Tile(0,0,7), new Tile(0,0,7), new Tile(0,0,7)]);
				nextPieceTable.push([new Tile(0,0,0), new Tile(0,0,7), new Tile(0,0,0)]);
				break;
			default:
		}
		
		// console.log("Generated next piece data: " + nextPieceTable);
		SCOPE.$apply(function () {
			SCOPE.updateData();
		});
	}

function Tile(row, column, color) {
	this.color = color;
	this.row = row;
	this.column = column;
}

Tile.prototype.toString = function() {
	return "(" + this.row + ", " + this.column + ": " + this.color + ")";
}

function clearBoard() {
	gameBoard = [];
	for (var i = 0; i < GAME_BOARD_ROWS; i++) {
		var row = [];
		for (var j = 0; j < GAME_BOARD_COLUMNS; j++) {
			row.push(new Tile(i, j, 0));
		}
		gameBoard.push(row);
	}
}

function scoreIsHighScore(newScore) {
	// console.log("Score required: " )
	if( newScore > highScores[9].score) {
		return true;
	}
	return false;
}


function saveHighScore(newName, newScore) {

	for (var i = 0; i < 10; i++) {
		if( highScores[i].score < newScore) {
			console.log("Score is number " + i);

			for(var j=9; j>i; j--) {
				highScores[j] = highScores[j-1];
			}
			highScores[i] = {name:newName, score:score};
			localStorage.setItem("tetris_highscores", JSON.stringify(highScores));
			break;
		} else {
			console.log("No high score");
		}

	};
}




