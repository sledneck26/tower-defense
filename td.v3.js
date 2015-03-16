var boardDem = window.innerHeight - 30;	//Dimensions of the game board
boardDem = 600;
var gridDem = 10;						//Dimensions of the grid that will cover the board.
var frameRate = 1000 / 30;				//Frames to be displayed per second
var rAF = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.requestAnimationFrame;
var spritePath = [];					//The path that the sprites will follow
var spriteArr = [];						//The array of sprite objects
var towerArr = [];						//The array of tower objects
var bulletArr = [];						//The array of bullet objects
var gridUsed = [];						//Two dimensional array holding a true/false value for each gird on the game board
var pathColor = '#614406';				//Color of the path
var backgroundColor = 'green';			//Color of the background
var gridColor = 'black';				//Color of the grid
var pathPadding = 2;					//Padding on the path for path draw
var lives = 20;							//Lives left before game over
var money = 500;						//The money that you have to buy towers with
var waveIndex = 0;						//The current wave
var toggleGrid = false;					//Whether the grid will be displayed or not
var canPlaceTower = true;				//Toggle switch to be able to place towers or not.  Tower can only be placed between waves
var back = new Image();					//Holds image of the background to be used when rendering the towers
var gCanvas, 							//Holds the canvas object
ctx, 									//Holds the drawing object
end, 									//Coordinate pair for the ending point for the sprites
tempTower,								//Hold tower object until it can be confirmed into the tower list
button,									//Start wave button object
pathBackground,							//Holds image data for the whole background
q,										//Holder for q-tree object
selectedTower = false,					//Place holder for the last tower selected
updateMenu,								//Div used for the upgrading of towers.
gameControls;							//Div element for buttons and other game control elements

var useQuadTree = false;

//Game arrays
var pathCoords = [[60,0],[60,200],[250,200],[250,100],[450,100],[450,300],[100,300],[100,450],[540,450],[540,600]];	//2d array with x,y coordinates of the way points.
var spriteWaves = [
[{'num': 5, 'color': 'red', 'speed': 60, 'length': 5,'shape': 'circle', 'hp': 40}],
[{'num': 2, 'color': '#E512ED', 'speed': 40, 'length': 9,'shape': 'circle', 'hp': 150}, {'num': 5, 'color': '#340B9C', 'speed': 80, 'length': 4,'shape': 'circle', 'hp': 20}],
[{'num': 10, 'color': '#00FF3C', 'speed': 50, 'length': 5,'shape': 'circle', 'hp': 35}],
[{'num': 8, 'color': '#00FCFF', 'speed': 40, 'length': 5,'shape': 'circle', 'hp': 40}],
[{'num': 1, 'color': '#FFAE0E', 'speed': 20, 'length': 12,'shape': 'circle', 'hp': 300}]
];

function coor(x, y){
	this.x = x;
	this.y = y;
} 


/*
* Sprite - The holds all the sprite functionality
*/
function Sprite(hp, speed, color, coin, raidus, shape){
	this.hp = hp;
	this.hpLeft = hp;
	this.speed = speed;
	this.color = color;
	this.coin = coin;
	this.shape = shape;
	this.raidus = raidus || 5;
	this.currentLocation = new coor(spritePath[0].x, spritePath[0].y-20);
	this.indexStop = 1; 
	this.nextStop = pathWobble(spritePath[this.indexStop], raidus);
	this.distanceToNextStop = distancePoints(this.currentLocation.x, this.currentLocation.y, this.nextStop.x, this.nextStop.y);
	this.h = raidus;
	this.w = raidus;
	this.rangeColor = 'brown';
	this.inRange = false;
} 

