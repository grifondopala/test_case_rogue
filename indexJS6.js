class Game{

    ROWS_AMOUNT = 24;
    COLUMNS_AMOUNT = 40;
    HEALTH_GAIN_AMOUNT = 2;
    SWORD_GAIN_AMOUNT = 10;
    ENEMY_AMOUNT = 10;

    // Начальное здоровье и сила героя
    START_HERO_HEATH = 20;
    START_HERO_POWER = 5;
    
    // Начальное здоровье и сила врага
    START_ENEMY_HEALTH = 10;
    START_ENEMY_POWER = 2;

    // Добавление от меча
    GAIN_POWER = 1;
    // Добавление от зелья здоровья
    GAIN_HEALTH = 5;

    field = null;
    cells = [];
    freeCells = [];
    hero = null;
    enemies = [];

    isEnded = false;
    playAgain = null;

    healthBar = null;
    powerBar = null;

    init(){

        this.field = document.querySelector('.field-box > .field')

        // Заполнение карты стенами
        for(let i = 0; i < this.ROWS_AMOUNT; i++){
            let row = [];
            for(let j = 0; j < this.COLUMNS_AMOUNT; j++){
                let cell = new Cell(i, j);
                row.push(cell);
                this.field.appendChild(cell.cell);
            }
            this.cells.push(row);
        }

        // Генерация проходов
        let horizontalLinesNumber = this.generateRandomNumber(3, 5);
        for(let i = 0; i < horizontalLinesNumber; i++){
            let line = this.generateRandomNumber(0, this.ROWS_AMOUNT - 1);
            for(let j = 0; j < this.COLUMNS_AMOUNT; j++){
                this.cells[line][j].changeType("tile");
            }
        }

        let verticalLinesNumber = this.generateRandomNumber(3, 5);
        for(let i = 0; i < verticalLinesNumber; i++){
            let line = this.generateRandomNumber(0, this.COLUMNS_AMOUNT - 1);
            for(let j = 0; j < this.ROWS_AMOUNT; j++){
                this.cells[j][line].changeType("tile");
            }
        }

        this.findFreeCells();

        // Генерация комнат
        let numberRooms = this.generateRandomNumber(5, 10);
        for(let s = 0; s < numberRooms; s++){
            
            let roomWidth = this.generateRandomNumber(3, 8);
            let roomHeight = this.generateRandomNumber(3, 8);
            
            let cellIndex = this.generateRandomNumber(0, this.freeCells.length - 1);

            while(this.freeCells[cellIndex].column + roomWidth >= this.COLUMNS_AMOUNT || this.freeCells[cellIndex].row + roomHeight >= this.ROWS_AMOUNT){
                cellIndex = this.generateRandomNumber(0, this.freeCells.length - 1);
            }
            
            for(let i = 0; i < roomHeight; i++){
                for(let j = 0; j < roomWidth; j++){
                    this.cells[this.freeCells[cellIndex].row + i][this.freeCells[cellIndex].column + j].changeType("tile");
                }
            }
        }

        this.findFreeCells();

        // Генерация зельев здоровья
        this.generateGain("tileHP", this.HEALTH_GAIN_AMOUNT);

        // Генерация мечей
        this.generateGain("tileSW", this.SWORD_GAIN_AMOUNT);

        // Генерация героя
        let [heroRow, heroColumn] = this.getFreeCellParameters();
        this.hero = new Hero(heroRow, heroColumn, this.START_HERO_HEATH, this.START_HERO_POWER);
        this.cells[heroRow][heroColumn].changeType("tileP", 100)

        // Генерация врагов
        for(let i = 0; i < this.ENEMY_AMOUNT; i++){
            let [enemyRow, enemyColumn] = this.getFreeCellParameters();
            let enemy = new Enemy(enemyRow, enemyColumn, this.START_ENEMY_HEALTH, this.START_ENEMY_POWER);
            this.cells[enemyRow][enemyColumn].changeType("tileE", 100);
            this.enemies.push(enemy);
        }

        document.addEventListener('keydown', (event) => {
            this.makeStep(event);
        });

        // Меню перезапуска игры, появляющаяся при окончании игры
        this.playAgain = document.querySelector('.play-again')
        let againButton = this.playAgain.querySelector('button');
        againButton.onclick = () => {
            window.location.reload();
        }

        let inventory = document.querySelector('.field-box > .inventory');
        this.healthBar = inventory.querySelector('.health');
        this.powerBar = inventory.querySelector('.power');
        this.updateBars();

    }

    findFreeCells(){
        this.freeCells = [];
        for(let i = 0; i < this.ROWS_AMOUNT; i++){
            for(let j = 0; j < this.COLUMNS_AMOUNT; j++){
                if(this.cells[i][j].type === "tile"){
                    this.freeCells.push(this.cells[i][j]);
                }
            }
        }
    }

    generateRandomNumber(begin, end){
        return Math.floor(Math.random() * (end - begin + 1) + begin);
    }

    generateGain(type, amount){
        for(let i = 0; i < amount; i++){
            let index = this.generateRandomNumber(0, this.freeCells.length - 1);
            this.freeCells[index].changeType(type);
            this.freeCells.splice(index, 1);
        }
    }

    getFreeCellParameters(){
        let index = this.generateRandomNumber(0, this.freeCells.length - 1);
        let row = this.freeCells[index].row;
        let column = this.freeCells[index].column;
        this.freeCells.splice(index, 1);
        return [row, column];
    }

    makeStep(event){
        
        let directions = {
            'KeyA': [0, -1],
            'KeyW': [-1, 0],
            'KeyS': [1, 0],
            'KeyD': [0, 1],
            'Space': [],
        }

        if(!directions.hasOwnProperty(event.code) || this.isEnded) return;

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

        let newRow = this.hero.row + directions[event.code][0];
        let newColumn = this.hero.column + directions[event.code][1];

        if(this.checkBounderies(newRow, newColumn)){
            let cell = this.cells[newRow][newColumn];
            if(cell.type === 'tileW' || cell.type === 'tileE'){
                return;
            }
            if(cell.type === 'tileSW'){
                this.hero.addPower(this.GAIN_POWER);
                this.updateBars();
            }
            if(cell.type === 'tileHP'){
                this.hero.addHealth(this.GAIN_HEALTH);
                this.updateBars();
            }
            this.swapCells(newRow, newColumn, this.hero.row, this.hero.column, 'tileP', this.hero.percent_health)
            this.hero.changePosition(newRow, newColumn);
            this.makeEnemyStep();
        }

    }

    swapCells(newRow, newColumn, prevRow, prevColumn, newType, health, prevType){
        this.cells[newRow][newColumn].changeType(newType, health);
        if(newType === 'tileE'){
            this.cells[prevRow][prevColumn].changeType(prevType)
        }else{
            this.cells[prevRow][prevColumn].changeType('tile');
        }
    }

    damageEnemy(row, column){
        if(this.checkBounderies(row, column) && this.cells[row][column].type === 'tileE'){
            let index = this.enemies.findIndex(enemy => enemy.row === row && enemy.column === column)
            this.enemies[index].takeDamage(this.hero.power);
            if(this.enemies[index].health <= 0){
                this.enemies.splice(index, 1);
                this.cells[row][column].changeType('tile');
            }else{
                this.cells[row][column].changeHealthBar(this.enemies[index].percent_health)
            }
        }
    }

    makeEnemyStep(){

        for(let enemy of this.enemies){

            let check = this.checkHero(enemy.row, enemy.column);
            if(check){
                this.hero.takeDamage(enemy.power);
                if(this.hero.health <= 0){
                    this.endGame(false);
                }
                this.cells[this.hero.row][this.hero.column].changeHealthBar(this.hero.percent_health)
                this.updateBars();
                continue;
            }

            let directions = [
                [1, 0],
                [-1 ,0],
                [0, 1],
                [0, -1],
            ]
            
            while(directions.length > 0){
                let directionIndex = this.generateRandomNumber(0, directions.length - 1);
                let newRow = enemy.row + directions[directionIndex][0];
                let newColumn = enemy.column + directions[directionIndex][1];
                if(!this.checkBounderies(newRow, newColumn) || this.cells[newRow][newColumn].type === 'tileW' ||  this.cells[newRow][newColumn].type === 'tileE'){
                    directions.splice(directionIndex, 1);
                }else{
                    let prevType = enemy.prevCellType;
                    enemy.prevCellType = this.cells[newRow][newColumn].type
                    this.swapCells(newRow, newColumn, enemy.row, enemy.column, 'tileE', enemy.percent_health, prevType);
                    enemy.changePosition(newRow, newColumn);
                    break;
                }
            }
            
        }
    }

    checkHero(row, column){
        if(this.hero.row === row+1 && this.hero.column   === column) return true;
        if(this.hero.row === row-1 && this.hero.column   === column) return true;
        if(this.hero.row === row   && this.hero.column+1 === column) return true;
        if(this.hero.row === row   && this.hero.column-1 === column) return true;
        return false;
    }

    checkBounderies(row, column){
        return row >= 0 && row < this.ROWS_AMOUNT && column >= 0 && column < this.COLUMNS_AMOUNT;
    }

    endGame(sucсess){
        this.isEnded = true;
        this.playAgain.style.display = 'flex';
        let text = this.playAgain.querySelector('p');
        if(sucсess){
            text.innerHTML = 'Вы победили!'
        }else{
            text.innerHTML = 'Вы проиграли!'
        }
    }

    updateBars(){
        this.healthBar.innerHTML = 'Здоровье: ' + Math.floor(this.hero.percent_health) + '%';
        this.powerBar.innerHTML = 'Сила: ' + this.hero.power;
    }
}

