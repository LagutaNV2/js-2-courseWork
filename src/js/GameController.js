import GamePlay from './GamePlay';

import themes from './themes';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import cursors from './cursors';

import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.boardSize = 8; // Размер игрового поля (например, 8x8)

    this.playerTeam = [];
    this.enemyTeam = [];
    this.positions = []; // Для хранения позиций всех персонажей
    this.occupiedPositions = []; // Занятые позиции
    this.selectedCharacter = null; // Хранит выбранного персонажа
    this.currentThemeIndex = 0;
  }

  /**
   * Инициализация игры
   * Устанавливает начальные параметры игры и отображает интерфейс
   */
  init() {
    console.log('start');
    this.gamePlay.drawUi(themes.prairie);  // Устанавливаем тему интерфейса
    this.createTeams();                   // Генерируем команды
    this.redrawPositions();              // Отображаем персонажей на поле
    this.addEventListeners();
  }

  /**
   * Генерирует команды игрока и соперника
   */
  createTeams() {
    const playerTypes = [Bowman, Swordsman, Magician];
    const enemyTypes = [Vampire, Undead, Daemon];
    const maxLevel = 4;
    const teamSize = 2;

    const playerCharacters = generateTeam(playerTypes, maxLevel, teamSize);
    const enemyCharacters = generateTeam(enemyTypes, maxLevel, teamSize);

    this.playerTeam = this.placeTeam(playerCharacters, [0, 1]); // Столбцы для игроков
    this.enemyTeam = this.placeTeam(enemyCharacters, [6, 7]); // Столбцы для врагов
    console.log('this.enemyTeam =', this.enemyTeam);

    // Обновляем занятые позиции после размещения всех персонажей
    this.updateOccupiedPositions();

    this.positions = [...this.playerTeam, ...this.enemyTeam]; // Объединяем все позиции

    console.log('this.positions =', this.positions);
  }

  /**
   * Обновление массива занятых позиций
   */
  updateOccupiedPositions() {
    this.occupiedPositions = this.positions.map((pos) => pos.position);
  }


   /**
   * Размещает команду на указанных столбцах
   * @param {Array} characters - Массив персонажей
   * @param {Array} columns - Столбцы для размещения персонажей
   * @returns {Array} Массив PositionedCharacter
   */
  placeTeam(characters, columns) {
    const positionedCharacters = [];
    const positions = this.generatePositions(columns);

    characters.forEach((character) => {
      let position;
      do {
        position = positions.pop();
      } while (this.occupiedPositions.includes(position)); // Проверка занятости

        const positionedCharacter = new PositionedCharacter(character, position);

        this.positions.push(positionedCharacter); // Добавляем в общий массив позиций
        positionedCharacters.push(positionedCharacter);
        this.updateOccupiedPositions(); // Обновляем занятые позиции
      });

    return positionedCharacters;
  }

  /**
   * Генерирует массив доступных позиций на поле
   * @param {Array} columns - Столбцы для размещения
   * @returns {Array} Массив доступных позиций
   */
  generatePositions(columns) {
    const positions = [];
    for (let i = 0; i < this.boardSize; i++) {
      columns.forEach((column) => {
        positions.push(i * this.boardSize + column);
      });
    }
    return this.shuffleArray(positions);
  }

  /**
   * Перемешивает массив позиций
   * @param {Array} array - Массив позиций
   * @returns {Array} Перемешанный массив
   */
  shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  /**
   * Отображаем всех персонажей на игровом поле
   */
  redrawPositions() {
    this.gamePlay.redrawPositions(this.positions);

    // Проверяем окончание игры
    if (this.checkGameOver()) {
      return;
    }
  }

  levelUpCharacters() {
    this.playerTeam.forEach((positionedCharacter) => {
      const { character } = positionedCharacter;
      character.level += 1;
      character.health = Math.min(100, character.level + 80);
      character.attack = Math.max(
        character.attack,
        character.attack * (80 + character.health) / 100
      );
      character.defence = Math.max(
        character.defence,
        character.defence * (80 + character.health) / 100
      );
    });
  }

  startNextLevel() {
    this.currentThemeIndex = (this.currentThemeIndex + 1) % Object.keys(themes).length;
    const theme = Object.values(themes)[this.currentThemeIndex];
    this.gamePlay.drawUi(theme);

    this.createTeams();
    this.redrawPositions();
  }

  /**
   * Форматирует информацию о персонаже и вывод иконок-эмодзи
   * @param {Object} character - Объект персонажа
   * @returns {string} Отформатированная строка с информацией
   */
  formatCharacterInfo(character) {
    return `🎖${character.level} ⚔${character.attack} 🛡${character.defence} ❤${character.health}`;
  }


  /**
   * Перемещение персонажа
   */
  moveCharacter(positionedCharacter, newPosition) {
    // Удаляем старую позицию из occupiedPositions
    this.occupiedPositions = this.occupiedPositions.filter(
      (pos) => pos !== positionedCharacter.position
    );

    // Обновляем позицию персонажа
    positionedCharacter.position = newPosition;

    // Добавляем новую позицию в occupiedPositions
    this.occupiedPositions.push(newPosition);

    // Обновляем массив positions
    this.updateOccupiedPositions();
  }

  /**
   * Логика атаки в классе GameController, с использованием метода showDamage из GamePlay.
   * Включает расчет урона, обновление здоровья атакованного персонажа и анимацию урона.
   * После "убийства" персонажа обновляет занятые позиции.
   * @param {*} attacker
   * @param {*} targetPosition
   * @param {string} turn - Текущий ход ('player' или 'enemy').
   */
  async attack(attacker, targetPosition, turn = 'player') {
    const target = this.positions.find((pos) => pos.position === targetPosition);
    if (!target) {
      throw new Error('Target not found');
    }

    const damage = Math.max(
      attacker.attack - target.character.defence,
      attacker.attack * 0.1
    );

    target.character.health -= damage;

    // Показываем анимацию урона
    await this.gamePlay.showDamage(targetPosition, damage);

    if (target.character.health <= 0) {
      // Удаляем "убитого" персонажа
      this.positions = this.positions.filter((pos) => pos !== target);
      this.updateOccupiedPositions();

      //???
      if (this.isEnemy(target.character)) {
        this.enemyTeam = this.enemyTeam.filter((enemy) => enemy !== target);
      } else {
        this.playerTeam = this.playerTeam.filter((player) => player !== target);
      }
    }

    // Проверяем завершение игры
    if (this.checkGameOver()) {
      return;
    }

    this.redrawPositions();
  }

  /**
   Логика хода компьютера: выбирается ближайший персонаж игрока.
   */
  async enemyTurn() {
    console.log('Начало хода врага');

    // Проверяем, остались ли враги
    if (this.enemyTeam.length === 0) {
      console.log('У противника нет персонажей. Ход пропускается.');
      return;
    }

    // Находим всех персонажей игрока
    const playerCharacters = this.positions.filter((pos) =>
      this.playerTeam.some((playerPos) => playerPos === pos)
    );

    console.log(`Находим всех персонажей игрока: ${playerCharacters.map((pc) => pc.character.type)}`);

    if (playerCharacters.length === 0) {
      GamePlay.showMessage('Все персонажи игрока уничтожены. Вы проиграли.');
      return;
    }

    // Стратегия: атака самого ближайшего игрока
    let bestAttack = null;

    // Находим атаку с минимальной дистанцией
    for (const enemy of this.enemyTeam) {
      const attackRange = this.getAttackRange(enemy.character, enemy.position, false);
      for (const player of playerCharacters) {
        if (attackRange.includes(player.position)) {
          const distance = Math.abs(enemy.position - player.position);
          if (!bestAttack || distance < bestAttack.distance) {
            bestAttack = { enemy, target: player, distance };
          }
        }
      }
    }

    if (bestAttack) {
      console.log(
        `Враг ${bestAttack.enemy.character.type} на позиции ${bestAttack.enemy.position} атакует игрока ${bestAttack.target.character.type} на позиции ${bestAttack.target.position}`
      );
      console.log(`до атаки 🎖${bestAttack.target.character.level} ⚔${bestAttack.target.character.attack} 🛡${bestAttack.target.character.defence} ❤${bestAttack.target.character.health}`);
      await this.attack(bestAttack.enemy.character, bestAttack.target.position, 'enemy');
      console.log(`после атаки 🎖${bestAttack.target.character.level} ⚔${bestAttack.target.character.attack} 🛡${bestAttack.target.character.defence} ❤${bestAttack.target.character.health}`);

      return;
    }

    console.log('Враг не может атаковать, выполняется перемещение');
    const enemyToMove = this.enemyTeam[0];
    const moveRange = this.getMoveRange(enemyToMove.character, enemyToMove.position);

    if (moveRange.length > 0) {
      const targetPosition = moveRange[0];
      console.log(
        `Враг перемещается с позиции ${enemyToMove.position} на позицию ${targetPosition}`
      );
      this.moveCharacter(enemyToMove, targetPosition);
      this.redrawPositions();
    }


    // Передаём ход игроку
    console.log('Передаём ход игроку');
    this.currentTurn = 'player';
  }


  /**
 * Логика хода игрока
 */
  async playerTurn(index) {
    console.log('Начало хода игрока');
    if (this.currentTurn !== 'player') {
      GamePlay.showError('Сейчас ходит враг!');
      return;
    }

    const positionedCharacter = this.positions.find((pos) => pos.position === index);

    // Если выбран персонаж игрока
    if (positionedCharacter && this.playerTeam.some((player) => player.position === index)) {
      if (this.selectedCharacter) {
        this.gamePlay.deselectCell(this.selectedCharacter.position);
      }
      this.selectedCharacter = positionedCharacter;
      this.gamePlay.selectCell(index, 'yellow');
      return;
    }

    // Если атакуем врага
    if (this.selectedCharacter) {
      const attackRange = this.getAttackRange(this.selectedCharacter.character, this.selectedCharacter.position);

      if (attackRange.includes(index) && this.enemyTeam.some((enemy) => enemy.position === index)) {

        // const target = this.positions.find((pos) => pos.position === index);
        // console.log(`tearget ${target.caracter.type} атакован ${this.selectedCharacter.character.type}`);
        await this.attack(this.selectedCharacter.character, index, 'player');

        this.selectedCharacter = null;

        return;
      }

      // Если перемещаемся
      const moveRange = this.getMoveRange(this.selectedCharacter.character, this.selectedCharacter.position);

      if (moveRange.includes(index) && !this.occupiedPositions.includes(index)) {
        this.moveCharacter(this.selectedCharacter, index);
        this.selectedCharacter = null;

        // Передаём ход врагу
        this.currentTurn = 'enemy';
        // await this.enemyTurn();
        return;
      }
    }

    GamePlay.showError('Невозможно выполнить действие.');
  }



  addEventListeners() {
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
  }

  onCellClick = async (index) => {
    console.log(`Клик по клетке с индексом ${index}`);
    const positionedCharacter = this.positions.find((pos) => pos.position === index);

    // Если персонажа нет в выбранной ячейке, но есть выбранный ранее игрок ---> попытка хода
    if (!positionedCharacter && this.selectedCharacter) {
      const moveRange = this.getMoveRange(this.selectedCharacter.character, this.selectedCharacter.position);

      // Если клик в пределах допустимого диапазона перемещения --> ход
      if (moveRange.includes(index)) {
        this.gamePlay.deselectCell(this.selectedCharacter.position);
        this.moveCharacter(this.selectedCharacter, index);
        this.selectedCharacter = null;
        this.redrawPositions();

        // Переход хода к врагу
        this.currentTurn = 'enemy';
        console.log(`Ход передан врагу. Текущий ход: ${this.currentTurn}`);
        await this.enemyTurn();

        return;
      }

      // клик вне допустимого диапазона  --> сообщение об ошибке
      GamePlay.showError('Невозможно переместиться на эту клетку.');   // --->  ошибка
      return;
    }

    // Если персонажа нет в выбранной ячейке, и нет выбранного ранее игрока
    if (!positionedCharacter) {
      GamePlay.showError('В этой ячейке нет персонажа.');
      return;
    }

    // Если есть выбранный персонаж
    const character = positionedCharacter.character;
    const playerTypes = [Bowman, Swordsman, Magician];

    if (this.selectedCharacter) {
      const attackRange = this.getAttackRange(this.selectedCharacter.character, this.selectedCharacter.position);

      // Если клик в пределах допустимого диапазона атаки (клик на врага)
      if (attackRange.includes(index) && this.enemyTeam.some((enemy) => enemy.position === index)) {
        const attacker = this.selectedCharacter.character;
        const target = positionedCharacter.character;
        const damage = Math.max(attacker.attack - target.defence, attacker.attack * 0.1);

        console.log(`Вы атакуете персонажа: ${target.type} на позиции ${index}, урон ${damage}`);
        target.health -= damage;

        // Анимация урона и обновление позиций
        await this.gamePlay.showDamage(index, damage);

        if (target.health <= 0) {
          this.positions = this.positions.filter((pos) => pos !== positionedCharacter);
          console.log('убили', target.type, 'this.positions', this.positions);
          this.updateOccupiedPositions();

          const enemys = this.positions.filter((pos)=>
              this.enemyTeam.some((enemy)=>enemy.position === pos.position));
          console.log ('enemys после атаки', enemys);
          if (enemys.length === 0) {
            console.log('всех на этом уровне врагов уничтожили, вызываем this.startNextLevel()');
            this.currentTurn = 'player';
            this.startNextLevel()

          }
        }

        this.redrawPositions();

        // Переход хода к врагу
        this.currentTurn = 'enemy';
        console.log(`Ход передан врагу. Текущий ход: ${this.currentTurn}`);
        await this.enemyTurn();

        return;
      }

      // Если игрок кликает на другого персонажа из своей команды
      if (playerTypes.includes(character.constructor)) {
        this.gamePlay.deselectCell(this.selectedCharacter.position);
        this.selectedCharacter = positionedCharacter; // Обновить выбранного персонажа
        this.gamePlay.selectCell(index, 'yellow');
        console.log(`Вы переключились на персонажа: ${character.constructor.name} на позиции ${index}`);
        return;
      }

      GamePlay.showError('Невозможно выполнить действие.');
      return;
    }

    // Проверка принадлежности персонажа игроку
    if (!playerTypes.includes(character.constructor)) {
      GamePlay.showError('Этот персонаж не принадлежит вам.');
      return;
    }

    // Если персонаж игрока найден, снять предыдущее выделение и выделить текущий
    if (this.selectedCharacter) {
      this.gamePlay.deselectCell(this.selectedCharacter.position);
    }

    this.selectedCharacter = positionedCharacter; // Сохраняем выделенного персонажа
    this.gamePlay.selectCell(index, 'yellow');

    console.log(`Вы выбрали персонажа: ${character.constructor.name} на позиции ${index}`);
  }


  onCellEnter(index) {
    // console.log(`Наведение мыши на клетку с индексом ${index}`);
    const positionedCharacter = this.positions.find((pos) => pos.position === index);
    const { selectedCharacter } = this;

    // Если в ячейке есть персонаж
    if (positionedCharacter) {
      const characterInfo = this.formatCharacterInfo(positionedCharacter.character);
      this.gamePlay.showCellTooltip(characterInfo, index);

      const isPlayerCharacter = this.playerTeam.some((pos) => pos.position === index);

      if (isPlayerCharacter) {
        this.gamePlay.setCursor(cursors.pointer);
      } else if (selectedCharacter) {
        const attackRange = this.getAttackRange(selectedCharacter.character, selectedCharacter.position);

        if (attackRange.includes(index)) {
          this.gamePlay.setCursor(cursors.crosshair);
          this.gamePlay.selectCell(index, 'red');
        } else {
          this.gamePlay.setCursor(cursors.notallowed);
        }
      }
      return;
    }

    // Если персонажа в ячейке нет, но есть выбранный персонаж
    if (selectedCharacter) {
      const moveRange = this.getMoveRange(selectedCharacter.character, selectedCharacter.position);

      if (moveRange.includes(index)) {
        this.gamePlay.setCursor(cursors.pointer);
        this.gamePlay.selectCell(index, 'green');
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
      }

      // Обеспечиваем сохранение жёлтой подсветки
      this.gamePlay.selectCell(selectedCharacter.position, 'yellow');
    } else {
      this.gamePlay.setCursor(cursors.auto);
    }
  }

  onCellLeave(index) {
    // console.log(`Уход мыши с клетки с индексом ${index}`);
    // Реакция на уход мыши (TODO)
    this.gamePlay.hideCellTooltip(index); // Скрытие подсказки
    this.gamePlay.deselectCell(index); // Убираем подсветку
  }


  /**
 * Получить допустимые ходы для персонажа
 * @param {Object} character - Персонаж
 * @param {number} position - Текущая позиция персонажа
 * @returns {Array} Массив индексов допустимых клеток
 */
  getMoveRange(character, position, log = false) {
    const distance = this.getMoveDistance(character);
    if (log) {
      console.log('для position:', position, 'персонаж:', character, 'distance:', distance);
    }
    return this.getRange(position, distance);
  }

  /**
   * Получить радиус атаки персонажа
   * @param {Object} character - Персонаж
   * @param {number} position - Текущая позиция персонажа
   * @returns {Array} Массив индексов допустимых клеток для атаки
   */
  getAttackRange(character, position) {
    const distance = this.getAttackDistance(character);

    return this.getRangeAt(position, distance);
  }

  /**
   * Получить радиус для перемещения
   * Учитывает обновлённые позиции сразу после "убийства"
   * @param {number} position - Текущая позиция
   * @param {number} distance - Дистанция перемещения
   * @returns {Array} Массив доступных индексов
   */
  getRange(position, distance) {
    console.log('Текущие занятые позиции:', this.occupiedPositions);

    const range = [];
    const boardSize = this.boardSize;

    const startRow = Math.floor(position / boardSize);
    const startCol = position % boardSize;

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isWithinRange =
          Math.abs(row - startRow) <= distance &&
          Math.abs(col - startCol) <= distance &&
          (Math.abs(row - startRow) === Math.abs(col - startCol) ||
          row === startRow || col === startCol);

          const index = row * boardSize + col;

          if (isWithinRange && !this.occupiedPositions.includes(index)) {
            range.push(index); // Исключаем занятые позиции
          }
      }
    }
    console.log('Массив индексов для хода:', range, 'position:', position);
    return range;
  }

  /**
   * Получить радиус для атаки ("квадрат")
   * @param {number} position - Текущая позиция
   * @param {number} distance - Дистанция
   * @returns {Array} Массив индексов в пределах радиуса
   */
  getRangeAt(position, distance) {
    const attackRange = [];
    const boardSize = this.boardSize;

    const startRow = Math.floor(position / boardSize);
    const startCol = position % boardSize;

    const minRow = Math.max(0, startRow - distance);
    const maxRow = Math.min(boardSize - 1, startRow + distance);
    const minCol = Math.max(0, startCol - distance);
    const maxCol = Math.min(boardSize - 1, startCol + distance);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const index = row * boardSize + col;
        attackRange.push(index);
      }
    }

    console.log('Массив индексов для атаки:', attackRange, 'position:', position);
    return attackRange;
  }


  /**
   * Получить дистанцию перемещения для типа персонажа
   * @param {Object} character - Персонаж
   * @returns {number} Дистанция перемещения
   */
  getMoveDistance(character) {
    switch (character.constructor) {
      case Swordsman:
      case Undead:
        return 4;
      case Bowman:
      case Vampire:
        return 2;
      case Magician:
      case Daemon:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Получить дистанцию атаки для типа персонажа
   * @param {Object} character - Персонаж
   * @returns {number} Дистанция атаки
   */
  getAttackDistance(character) {
    switch (character.constructor) {
      case Swordsman:
      case Undead:
        return 1;
      case Bowman:
      case Vampire:
        return 2;
      case Magician:
      case Daemon:
        return 4;
      default:
       return 0;
    }
  }

  /**
   * Проверка принадлежности персонажа противнику
   */
  isEnemy(character) {
    return this.enemyTeam.some((pos) => pos.character === character);
  }

  checkGameOver() {
    if (this.enemyTeam.length === 0) {
      GamePlay.showMessage('Раунд завершен. Переход на следующий уровень!');
      this.levelUpCharacters();
      this.startNextLevel();
      return true; // Завершаем текущий процесс
    }

    if (this.playerTeam.length === 0) {
      GamePlay.showMessage('Вы проиграли. Игра окончена!');
      return true; // Завершаем текущий процесс
    }

    return false; // Игра продолжается
  }


}