/*
*	Sprite functions
*/
Sprite.prototype = {
/*
*	Function move - This function move simulates the sprite moving along the game board. It will update the current location with the new loation based on the speed of the sprite
*					and the time between screen updates.
*	Returns - True or false based on whether the sprite is near the end or not.
*/	
	move: function(){
//		The distance between the current location and the next way point is less then 2 pixels then 
//		update the way point to the next point in the path list.
		if (distancePoints(this.currentLocation.x, this.currentLocation.y, this.nextStop.x, this.nextStop.y) < 1+this.speed/100){
			this.indexStop++;
			this.nextStop = pathWobble(spritePath[this.indexStop], this.raidus);
		}
		if (typeof this.nextStop != 'undefined'){
			this.currentLocation = coordinatesPoint(this.currentLocation.x, this.currentLocation.y, this.nextStop.x, this.nextStop.y, this.speed/frameRate);
			this.distanceToNextStop = distancePoints(this.currentLocation.x, this.currentLocation.y, this.nextStop.x, this.nextStop.y);
		}
		
//		Check if the current location is close to the end point if so return true that way the sprite can be deleted 
//		Otherwise draw the new location for the sprite.
		if (distancePoints(this.currentLocation.x, this.currentLocation.y, end.x, end.y) < 1+this.speed/100 || this.hpLeft === 0 || typeof this.nextStop === 'undefined'){	return true;	}
		else{	return false;	}
	},
	
	draw: function(){
//		Draw health
		ctx.beginPath();
		ctx.lineWidth = 1.5;
//		ctx.moveTo(this.currentLocation.x-gridDem, this.currentLocation.y-gridDem);
//		ctx.lineTo((this.currentLocation.x-gridDem)+(gridDem*2)*(this.hpLeft/this.hp), this.currentLocation.y-gridDem);
		
		ctx.moveTo(this.currentLocation.x-10, this.currentLocation.y-this.raidus - 5);
		ctx.lineTo((this.currentLocation.x-10)+20*(this.hpLeft/this.hp), this.currentLocation.y-this.raidus - 5);
		ctx.strokeStyle = 'red';
		ctx.stroke();
//		Draw sprite			
		ctx.beginPath();
		ctx.arc(this.currentLocation.x, this.currentLocation.y, this.raidus, 0, 2 * Math.PI);
		ctx.fillStyle = ((this.inRange) ? this.rangeColor : this.color);
		ctx.strokeStyle = this.color;
		ctx.fill();
		ctx.stroke(); 
	}

}
	