class Cell{

    row = 0;
    column = 0;
    type = "tileW";
    cell = null;

    constructor(row, column){
        this.row = row;
        this.column = column;
        this.cell = document.createElement("div");
        this.cell.classList.add('tileW');
    }

    changeType(type, health){
        this.type = type;
        this.cell.classList = [type];
        if(type === 'tileP' || type === 'tileE'){
            let healthBar = document.createElement('div')
            healthBar.classList = ['health']
            healthBar.style.width = health + '%';
            this.cell.appendChild(healthBar);
        }else{
            this.cell.innerHTML = '';
        }
    }

    changeHealthBar(health){
        let healthBar = this.cell.querySelector('.health');
        healthBar.style.width = health + '%';
    }

}

class Person {

    row = 0;
    column = 0;
    health = 0;
    power = 0;
    max_health = 0;
    percent_health = 100;

    constructor(row, column, health, power){
        this.row = row;
        this.column = column;
        this.health = health;
        this.max_health = health;
        this.power = power;
    }

    changePosition(row, column){
        this.row = row;
        this.column = column;
    }

    takeDamage(damage){
        this.health -= damage;
        this.percent_health = this.health / this.max_health * 100;
    }

}

class Hero extends Person{

    addPower(gain){
        this.power += gain;
    }

    addHealth(gain){
        if(this.health + gain > this.max_health){
            this.health = this.max_health;
        }else{
            this.health += gain;
        }
        this.percent_health = this.health / this.max_health * 100;
    }

}

class Enemy extends Person{

    prevCellType = 'tile';

}