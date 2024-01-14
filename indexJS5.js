var Game = function(){

    this.ROWS_AMOUNT = 24;
    this.COLUMNS_AMOUNT = 40;
    this.HEALTH_GAIN_AMOUNT = 2;
    this.SWORD_GAIN_AMOUNT = 10;
    this.ENEMY_AMOUNT = 10;

    // Начальное здоровье и сила героя
    this.START_HERO_HEATH = 20;
    this.START_HERO_POWER = 5;
    
    // Начальное здоровье и сила врага
    this.START_ENEMY_HEALTH = 10;
    this.START_ENEMY_POWER = 2;

    // Добавление от меча
    this.GAIN_POWER = 1;
    // Добавление от зелья здоровья
    this.GAIN_HEALTH = 5;

    this.field = null;
    this.cells = [];
    this.freeCells = [];
    this.hero = null;
    this.enemies = [];

    this.isEnded = false;
    this.playAgain = null;

    this.init = function(){

        this.field = document.querySelector('.field-box > .field')

        //Заполнение карты стенами
        for(var i = 0; i < this.ROWS_AMOUNT; i++){
            var row = [];
            for(var j = 0; j < this.COLUMNS_AMOUNT; j++){
                var cell = new Cell(i, j);
                row.push(cell);
                this.field.appendChild(cell.cell);
            }
            this.cells.push(row);
        }

        var numberRooms = this.generateRandomNumber(5, 10);
        for(var s = 0; s < numberRooms; s++){
            
            var roomWidth = this.generateRandomNumber(3, 8);
            var roomHeight = this.generateRandomNumber(3, 8);
            
            var leftPointX = this.generateRandomNumber(0, this.COLUMNS_AMOUNT - 1);
            var leftPointY = this.generateRandomNumber(0, this.ROWS_AMOUNT - 1);

            while(leftPointX + roomWidth >= this.COLUMNS_AMOUNT || leftPointY + roomHeight >= this.ROWS_AMOUNT){
                leftPointX = this.generateRandomNumber(0, this.COLUMNS_AMOUNT - 1);
                leftPointY = this.generateRandomNumber(0, this.ROWS_AMOUNT - 1);
            }
            
            for(i = 0; i < roomHeight; i++){
                for(j = 0; j < roomWidth; j++){
                    this.cells[leftPointY + i][leftPointX + j].changeType("tile");
                }
            }
        }

        var horizontalLinesNumber = this.generateRandomNumber(3, 5);
        for(i = 0; i < horizontalLinesNumber; i++){
            var line = this.generateRandomNumber(0, this.ROWS_AMOUNT - 1);
            for(j = 0; j < this.COLUMNS_AMOUNT; j++){
                this.cells[line][j].changeType("tile");
            }
        }

        var verticalLinesNumber = this.generateRandomNumber(3, 5);
        for(i = 0; i < verticalLinesNumber; i++){
            line = this.generateRandomNumber(0, this.COLUMNS_AMOUNT - 1);
            for(j = 0; j < this.ROWS_AMOUNT; j++){
                this.cells[j][line].changeType("tile");
            }
        }

        for(i = 0; i < this.ROWS_AMOUNT; i++){
            for(j = 0; j < this.COLUMNS_AMOUNT; j++){
                if(this.cells[i][j].type === "tile"){
                    this.freeCells.push(this.cells[i][j]);
                }
            }
        }

        // Генерация зельев здоровья
        this.generateGain("tileHP", this.HEALTH_GAIN_AMOUNT);

        // Генерация мечей
        this.generateGain("tileSW", this.SWORD_GAIN_AMOUNT);

        // Генерация героя
        var freeCellParaperts = this.getFreeCellParameters();
        this.hero = new Hero(freeCellParaperts.row, freeCellParaperts.column, this.START_HERO_HEATH, this.START_HERO_POWER);
        this.cells[freeCellParaperts.row][freeCellParaperts.column].changeType("tileP", 100)

        // Генерация врагов
        for(i = 0; i < this.ENEMY_AMOUNT; i++){
            freeCellParaperts = this.getFreeCellParameters();
            var enemy = new Enemy(freeCellParaperts.row, freeCellParaperts.column, this.START_ENEMY_HEALTH, this.START_ENEMY_POWER);
            this.cells[freeCellParaperts.row][freeCellParaperts.column].changeType("tileE", 100);
            this.enemies.push(enemy);
        }

        document.addEventListener('keydown', this.makeStep.bind(this));

        this.playAgain = document.querySelector('.play-again')
        var againButton = this.playAgain.querySelector('button');
        againButton.onclick = function(){
            window.location.reload();
        }

    }

    this.generateRandomNumber = function(begin, end){
        return Math.floor(Math.random() * (end - begin + 1) + begin);
    }

    this.generateGain = function(type, amount){
        for(var i = 0; i < amount; i++){
            var index = this.generateRandomNumber(0, this.freeCells.length - 1);
            this.freeCells[index].changeType(type);
            this.freeCells.splice(index, 1);
        }
    }

    this.getFreeCellParameters = function(){
        var index = this.generateRandomNumber(0, this.freeCells.length - 1);
        var row = this.freeCells[index].row;
        var column = this.freeCells[index].column;
        this.freeCells.splice(index, 1);
        return {row: row, column: column};
    }

    this.makeStep = function(event){
        
        var directions = {
            'KeyA': [0, -1],
            'KeyW': [-1, 0],
            'KeyS': [1, 0],
            'KeyD': [0, 1],
            'Space': [],
        }

        if(!(event.code in directions) || this.isEnded) return;

        // Герой бьет по соседним клеткам (без диагонали)
        if(event.code === 'Space'){
            this.damageEnemy(this.hero.row-1, this.hero.column);
            this.damageEnemy(this.hero.row+1, this.hero.column);
            this.damageEnemy(this.hero.row, this.hero.column-1);
            this.damageEnemy(this.hero.row, this.hero.column+1);
            if(this.enemies.length === 0) this.endGame(true);
            this.makeEnemyStep();
            return;
        }

        var newRow = this.hero.row + directions[event.code][0];
        var newColumn = this.hero.column + directions[event.code][1];
        
        if(this.checkBounderies(newRow, newColumn)){
            var cell = this.cells[newRow][newColumn];
            if(cell.type === 'tileW' || cell.type === 'tileE'){
                return;
            }
            if(cell.type === 'tileSW'){
                this.hero.addPower(this.GAIN_POWER);
            }
            if(this.cells[newRow][newColumn].type === 'tileHP'){
                this.hero.addHealth(this.GAIN_HEALTH);
            }
            this.swapCells(newRow, newColumn, this.hero.row, this.hero.column, 'tileP', this.hero.percent_health)
            this.hero.changePosition(newRow, newColumn);
            this.makeEnemyStep();
        }

    }

    this.swapCells = function(newRow, newColumn, prevRow, prevColumn, newType, health, prevType){
        this.cells[newRow][newColumn].changeType(newType, health);
        if(newType === 'tileE'){
            this.cells[prevRow][prevColumn].changeType(prevType)
        }else{
            this.cells[prevRow][prevColumn].changeType('tile');
        }
    }

    this.damageEnemy = function(row, column){
        if(this.checkBounderies(row, column) && this.cells[row][column].type === 'tileE'){
            var index = this.enemies.findIndex(function(enemy){
                return enemy.row === row && enemy.column === column
            })
            this.enemies[index].takeDamage(this.hero.power);
            if(this.enemies[index].health <= 0){
                this.enemies.splice(index, 1);
                this.cells[row][column].changeType('tile');
            }else{
                this.cells[row][column].changeHealthBar(this.enemies[index].percent_health)
            }
        }
    }

    this.makeEnemyStep = function(){

        for(var i = 0; i < this.enemies.length; i++){

            var enemy = this.enemies[i];

            var check = this.checkHero(enemy.row, enemy.column);
            if(check){
                this.hero.takeDamage(enemy.power);
                if(this.hero.health <= 0){
                    this.endGame(false);
                }
                this.cells[this.hero.row][this.hero.column].changeHealthBar(this.hero.percent_health)
                continue;
            }

            var directions = [
                [1, 0],
                [-1 ,0],
                [0, 1],
                [0, -1],
            ]
            
            while(directions.length > 0){
                var directionIndex = this.generateRandomNumber(0, directions.length - 1);
                var newRow = enemy.row + directions[directionIndex][0];
                var newColumn = enemy.column + directions[directionIndex][1];
                if(!this.checkBounderies(newRow, newColumn) || this.cells[newRow][newColumn].type === 'tileW' ||  this.cells[newRow][newColumn].type === 'tileE'){
                    directions.splice(directionIndex, 1);
                }else{
                    var prevType = enemy.prevCellType;
                    enemy.prevCellType = this.cells[newRow][newColumn].type
                    this.swapCells(newRow, newColumn, enemy.row, enemy.column, 'tileE', enemy.percent_health, prevType);
                    enemy.changePosition(newRow, newColumn);
                    break;
                }
            }
            
        }
    }

    this.checkHero = function(row, column){
        if(this.hero.row === row+1 && this.hero.column   === column) return true;
        if(this.hero.row === row-1 && this.hero.column   === column) return true;
        if(this.hero.row === row   && this.hero.column+1 === column) return true;
        if(this.hero.row === row   && this.hero.column-1 === column) return true;
        return false;
    }

    this.checkBounderies = function(row, column){
        return row >= 0 && row < this.ROWS_AMOUNT && column >= 0 && column < this.COLUMNS_AMOUNT;
    }

    this.endGame = function(sucсess){
        this.isEnded = true;
        this.playAgain.style.display = 'flex';
        var text = this.playAgain.querySelector('p');
        if(sucсess){
            text.innerHTML = 'Вы победили!'
        }else{
            text.innerHTML = 'Вы проиграли!'
        }
    }

}