//Allows the sprites to not walk directly to the next point but to take a slightly different path.
function pathWobble(cell, raidus){
	var distanceCenter = pathPadding*gridDem-raidus;
	if (typeof cell != 'undefined') {
		return new coor(cell.x + getRandom(-1*distanceCenter, distanceCenter), cell.y + getRandom(-1*distanceCenter, distanceCenter)); 
	}
}
// Returns a random number between min (inclusive) and max (exclusive)
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}
/*
* Tower - The holds all the sprite functionality
* 
*	@param height	- The height of the tower in grids
*	@param width 	- The width of the tower in grids
*	@param loc 		- Coordinate pair for the top left of the tower
*	@param shotRate - The shots per minute that the tower is capable of firing
*	@param range 	- The range of the tower in grids 
*	@param power	- The attack power of the tower
*/
function Tower(height, width, loc, shotRate, range, power, cost, color){
	this.loc = loc;
	this.height = height;
	this.width = width;
	this.shotRate = 60000/shotRate;
	this.range = range;
	this.power = power;
	this.cost = cost;
	this.level = 1;						//Holds the current level of the tower
	this.kills = 0;						//Holds the number of sprites killed
	this.targetingScheme = 'first';		//Allows the user to change the scheme with which the tower finds its target
	this.color = color;
	this.hasTarget = false;				//True if the tower has a sprite that is in range
	this.target;						//Current target of the tower
	this.turretEnd;						//A coor of the end of the turret
	this.selected = true;				//True if the turret is selected false if it is not
	this.paintX = this.loc.x;			//top left corner for space to copy when placing towers on the screen
	this.paintY = this.loc.y;			//top left corner for space to copy when placing towers on the screen
	this.turretLength = Math.min((height/2)*gridDem, (width/2)*gridDem);
	this.center;						//Set center of the tower.
	this.lastshot = 0;					//The system time stamp of the last shot made
	this.upgradeCostPercent = .25;
	this.upgradePowerPercent = 1.25;
}
Tower.prototype = {
	setCenter: function(){
		this.center = new coor(this.loc.x + (this.width/2 * gridDem), this.loc.y + (this.height/2 * gridDem));
	},

	draw: function(){	
//		Draw the range arc around the tower		
		if (this.selected){
			ctx.beginPath();
			ctx.fillStyle = 'rgba(232, 232, 232, 0.5)';
			ctx.arc(this.loc.x + (this.width/2 * gridDem), this.loc.y + (this.height/2 * gridDem), this.range * gridDem, 0, 2 * Math.PI);
			ctx.fill();
		}
		
		ctx.fillStyle = this.color;
		ctx.fillRect(this.loc.x, this.loc.y, this.height * gridDem, this.width * gridDem);
		ctx.beginPath();
		ctx.lineWidth = .5;
		ctx.rect(this.loc.x, this.loc.y, this.height * gridDem, this.width * gridDem);
		ctx.strokeStyle = 'black';
		tower = this;
		ctx.rect(tower.loc.x-tower.range*gridDem + tower.width/2 * gridDem, tower.loc.y-tower.range*gridDem + tower.height/2 * gridDem, tower.range*2*gridDem, tower.range*2*gridDem);
		ctx.stroke();
		
		//Move to center to draw turret 
		ctx.beginPath();
		ctx.moveTo(this.center.x, this.center.y);
		if (typeof this.target != 'undefined'){
			this.turretEnd = coordinatesPoint(this.center.x, this.center.y, this.target.currentLocation.x, this.target.currentLocation.y, this.turretLength);
		}
		ctx.lineWidth = 2.5;
		ctx.lineTo(this.turretEnd.x, this.turretEnd.y);
		ctx.stroke();
		

	},
	
	cClear: function(){
		ctx.putImageData(back, this.paintX, this.paintY);
	},
	
	cDraw: function(){
		this.paintX = this.loc.x - ((this.range - (this.width / 2)) * gridDem) - 1;
		this.paintY = this.loc.y - ((this.range - (this.height / 2)) * gridDem) - 1;
		back = ctx.getImageData(this.paintX, this.paintY, (this.range * gridDem) * 2 + 2, (this.range * gridDem) * 2 + 2);
//		Draw the range arc around the tower		
		if (this.selected){
			ctx.beginPath();
			ctx.fillStyle = 'rgba(232, 232, 232, 0.5)';
			ctx.arc(this.loc.x + (this.width/2 * gridDem), this.loc.y + (this.height/2 * gridDem), this.range * gridDem, 0, 2 * Math.PI);
			ctx.fill();
		}
		ctx.fillStyle = this.color;
		ctx.fillRect(this.loc.x, this.loc.y, this.height * gridDem, this.width * gridDem);
	},
	
	//Set the grid locations to full on the grid map
	addToGrid: function(){
		R = this.loc.x / gridDem;
		C = this.loc.y / gridDem;
		for (var r = R; r < R + this.width; r++){
			for (var c = C; c < C + this.height; c++){
				gridUsed[c][r] = true;
			}
		}
	},
	
/*
*	Function attackSprite - Attacks the given target
*	function expects targeted sprite to have hit points available upon calling.
*/	
	attackSprite: function(){
		var distance = distancePoints(this.center.x, this.center.y, this.target.currentLocation.x, this.target.currentLocation.y);
		if (this.target.hpLeft > 0 && distance <= this.range * gridDem){
			var bullet = new Bullet(300, this.turretEnd, this.target.currentLocation, '#fff', this.target, Math.random() * (this.power - this.power*.75) + this.power*.75);
			bulletArr.push(bullet);
			this.lastshot = Date.now();
		}else{
			//Waits another firing rate till it allows the tower to be matched with a new target.
			this.hasTarget = false;
			delete this.target;
		}
	},

/*
*	Takes an xy coordinate pair and returns true or false based on whether the coordinates are located within its bounds.
*/	
	isInside: function(pos){
		return this.loc.x <= pos.x && pos.x <= this.loc.x+this.width*gridDem && this.loc.y <= pos.y && pos.y <= this.loc.y+this.height*gridDem;
	},
	
/*
*	Returns the upgrade information for the tower.
*/	
	getUpgradeInfo: function(){
		return 'Level: '+this.level+ ' Upgrade Cost: ' + Math.round((this.level * this.upgradeCostPercent) * this.cost) + ' Power: ' + Math.round(this.upgradePowerPercent * this.power);
	},

/*
*	Returns the upgrade cost for the tower.
*/		
	getUpgradeCost: function(){
		return Math.round((this.level * this.upgradeCostPercent) * this.cost);
	},
	
/*
*	Changes the power of the tower based on a certian percentage.  Will change it by same amount every time the function is called.
*/	
	upgradeTower: function(){
		this.power = Math.round(this.upgradePowerPercent * this.power);
		this.level++;
	},
	
/*
*	Function spriteChooseMethod -	Determines the target of the the tower based on the different targeting options.
*	Options: Assumption - that all sprites passed into the function are within the range of the tower
*			First		- The sprite that is closest to the end of the path 
*			Last		- The sprite that is closest to the beginning of the path
*			Weakest		- The sprite that is the weakest
*			Strongest	- The sprite that is the strongest
*/
	spriteChooseMethod: function(sprite){
		//If tower has a target it needs to compare the new sprite to the current target based on the the targeting scheme
		if (typeof this.target == 'undefined') this.target = sprite;
		switch(this.targetingScheme){
			case 'first':
				this.target = this.targetFirst(this.target, sprite);
				break;
			case 'last':
				this.target = this.targetLast(this.target, sprite);
				break;
			case 'strong':
				this.target = this.targetStrong(this.target, sprite);
				break;
			case 'weak':
				this.target = this.targetWeak(this.target, sprite);
				break;
		}
	},
	
/*
*	returns the sprite that is the closest to the end
*/	
	targetFirst: function(curr, check){
		if (curr.indexStop > check.indexStop)
			return curr;
		else if (curr.indexStop === check.indexStop && curr.distanceToNextStop < check.distanceToNextStop)
			return curr;
		else
			return check;
	},
	
/*
*	Returns the sprite that is the closest to the beginning
*/	
	targetLast: function(curr, check){
		if (curr.indexStop < check.indexStop)
			return curr;
		else if (curr.indexStop === check.indexStop && curr.distanceToNextStop > check.distanceToNextStop)
			return curr;
		else
			return check;
	},
	
/*
*	Returns the sprite that is the weakest
*/	
	targetWeak: function(curr, check){
		return curr.hpLeft < check.hpLeft ? curr : check;
	},
	
/*
*
*/	
	targetStrong: function(curr, check){
		return curr.hpLeft > check.hpLeft ? curr : check;
	},
	
/*
*	Function canAttack 	- 
*/
	canAttack: function(){
		return this.lastshot < (Date.now() - this.shotRate);
	}
}

function Bullet(speed, start, end, color, target, strength){
	this.loc = start;			//Location of the bullet
	this.speed = speed;			//Speed that the bullet will travel at
	this.end = end;				//The coor of the ending point of the bullet
	this.color = color;			//Color of the bullet
	this.strength = strength;	//Strength of the attack
	this.target = target; 		//The target of the bullet
	this.traveled = 0;			//distance the bullet has traveled.
	this.shotLength = distancePoints(this.loc.x, this.loc.y, this.end.x, this.end.y);			//Overall length of the shot
	this.draw();
}
Bullet.prototype = {
	
	/*
	*	Function draw -	Find mid point so that the clear box will be placed correctly
	*					Get the background
	*					Draw the bullet
	*/
	draw: function(){
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(this.loc.x, this.loc.y, 2, 0, 2 * Math.PI);
		ctx.fill();
	},
	
	move: function(){
		var something = this.loc;
		this.loc = coordinatesPoint(this.loc.x, this.loc.y, this.end.x, this.end.y, this.speed/frameRate);
		this.traveled += distancePoints(this.loc.x, this.loc.y, something.x, something.y);
		
		//If bullet has not made the end yet
		if (this.traveled < this.shotLength){	return false;	}	
		//Subtract hit from target and return true
		else{	
			this.target.hpLeft -= this.strength;
			return true;
		}
	}
}

/*
*	Function distancePoints - Return the distance between two x,y pairs
*/
function distancePoints( xA, yA, xB, yB ){
  var xDistance = Math.abs( xA - xB );
  var yDistance = Math.abs( yA - yB );
 
  return Math.sqrt( Math.pow( xDistance, 2 ) + Math.pow( yDistance, 2 ) );
}
 