var Cell = function(row, column){

    this.row = row;
    this.column = column;
    this.type = "tileW";

    this.cell = document.createElement("div");
    this.cell.classList.add('tileW');
    
    this.changeType = function(type, health){
        this.type = type;
        this.cell.classList = [type];
        if(type === 'tileP' || type === 'tileE'){
            var healthBar = document.createElement('div')
            healthBar.classList = ['health']
            healthBar.style.width = health + '%';
            this.cell.appendChild(healthBar);
        }else{
            this.cell.innerHTML = '';
        }
    }

    this.changeHealthBar = function(health){
        var healthBar = this.cell.querySelector('.health');
        healthBar.style.width = health + '%';
    }
}

var Person = function(row, column, health, power) {

    this.row = row;
    this.column = column;
    this.health = health;
    this.max_health = health;
    this.power = power;
    this.percent_health = 100;

    this.changePosition = function(row, column){
        this.row = row;
        this.column = column;
    }

    this.takeDamage = function(damage){
        this.health -= damage;
        this.percent_health = this.health / this.max_health * 100;
    }

}

var Hero = function(row, column, health, power){

    Person.call(this, row, column, health, power)

    this.addPower = function(gain){
        this.power += gain;
    }

    this.addHealth = function(gain){
        if(this.health + gain > this.max_health){
            this.health = this.max_health;
        }else{
            this.health += gain;
        }
        this.percent_health = this.health / this.max_health * 100;
    }

}

var Enemy = function(row, column, health, power){

    this.prevCellType = 'tile';

    Person.call(this, row, column, health, power)

}