/*
*	Function coordinatesPoint - returns a new coordinate along between the two points a certain distance from the first point
*	@param distanceAC - The distance away from the first point.
*/
function coordinatesPoint( xA, yA, xB, yB, distanceAC ){
  var distanceAB  = distancePoints( xA, yA, xB, yB );
  var angleAB     = Math.atan2( ( yB - yA ), ( xB - xA ) );
  var deltaXAC    = distanceAC * Math.cos( angleAB );
  var deltaYAC    = distanceAC * Math.sin( angleAB );
  
  var xC          = xA + deltaXAC;
  var yC          = yA + deltaYAC;
 
  return new coor(xC, yC);
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

/*
*	Function canvasPlaceTower - Used as a helper function for the create tower.  Draws a temporary tower on the game board 
*/
function canvasPlaceTower(evt) {
	var mousePos = getMousePos(gCanvas, evt);
	tempTower.cClear();
	//Calculate the x and y position of the tower
	var x = (Math.round((mousePos.x - tempTower.width / 2) / 10) * 10) - (gridDem*(tempTower.width - tempTower.width % 2)) / 2;
	var y = (Math.round((mousePos.y - tempTower.height / 2) / 10) * 10) - (gridDem*(tempTower.height - tempTower.height % 2)) / 2;
	tempTower.loc = new coor(x, y);
	tempTower.cDraw();
}

/*
*	Function mouseOutOfBounds - Helper function for when the mouse goes off the canvas. Clear the temp tower
*/
function mouseOutOfBounds(){
	tempTower.cClear();
}

/*
*	Holds the responsibility of when a tower has been selected.
*/
function towerSelect(t){
	selectedTower = t;
	t.selected = true;
	document.getElementById('message').innerHTML = t.getUpgradeInfo();
}

/*
*	Function upgradeButtonClicked -	This handles the upgrade button clicked event
*									Has responsibility to handle make sure user can afford the upgrade
*									Calling the upgrade function
*/
function upgradeButtonClicked(){
	if (selectedTower.getUpgradeCost() > money){
		gameMessages.innerHTML = 'You don\'t have enough money for this upgrade';
		setTimeout(function(){	gameMessages.innerHTML = '';	}, 3000);
	}else{
		money -= selectedTower.getUpgradeCost();
		selectedTower.upgradeTower();
		towerSelect(selectedTower);
		displayMenuVars();
	}
}

/*
*	Changes the targeting mode of the selected tower and updates the game interface
*/
function changeTargetingMode(){
	selectedTower.targetingScheme = this.getAttribute('mode');
	document.getElementById('targitingScheme').getElementsByClassName('selected')[0].className = '';
	this.className = 'selected';
}
/*
*	Function canvasClick - Helper function for canvas click event while towers are ready to be placed
*/
function canvasClick(evt){
	if(!tempTower){
		var mousePos = getMousePos(gCanvas, evt);
		var updateBool = true;
		var tempI;			//Temporarily store the selected tower.
		for (i = 0; i < towerArr.length; i++){
			towerArr[i].selected = false;
			if (towerArr[i].isInside(mousePos)){
				tempI = i;
				towerSelect(towerArr[i]);
			document.getElementById('targitingScheme').getElementsByClassName('selected')[0].className = '';
			document.getElementById(towerArr[i].targetingScheme).className = 'selected';
				
				//Move this tower to the end of the list
				updateBool = false;
			}
		}

		updateMenu.className = (updateBool ? 'hide' : '');
		
		if (!updateBool){
			var temp = towerArr[tempI];
			towerArr.splice(tempI, 1);
			towerArr.push(temp);
		}
		if (canPlaceTower) drawStaticBoard();
	}else if (canPlaceTower && checkVaild()){
		tempTower.cClear();
		tempTower.turretEnd = tempTower.loc;
		tempTower.setCenter();
		tempTower.selected = false;
		tempTower.draw();
		tempTower.addToGrid();
		towerArr.push(tempTower);
		money -= tempTower.cost;
		displayMenuVars();

//		Allow user to place same tower as long as they have enough money		
		if (money >= tempTower.cost){
			tempTower = new Tower(tempTower.height, tempTower.width, new coor(-1000,-1000), 60000/tempTower.shotRate, tempTower.range, tempTower.power, tempTower.cost, tempTower.color);
			//Add all the event listeners for placing towers
		}else{	
			tempTower = false;
			removeCanvasListeners();
		}
	}	
}

/*
*	Function checkVaild 	- Used on click when trying to place a tower.  Will return true or false depending on whether the location is a valid location to place a tower
*							will check for other towers and if over the path.
*/
function checkVaild(){
	var C, R;
	R = tempTower.loc.x / gridDem;
	C = tempTower.loc.y / gridDem;
	for (var r = R; r < R + tempTower.width; r++){
		for (var c = C; c < C + tempTower.height; c++){
//			if any location has been used the location is invalid and must be tried again
			if (gridUsed[c][r]){
				return false;
			}
		}
	}
	return true;
} 

/*
*	Function removeCanvasListeners - Removes all the listeners for placing a tower.
*/
function removeCanvasListeners(){
//	gCanvas.removeEventListener('click', canvasClick);
	gCanvas.removeEventListener('mouseout', mouseOutOfBounds);
	gCanvas.removeEventListener('mousemove', canvasPlaceTower);
}

/*
*	Function canvasRightClick - Handles the event from when a right click is preformed on the canvas
*/
function canvasRightClick(ev){
	ev.preventDefault();
	removeCanvasListeners();
	if (tempTower){
		tempTower.cClear();
		tempTower = false;
	}
	return false;
}
/*
*	Function createTower 	- Creates a temporary tower to show where the user can place the tower.  Starts the proper event listener to maintain the following functionality Will show the tower and its range as the user moves the mouse around the canvas.  Will erase the tower if the cursor exits the canvas.  Will place the tower when a click has been registered.
*/
function createTower(){
	//If there is a tower that has been selected, unselect it then redraw the board.
	if (selectedTower){
		selectedTower.selected = false;
		drawStaticBoard();
	}
//	Message if the current wave is active	
	if (!canPlaceTower){
		gameMessages.innerHTML = 'You can\'t place towers now';
		setTimeout(function(){	gameMessages.innerHTML = '';	}, 3000);
//	Message if you don't have enough money
	}else if (Number(this.getAttribute('cost')) > money){
		gameMessages.innerHTML = 'You don\'t have enough money';
		setTimeout(function(){	gameMessages.innerHTML = '';	}, 3000);
//	Otherwise allow tower to be placed.
	}else{
		tempTower = new Tower(Number(this.getAttribute('height')), Number(this.getAttribute('width')), new coor(-1000,-1000), Number(this.getAttribute('shotRate')), Number(this.getAttribute('range')), Number(this.getAttribute('power')), Number(this.getAttribute('cost')), this.getAttribute('color'));
		//Add all the event listeners for placing towers
		gCanvas.addEventListener('mouseout', mouseOutOfBounds, false);
		gCanvas.addEventListener('mousemove', canvasPlaceTower, false);
	}
}

/*
*	Function addTowerButton - Function to add buttons for the differnt possible towers
*	@param display	- The text to be displayed on the button
*	@param h 		- Height of the tower
*	@param w 		- Width of the tower
*	@param sR 		- Shot rate of the tower in shots per min
*	@param r 		- Range of the tower
*	@param p 		- Power of the towers attack
*	@param c		- Cost of the tower
*/
function addTowerButton(display, h, w, sR, r, p, c, cl){
	var newButton = document.createElement('p');
	newButton.innerHTML = display;
	newButton.setAttribute('class', 'towerOptions');
	newButton.setAttribute('height', h);
	newButton.setAttribute('width', w);
	newButton.setAttribute('shotRate', sR);
	newButton.setAttribute('range', r);
	newButton.setAttribute('power', p);
	newButton.setAttribute('cost', c);
	newButton.setAttribute('color', cl);
	gameControls.appendChild(newButton);
	newButton.addEventListener('click', createTower, false);
	newButton.addEventListener('mouseover', function(){
		gameMessages.innerHTML = 'Cost: ' + this.getAttribute('cost') + ' Range: ' + this.getAttribute('range') + ' Strength: ' + this.getAttribute('power') + ' Fire Rate: ' + this.getAttribute('shotRate');
	});
	newButton.addEventListener('mouseout', function(){
		gameMessages.innerHTML = '';
	});
	
}
 
/*
*	makeMatches 	- Loops through while there are still sprites on the board and check to see if they are in range.
*					When a tower is matched with a sprite it will be removed from the list so that it doesn't show processing down.
*/
function makeMatches(){
//	Wave in progress
	if (!canPlaceTower){
		towerArr.forEach(function(tower){
//			Get sprites in the towers quad
			bool = false;
			if (useQuadTree){
				returnObjects = q.retrieve({x:tower.loc.x-tower.range*gridDem + tower.width/2 * gridDem, y:tower.loc.y-tower.range*gridDem + tower.height/2 * gridDem, w:tower.range*2*gridDem,h:tower.range*2*gridDem});
//				console.log(returnedObjects);
				returnObjects.forEach(function(sprite){
					sprite.inRange = true;
					if (distancePoints(tower.center.x, tower.center.y, sprite.currentLocation.x, sprite.currentLocation.y) <= tower.range * gridDem && tower.canAttack()){
						tower.spriteChooseMethod(sprite);
						bool = true;
					}
				});
			}else{
				spriteArr.forEach(function(sprite){
//					Sprite is in range of the tower and it has gone through its reload period
					if (distancePoints(tower.center.x, tower.center.y, sprite.currentLocation.x, sprite.currentLocation.y) <= tower.range * gridDem && tower.canAttack()){
						tower.spriteChooseMethod(sprite);
						bool = true;
					}
				});
			}
			if (bool) tower.attackSprite();
		});
	}
} 

function getSprites(){
	var length = spriteWaves.length;
	spriteWaves[waveIndex%length].forEach(function(ele){
		for(i = 0; i < ele['num']; i++)
			spriteArr.push(new Sprite(ele['hp'], ele['speed'] + getRandom(-3, 3), ele['color'], 7, ele['length']));
	});
/*	var length = 5;
	var worth = Math.max(1, 8 - Math.floor(waveIndex/length));
	for (i = -1; i < Math.floor(waveIndex/length); i++){		
		spriteArr.push(new Sprite(65+waveIndex*2, 70+getRandom(-2,2), 'yellow', worth, 5));
		spriteArr.push(new Sprite(60+waveIndex*2, 55+getRandom(-2,2), 'green', worth, 7));
		spriteArr.push(new Sprite(200+waveIndex*2, 40+getRandom(-2,2), 'blue', worth, 6));
		spriteArr.push(new Sprite(220+waveIndex*2, 35+getRandom(-2,2), 'red', worth, 10));
	}
*/}

function addSpritesToQ(){
	spriteArr.forEach(function(ele){
		q.insert(ele);
	});
}

function newGame(){
	towerArr = [];
	spriteArr = [];
	bulletArr = [];
	waveIndex = 0;
	money = 500;
	lives = 20;
	gameMessages.innerHTML = '';
	displayMenuVars();
	getSprites();
	drawStaticBoard();
	canPlaceTower = true;
	gridUsed = [];
	for (var i = 0; i < boardDem/gridDem; i++){
		var tempArr = [];
		for (var r = 0; r < boardDem/gridDem; r++){
			tempArr.push(false);
		}
		gridUsed.push(tempArr);
	}
}
/*
*	Function draw - The basic sprite drawing function will call each objects draw method will also delete sprites that have made it to the end.
*/
function draw(){
	button.removeEventListener('click', draw);
	removeCanvasListeners();
	displayMenuVars();
	ctx.putImageData(pathBackground,0,0);
	canPlaceTower = false;

	if (useQuadTree){
		q.clear();
//		Add sprites to the q-tree	
		addSpritesToQ();
	}
	
//	Call the make matches function	
	makeMatches();
	for(var i = 0; i<spriteArr.length; i++) {
		//Determines whether the sprite has made the end.  Remove the sprite from the list and subtract from lives
		if(spriteArr[i].move()){
			spriteArr.splice(i, 1);
			lives -= 1;
		//Determines if the sprite has been killed add coin to your bank and remove sprite from list
		}else if (spriteArr[i].hpLeft <= 0){
			money += spriteArr[i].coin;
			spriteArr.splice(i, 1);	
		//Otherwise redraw sprite
		}else{
			spriteArr[i].draw(); 
			spriteArr[i].inRange = false;
		}
	}

	

//	Draw the towers
	towerArr.forEach(function(ele){
		ele.draw();
	});

//	Draw Bullets	
	for (i = 0; i < bulletArr.length; i++){
		if (bulletArr[i].move())
			bulletArr.splice(i,1);
		else
			bulletArr[i].draw();
	}
	if(lives <= 0){
		gameMessages.innerHTML = "You have lost!<br>New Game starting in 10 seconds.";
		setTimeout(newGame, 10000);		
	}else if (spriteArr.length === 0){
		canPlaceTower = true;
		bulletArr = [];		//Delete all remaining bullets from last round
		button.addEventListener('click', draw, false);
		displayMenuVars();
		waveIndex++;
		getSprites(); 
		drawStaticBoard();

//		If the auto start wave box is checked then start wave as soon as last one finishes.
		if (document.getElementById('autoStart').checked){
			draw();
		}
		
	}else{
		setTimeout(draw, frameRate);
	}
}

/*
*	function pathFactory - Takes a 2d array of x,y pairs and makes coor of them then adds them to the global path array
*/
function pathFactory(arr){
	arr.forEach(function(ele){
		end = new coor(ele[0], ele[1]);
		spritePath.push(end);
	});
}

function displayMenuVars(){
	document.getElementById('wave').innerHTML = 'Wave: ' + (waveIndex+1);
	document.getElementById('coin').innerHTML = 'Coin: ' + money;
	document.getElementById('lives').innerHTML = 'Lives left: ' + lives;
}

/*
*	Function drawStaticBoard -	This function draws all the static items of the game board.  This inclused the background, the grid, the path, and the towers.  This is only for drawing the current state of the static game elements.
*/
function drawStaticBoard(){	
//	Paint the background green	
	ctx.fillStyle = backgroundColor;
	ctx.fillRect(0,0,boardDem,boardDem);

//	Draw the grid on the board.	
	if (toggleGrid){	
		ctx.beginPath();
		ctx.strokeStyle = gridColor;
		for (var i = 0; i < boardDem; i+=10){
			ctx.moveTo(i, 0);
			ctx.lineTo(i, boardDem);
			
			ctx.moveTo(0, i);
			ctx.lineTo(boardDem, i);
		}
		ctx.stroke();
	}
	
	//	Draw path for strictly vertical and horizontal path	
	for (var i = 0; i < spritePath.length-1; i++){
		var node1 = spritePath[i];
		var node2 = spritePath[i+1];
		ctx.fillStyle = pathColor;
		//Vertical Path
		ctx.beginPath();
		ctx.arc(node1.x, node1.y, gridDem*pathPadding, 0, 2*Math.PI);
		ctx.fill();
		if (node1.x === node2.x){
			ctx.fillRect(node1.x-gridDem*pathPadding, Math.min(node1.y, node2.y), gridDem * (pathPadding*2),Math.abs(node1.y - node2.y));
//		Horizontal Path
		}else{
			ctx.fillRect(Math.min(node1.x, node2.x), node1.y-gridDem*pathPadding, Math.abs(node1.x - node2.x), gridDem * (pathPadding*2));
		}
	}
	
//	pathBackground = ctx.getImageData(0,0,boardDem,boardDem);
//	Draw the towers
	towerArr.forEach(function(ele){
		ele.draw();
	});
}

/*
*	Function initGame - Sets up the canvas for the game to be displayed on. 
*/
function initGame(){
//	Set up the canvas
	gameControls = document.getElementById('gameButtons');
	gameMessages = document.getElementById('gameMessages');
	updateMenu = document.getElementById('updateMenu');
	gCanvas = document.getElementById("td_canvas");
	gCanvas.width = boardDem;
	gCanvas.height= boardDem;
	document.getElementById('gameObjects').style.width = gameMessages.style.width = gCanvas.offsetWidth + gameControls.offsetWidth + 5;
	gameControls.style.height = boardDem - 30;
	ctx = gCanvas.getContext("2d");
	back = ctx.getImageData(0,0,1,1);	

	if (useQuadTree){
		q = new _quadtree(gCanvas.width,gCanvas.height);
		addSpritesToQ();
	}
	
	gCanvas.addEventListener('click', canvasClick, false);		
	gCanvas.addEventListener('contextmenu', canvasRightClick, false);
	
//Event listener for upgrade button clicked	
	document.getElementById('buy').addEventListener('click', upgradeButtonClicked, false);
	articles = document.getElementById('targitingScheme').getElementsByTagName('li');
	for (var i = 0; i < articles.length; i++) {
		articles[i].addEventListener('click',changeTargetingMode,false);
	}
	
	
//	Allow music to be shut off	
	document.getElementById('toggle_music').addEventListener('click', function (){
		var audio = document.getElementById('background-music');
		audio.muted = !audio.muted;
	}, false);

//	Set up 2d array holding the board filled state
	for (var i = 0; i < boardDem/gridDem; i++){
		var tempArr = [];
		for (var r = 0; r < boardDem/gridDem; r++){
			tempArr.push(false);
		}
		gridUsed.push(tempArr);
	}
	
	

/*
Keep for later development on when the window is active and when its not.

window.onfocus = function () { 
  isActive = true; 
}; 

window.onblur = function () { 
  isActive = false; 
}; 
*/



//	Get the path waypoints 
	pathFactory(pathCoords);
	
//	Draw the board
	drawStaticBoard();
	pathBackground = ctx.getImageData(0,0,boardDem,boardDem);

//	make the path not tower placeable.
	for (var i = 0; i < spritePath.length-1; i++){
		var node1 = spritePath[i];
		var node2 = spritePath[i+1];
		var startR, startC, r, c;
		//Vertical Path
		if (node1.x === node2.x){
			startR = Math.max(0, Math.min(node1.y, node2.y) / gridDem - pathPadding);
			r = Math.min(boardDem/gridDem , Math.max(node1.y, node2.y) / gridDem + pathPadding);
			startC = node1.x/gridDem - pathPadding;
			c = startC + pathPadding * 2;
//		Horizontal Path
		}else{
			startR = node1.y/gridDem - pathPadding;
			r = node1.y/gridDem + pathPadding;
			startC = Math.min(node1.x, node2.x) / gridDem - pathPadding;
			c = Math.max(node1.x, node2.x) / gridDem + pathPadding;
		}

//		Make the grid locations for the path unplaceable for towers
		for (var t = Math.min(startR, r); t < Math.max(r, startR); t++){
			for(var x = Math.min(startC, c); x < Math.max(c, startC); x++){
				gridUsed[t][x] = true;
			}
		}
	}

//	Display initial state of menu variables	
	displayMenuVars();
	
//	Get the first wave of sprites ready for the game
	getSprites();

//	Add sprites to the q-tree	
//	addSpritesToQ();
	
	
//	Add tower buttons
	addTowerButton('Tower 1', 3, 3, 15, 10, 65, 225, 'blue');
	addTowerButton('Tower 2', 2, 2, 90, 7, 10, 75, '#B30BC6');
	
	//	Add button for starting next waves
	button = document.createElement('p'); 
//	button.innerHTML = 'Start Wave';
	img = document.createElement('img');
	button.setAttribute('class', 'startButton');
	img.src = 'play.png';
	img.id = 'start_button';
	button.appendChild(img);
	button.addEventListener('click', draw, false);
	gameControls.appendChild(button);
}