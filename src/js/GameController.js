import GamePlay from './GamePlay';
import GameState from './GameState';

import themes from './themes';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import cursors from './cursors';
import Character from './Character';

import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';

const characterTypeMap = {
  bowman: Bowman,
  swordsman: Swordsman,
  magician: Magician,
  vampire: Vampire,
  undead: Undead,
  daemon: Daemon,
};

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.gameState = new GameState();
    this.boardSize = 8;

    this.playerTeam = [];
    this.enemyTeam = [];
    this.maxScore = 0;
    this.scoresReset = false; // resetCurrentScore() был вызван хотя бы раз
    this._initializeBaseState();
  }

  _initializeBaseState() {
    this.positions = [];
    this.occupiedPositions = [];
    this.selectedCharacter = null;
    this.currentThemeIndex = 0;
    this.currentTurn = 'player';
    this.currentScore = 0;
  }

  _initializeGame(isNewGame = false) {
    this._initializeBaseState();

    this.isGameOver = false;
    this.updateScoreDisplay();

    if (isNewGame) {
      this.resetCurrentScore();
    }

    this.playerTeam = [];
    this.enemyTeam = [];
    this.createTeams(2, 2);
    this.resetAllCharacters();

    console.log('stateService:', this.stateService);

    let savedState;
    try {
      savedState = this.stateService.load();
    } catch (error) {
      console.error('Ошибка загрузки состояния:', error);
      savedState = null;
    }

    console.log('Состояние после загрузки:', savedState);

    try {
      this.maxScore = savedState.maxScore;
    } catch (error) {
      console.error('Ошибка загрузки рекорда:', error);
      this.maxScore = 0;
    };
    console.log(`Максимальный счёт после загрузки: ${this.maxScore}`);
    this.updateScoreDisplay();

    const scoreBoard = document.querySelector('.score-board');
    let scoreBoardContent = '';
    if (scoreBoard) {
      scoreBoardContent = scoreBoard.outerHTML;
      scoreBoard.remove();
    }

    console.log('Создание новой игры...');

    this.gamePlay.drawUi(themes.prairie);
    if (scoreBoardContent) {
      this.gamePlay.container.insertAdjacentHTML('beforeend', scoreBoardContent);
    }

    this.redrawPositions();
    this.addEventListeners();
    this.addButtonListeners();
  }

  init() {
    console.log('start');
    this.createScoreBoard();
    this._initializeGame(false); // false - start не по кнопке New game
  }

  initNewGame() {
    GamePlay.showMessage('Новая игра началась!');
    this._initializeGame(true); // true - это игра по кнопке New game
  }

  resetAllCharacters() {
    this.positions.forEach((positionedCharacter) => {
      const character = positionedCharacter.character;

      // Сбрасываем свойства для каждого персонажа
      character.level = 1;
      character.health = 50;

      switch (character.constructor) {
        case Bowman:
          character.attack = 25;
          character.defence = 25;
          break;
        case Swordsman:
          character.attack = 40;
          character.defence = 10;
          break;
        case Magician:
          character.attack = 10;
          character.defence = 40;
          break;
        case Vampire:
          character.attack = 25;
          character.defence = 25;
          break;
        case Undead:
          character.attack = 40;
          character.defence = 10;
          break;
        case Daemon:
          character.attack = 10;
          character.defence = 10;
          break;
        default:
          throw new Error('Unknown character type');
      }
    });
  }

  /**
   * Генерирует команды игрока и соперника
   */
  createTeams(playerCount, enemyCount) {
    this.playerTeam = this.placeTeam(
      generateTeam([Bowman, Swordsman, Magician], 1, playerCount),
      [0, 1]
    );

    this.enemyTeam = this.placeTeam(
      generateTeam([Vampire, Undead, Daemon], 1, enemyCount),
      [6, 7]
    );

    this.positions = [...this.playerTeam, ...this.enemyTeam];

    console.log('this.positions =', this.positions);
    console.log('this.enemyTeam =', this.enemyTeam);
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
    return characters.map((character) => {
      const position = this.getRandomPosition(columns);
      const positionedCharacter = new PositionedCharacter(character, position);
      this.positions.push(positionedCharacter);
      this.updateOccupiedPositions();
      console.log('Placed character:', positionedCharacter);
      return positionedCharacter;
    });
  }

  /**
   * Возвращает случайную доступную позицию.
   * @param {Array} columns - Столбцы для выбора.
   * @returns {number} Случайная позиция.
   */
  getRandomPosition(columns) {
    const positions = this.generatePositions(columns);
    let position;
    do {
      position = positions.pop();
    } while (this.occupiedPositions.includes(position));
    return position;
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
    return positions.sort(() => Math.random() - 0.5);
  }

  levelUpCharacter(character, levels = 1) {
    for (let i = 0; i < levels; i++) {
      console.log('повышаем:', character.type);
      console.log(`вх. показатели: 🎖${character.level} ⚔${character.attack} 🛡${character.defence} ❤${character.health}`);

      character.level += 1;

      // Повышение показателей атаки/защиты:
      character.attack = Math.max(
            character.attack,
            Math.round(character.attack * (80 + character.health) / 100)
        );

      character.defence = Math.max(
        character.defence,
        character.defence * (80 + character.health) / 100
      );

      // Показатель health приводится к значению: текущий уровень + 80 (но не более 100).
      character.health = Math.min(100, character.level + 80);

      console.log(`вых. показатели: 🎖${character.level} ⚔${character.attack} 🛡${character.defence} ❤${character.health}`);

    }
  }

  /**
   * Отображаем всех персонажей на игровом поле
   */
  redrawPositions() {
    if (this.isGameOver) {
      console.log('Игра завершена. Перерисовка заблокирована.');
      return;
    }

    if (this.checkGameOver()) {  // здесь обновляется this.enemyTeam и this.playerTeam
      return;
    }

    console.log('Перерисовка позиций. Текущие позиции:', this.positions);
    this.gamePlay.redrawPositions(this.positions);

    const scoreBoard = document.querySelector('.score-board');
    if (scoreBoard && !document.body.contains(scoreBoard)) {
      console.warn('.score-board был удалён, добавляем обратно.');
      this.gamePlay.container.appendChild(scoreBoard);
    }
    console.log('Вызов updateScoreDisplay из redrawPositions');
    this.updateCurrentScore(); // Обновляем счёт после каждого хода
  }

  /**
  * Проверка статуса игры
  */
  checkGameOver() {
    console.log('<<<  Проверка завершения игры  >>>');
    this.updateTeamStatus();
    if (this.enemyTeam.length === 0 && this.playerTeam.length > 0) {
      this.handleVictory();
    }
    if (this.playerTeam.length === 0) {
      this.handleDeath();
    }
    return false; // раунд продолжается, игра не завершена

  }

  updateTeamStatus() {
    this.enemyTeam = this.positions.filter((pos) =>
      this.enemyTeam.some((enemy) => enemy.character === pos.character)
    );
    this.playerTeam = this.positions.filter((pos) =>
      this.playerTeam.some((player) => player.character === pos.character)
    );
  }

  handleVictory() {
    if (this.currentThemeIndex === 3) {
      console.log('Игра завершена, обновляем рекорд');

      if (this.currentScore > this.maxScore) {
        console.log(`Новый рекорд! Старый рекорд: ${this.maxScore}, новый: ${this.currentScore}`);
        this.maxScore = this.currentScore;
        this.saveMaxScore();
      }

      this.updateScoreDisplay();
      GamePlay.showMessage('Поздравляем! Вы завершили все уровни!');
      this.blockGameField();
      this.isGameOver = true;
      return true;
    }
    GamePlay.showMessage('Раунд завершен, обновляем текущий счёт. Переход на следующий уровень!');
    this.updateCurrentScore();
    this.updateScoreDisplay();
    this.startNextLevel();
    return true;
  }

  handleDeath() {
    console.log('Игра завершена, игрок проиграл.');
    this.updateCurrentScore(); // Пересчёт очков при проигрыше
    GamePlay.showMessage('Вы проиграли. Игра окончена!');
    this.blockGameField();
    this.isGameOver = true;
    return true;
  }

  blockGameField() {
    try {
        this.removeCellClickListener();
        this.removeCellEnterListener();
        this.removeCellLeaveListener();

        console.log('Игровое поле заблокировано');

        // Деактивируем кнопки "Save" и "Load"
        this.saveGameEl.disabled = true;
        this.loadGameEl.disabled = true;

        // Оставляем активной только кнопку "New Game"
        this.newGameEl.disabled = false;

    } catch (err) {
        console.error('Ошибка блокировки игрового поля:', err.message);
    }
  }

  updateCurrentScore() {
    console.log('Пересчёт текущего счёта');
    // console.log('Команда игрока:', this.playerTeam, '!! selectedCharacter??', this.selectedCharacter);
    this.currentScore = this.playerTeam.reduce(
      (acc, positionedCharacter) => acc + Math.round(positionedCharacter.character.health),
      0
    );
    console.log(`Обновлённый текущий счёт: ${this.currentScore}`);
  }

  updateMaxScore() {
    if (this.currentScore > this.maxScore) {
      console.log(`Обновление рекорда: старый ${this.maxScore}, новый ${this.currentScore}`);
      this.maxScore = this.currentScore;
      this.saveMaxScore();
    }
  }

  saveMaxScore() {
    const savedState = this.stateService.load() || {};
    savedState.maxScore = this.maxScore;
    this.stateService.save(savedState);
  }

  resetCurrentScore() {
    this.currentScore = 0;
    if (!this.scoresReset) { // Проверка, сбрасывались ли счётчики ранее
      console.log('Попытка сбросить счётчики...');
      this.scoresReset = true;
      const recordReset = confirm('Вы хотите сбросить рекорд?');
      if (recordReset) {
        this.maxScore = 0;
        localStorage.clear();
        console.log('Счётчики успешно сброшены.');
      }
    }
  }

  updateScoreDisplay() {
    console.log('Вызов updateScoreDisplay');

    if (!this.gamePlay.container) {
      console.error('gamePlay.container is not defined.');
      return;
    }

    let scoreElement = document.querySelector('.score-board');
    if (!scoreElement) {
      scoreElement = document.createElement('div');
      scoreElement.classList.add('score-board');
    }

    const currentScoreElement = document.querySelector('.current-score');
    const maxScoreElement = document.querySelector('.max-score');
    console.log(`Текущий счёт: ${this.currentScore}`);
    console.log(`Рекорд: ${this.maxScore}`);

    if (currentScoreElement) {
      currentScoreElement.textContent = `Текущий счёт: ${this.currentScore}`;
    }

    if (maxScoreElement) {
      maxScoreElement.textContent = `Рекорд: ${this.maxScore}`;
    }
  }

  /** Создание HTML элемента .score-board */
  createScoreBoard() {
    if (document.querySelector('.score-board')) return;
    const scoreBoard = document.createElement('div');
    scoreBoard.classList.add('score-board');
    const currentScore = document.createElement('div');
    currentScore.classList.add('current-score');
    currentScore.textContent = 'Текущий счёт: 0';
    const maxScore = document.createElement('div');
    maxScore.classList.add('max-score');
    maxScore.textContent = 'Рекорд: 0';
    scoreBoard.appendChild(currentScore);
    scoreBoard.appendChild(maxScore);
    this.gamePlay.container.insertAdjacentElement('afterbegin', scoreBoard);
  }


  removeCellClickListener() {
    this.gamePlay.boardEl.removeEventListener('click', this.onCellClick);
  }

  removeCellEnterListener() {
    // true для захвата событий
    this.gamePlay.boardEl.removeEventListener('mouseenter', this.onCellEnter, true);
  }

  removeCellLeaveListener() {
    // true для захвата событий
    this.gamePlay.boardEl.removeEventListener('mouseleave', this.onCellLeave, true);
  }

  levelUpCharacters() {
    this.playerTeam.forEach((positionedCharacter) => {
      this.levelUpCharacter(positionedCharacter.character);
    });
  }

  startNextLevel() {
    console.log('startNextLevel: Переход на новый уровень.');
    // Сохраняем текущий элемент .score-board
    const scoreBoard = document.querySelector('.score-board');
    let scoreBoardContent = '';
    if (scoreBoard) {
      scoreBoardContent = scoreBoard.outerHTML; // Сохраняем HTML для восстановления
      scoreBoard.remove(); // Удаляем из DOM временно
    }

    if (this.selectedCharacter) {
      this.gamePlay.deselectCell(this.selectedCharacter.position);
      this.selectedCharacter = null;
    }

    this.currentThemeIndex = (this.currentThemeIndex + 1) % Object.keys(themes).length;
    const theme = Object.values(themes)[this.currentThemeIndex];
    this.gamePlay.drawUi(theme);

    //  Определяем размер команд для текущего уровня
    const level = this.currentThemeIndex + 1; // Индекс темы начинается с 0, поэтому добавляем 1
    let playerCount, enemyCount;
    if (level === 2) {
        playerCount = 3;
        enemyCount = 3;
    } else if (level >= 3) {
        playerCount = 5;
        enemyCount = 5;
    } else {
        playerCount = 2;
        enemyCount = 2;
    }
    // 1. Повышение уровня "живых" персонажей
    this.playerTeam = this.playerTeam.map((positionedCharacter) => {
      this.levelUpCharacter(positionedCharacter.character, 1); // Повышаем уровень на 1
      return positionedCharacter;
    });

    // 2. Генерация новых персонажей с уровнем 1
    const newPlayerCharacters = generateTeam(
      [Bowman, Swordsman, Magician], 1, playerCount - this.playerTeam.length
    );
    const newEnemyCharacters = generateTeam(
        [Vampire, Undead, Daemon], 1, enemyCount);

    // 3. Добавление новых персонажей в команды
    this.playerTeam = [
        ...this.playerTeam,
        ...this.placeTeam(newPlayerCharacters, [0, 1]),
    ];
    this.enemyTeam = [
        ...this.enemyTeam,
        ...this.placeTeam(newEnemyCharacters, [6, 7]),
    ];

    this.positions = [...this.playerTeam, ...this.enemyTeam];

    // Восстанавливаем элемент .score-board
    if (scoreBoardContent) {
      this.gamePlay.container.insertAdjacentHTML('beforeend', scoreBoardContent);
    }

    this.redrawPositions();
    this.addButtonListeners();
    this.updateScoreDisplay();
    this.currentTurn = 'player';
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
    this.occupiedPositions = this.occupiedPositions.filter( // удаляем старую позицию
      (pos) => pos !== positionedCharacter.position
    );
    positionedCharacter.position = newPosition;
    this.occupiedPositions.push(newPosition);
    this.updateOccupiedPositions();
  }

  /**
   * Логика атаки в классе GameController, с использованием метода showDamage из GamePlay.
   * @param {*} attacker
   * @param {*} targetPosition
   * @param {string} turn - Текущий ход ('player' или 'enemy').
   */
  async attack(attacker, targetPosition, turn = 'player') {
    console.log(`async attack Атака: ${attacker.type} атакует клетку ${targetPosition} (${turn} ход)`);

    const target = this.positions.find((pos) => pos.position === targetPosition);
    if (!target) {
      throw new Error('attack: Цель не найдена');
    }

    const damage = Math.round(
      Math.max(attacker.attack - target.character.defence, attacker.attack * 0.1) * 10) / 10;

    console.log('async attack: вызов showDamage:', { targetPosition, damage, attacker, target });
    await this.gamePlay.showDamage(targetPosition, damage);
    console.log('showDamage выполнен.');

    target.character.health -= damage;

    if (target.character.health <= 0) {
      console.log(`async attack Персонаж ${target.character.type} уничтожен на позиции ${targetPosition}`);

      // Удаляем "убитого" персонажа и обновляем команды
      this.handleCharacterDeath(target);
      this.selectedCharacter = null;
    }

    // console.log('async attack До вызова redrawPositions');
    this.redrawPositions();
    // console.log('async attack После вызова redrawPositions');
  }

  /**
   Логика хода компьютера: выбирается ближайший персонаж игрока.
   */
  async enemyTurn() {
    console.log('async enemyTurn Начало хода врага');

    if (this.enemyTeam.length === 0) {
      console.log('Нет доступных врагов для хода.');
      return;
    }

    // Находим всех персонажей игрока
    const playerCharacters = this.positions.filter((pos) =>
      this.playerTeam.some((playerPos) => playerPos === pos)
    );

    console.log(`async enemyTurn Находим всех персонажей игрока: ${playerCharacters.map((pc) => pc.character.type)}`);

    if (playerCharacters.length === 0) {
      GamePlay.showMessage('Все персонажи игрока уничтожены. Вы проиграли.');
      this.isGameOver = true;
      return;
    }

    // Стратегия: атака ближайшего игрока
    let bestAttack = null;

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
      console.log(`async enemyTurn Враг атакует: ${bestAttack.enemy.character.type} на позиции ${bestAttack.enemy.position} атакует игрока ${bestAttack.target.character.type} на позиции ${bestAttack.target.position}`);
      await this.attack(bestAttack.enemy.character, bestAttack.target.position, 'enemy');
      return;
    } else {
      console.log('async enemyTurn Враг перемещается');
      const enemyToMove = this.enemyTeam[0];
      const moveRange = this.getMoveRange(enemyToMove.character, enemyToMove.position);
      if (moveRange.length > 0) {
        const targetPosition = moveRange[0];
        console.log(
          `async enemyTurn Враг перемещается с позиции ${enemyToMove.position} на позицию ${targetPosition}`
        );
        this.moveCharacter(enemyToMove, targetPosition);
        this.redrawPositions();
      }
    }

    console.log('--> async enemyTurn --> Передаём ход игроку');
    this.currentTurn = 'player';
  }

  /**
   * Обработчик событий на игровом поле
   */
  addEventListeners() {
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
  }

  onCellClick = async (index) => {
  if (this.isGameOver) {
    console.log('onCellClick: Игра завершена, действия заблокированы.');
    return;
  }

  console.log(`onCellClick Клик по клетке с индексом ${index}`);
  const positionedCharacter = this.positions.find((pos) => pos.position === index);

  // 1. Если ячейка пуста
  if (!positionedCharacter) {
    this.handleEmptyCellClick(index);
    return;
  }

  // 2. Если ячейка содержит персонажа
  //const character = positionedCharacter.character;
  if (this.selectedCharacter) {
    this.handleCharacterInteraction(index, positionedCharacter);
  } else {
    this.handleCharacterSelection(positionedCharacter);
  }
};

  /**
   * Обработка клика по пустой ячейке
   * @param {number} index - Индекс ячейки
   */
  handleEmptyCellClick(index) {
    if (!this.selectedCharacter) {
      GamePlay.showError('В этой ячейке нет персонажа.');
      return;
    }

    const moveRange = this.getMoveRange(this.selectedCharacter.character, this.selectedCharacter.position);
    if (moveRange.includes(index)) {
      this.executeMove(index);
    } else {
      GamePlay.showError('Невозможно переместиться на эту клетку.');
    }
  }

  /**
   * Выполнение перемещения персонажа
   * @param {number} index - Новая позиция
   */
  async executeMove(index) {
    this.gamePlay.deselectCell(this.selectedCharacter.position);
    this.moveCharacter(this.selectedCharacter, index);
    this.selectedCharacter = null;
    this.redrawPositions();
    this.currentTurn = 'enemy';
    console.log('--> executeMove --> Ход передан: enemy');
    await this.enemyTurn();
  }

  /**
   * Обработка взаимодействия с персонажем
   * @param {number} index - Индекс ячейки
   * @param {Object} positionedCharacter - Персонаж на клетке
   */
  async handleCharacterInteraction(index, positionedCharacter) {
    const attackRange = this.getAttackRange(this.selectedCharacter.character, this.selectedCharacter.position);

    if (attackRange.includes(index) && this.enemyTeam.some((enemy) => enemy.position === index)) {
      await this.executeAttack(index, positionedCharacter);
      return;
    }

    if (this.isAlly(positionedCharacter)) {
      this.switchSelectedCharacter(positionedCharacter, index);
      return;
    }

    GamePlay.showError('Невозможно выполнить действие.');
  }

  /**
   * Выполнение атаки
   * @param {number} index - Позиция цели
   * @param {Object} target - Целевой персонаж
   */
  async executeAttack(index, target) {
    const attacker = this.selectedCharacter.character;
    const damage = Math.round(
      Math.max(attacker.attack - target.character.defence, attacker.attack * 0.1)*10)/10;

    console.log('executeAttack: вызов showDamage:', { index, damage, attacker, target });
    await this.gamePlay.showDamage(index, damage);
    target.character.health -= damage;

    if (target.character.health <= 0) {
      this.handleCharacterDeath(target);
    }

    // Проверка завершения раунда
    if (this.enemyTeam.length === 0) {
      console.log('Все враги уничтожены.');
      if (this.currentThemeIndex === 3) { // Проверка завершения последнего уровня
        GamePlay.showMessage('Поздравляем! Вы завершили все уровни!');
        this.blockGameField();
        this.isGameOver = true;
      } else {
        GamePlay.showMessage('Раунд завершен, переход на следующий уровень!');
        this.startNextLevel();
      }
      return; // Ход остаётся у игрока
    }

    this.redrawPositions();
    this.currentTurn = 'enemy';  // Ход передаётся врагу только если враги остались
    console.log('--> executeAttack --> Ход передан: enemy');
    await this.enemyTurn();
  }

  /**
   * Обработка смерти персонажа
   * @param {Object} target - Убитый персонаж
   */
  handleCharacterDeath(target) {
    console.log(`handleCharacterDeath: Персонаж ${target.character.type} уничтожен.`);
    this.positions = this.positions.filter((pos) => pos !== target);
    this.updateOccupiedPositions();
    this.enemyTeam = this.enemyTeam.filter((enemy) => enemy !== target);
    this.playerTeam = this.playerTeam.filter((player) => player !== target);
  }

  /**
   * Выбор нового персонажа
   * @param {Object} positionedCharacter - Новый выбранный персонаж
   * @param {number} index - Позиция нового персонажа
   */
  switchSelectedCharacter(positionedCharacter, index) {
    this.gamePlay.deselectCell(this.selectedCharacter.position);
    this.selectedCharacter = positionedCharacter;
    this.gamePlay.selectCell(index, 'yellow');
    console.log(`Вы переключились на персонажа: ${positionedCharacter.character.constructor.name} на позиции ${index}`);
  }

  /**
   * Обработка выбора персонажа
   * @param {Object} positionedCharacter - Выбранный персонаж
   */
  handleCharacterSelection(positionedCharacter) {
    const character = positionedCharacter.character;
    const playerTypes = [Bowman, Swordsman, Magician];

    if (!playerTypes.includes(character.constructor)) {
      GamePlay.showError('Этот персонаж не принадлежит вам.');
      return;
    }

    this.selectedCharacter = positionedCharacter;
    this.gamePlay.selectCell(positionedCharacter.position, 'yellow');
    console.log(`Вы выбрали персонажа: ${character.constructor.name} на позиции ${positionedCharacter.position}`);
  }

  /**
   * Проверка, является ли персонаж союзником
   * @param {Object} positionedCharacter - Проверяемый персонаж
   * @returns {boolean}
   */
  isAlly(positionedCharacter) {
    return this.playerTeam.some((player) => player === positionedCharacter);
  }


  /**
   * Проверка принадлежности персонажа противнику
   */
  isEnemy(character) {
    return this.enemyTeam.some((pos) => pos.character === character);
  }

  onCellEnter(index) {
    if (this.isGameOver) {
      console.log('onCellClick: Игра завершена, действия заблокированы.');
      return;
    }
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
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.deselectCell(index);
  }

  /**
   * Обработчик событий на кнопках
   */
  addButtonListeners() {
    this.newGameEl = document.querySelector('[data-id="action-restart"]');
    this.saveGameEl = document.querySelector('[data-id="action-save"]');
    this.loadGameEl = document.querySelector('[data-id="action-load"]');

    if (this.newGameEl && this.saveGameEl && this.loadGameEl) {
        this.newGameEl.addEventListener('click', (event) => this.onNewGameClick(event));
        this.saveGameEl.addEventListener('click', (event) => this.onSaveGameClick(event));
        this.loadGameEl.addEventListener('click', (event) => this.onLoadGameClick(event));
    } else {
        console.error('Не удалось найти кнопки на странице');
    }
  }

  onNewGameClick() {
    console.log('-------нажата кнопка NewGame------');
    this.resetCurrentScore();
    // const currentScore = this.calculateCurrentScore();
    // this.trackMaxScore(currentScore);
    const container = document.getElementById('game-container');

    const newGamePlay = new GamePlay();
    newGamePlay.bindToDOM(container);

    this.gamePlay = newGamePlay;
    // this._initializeGame(true);
    this.initNewGame();
    // this.init();
  };

  onSaveGameClick() {
    console.log('------нажата кнопка SaveGame-------');

    const stateToSave = {
      positions: this.positions.map((pos) => ({
        position: pos.position,
          character: {
            ...pos.character,
            type: pos.character.constructor.name.toLowerCase(),
          },
      })),
      level: this.currentThemeIndex + 1,
      playerMove: this.currentTurn === 'player',
    };

    this.stateService.save(stateToSave);
    console.log('Сохраняемое состояние:', stateToSave);

    GamePlay.showMessage('Игра сохранена');
  };

  onLoadGameClick = () => {
    console.log('------нажата кнопка LoadGame-------');
    let loadState;

    // Загрузка состояния из stateService
    try {
        loadState = this.stateService.load();
        if (!loadState || !Array.isArray(loadState.positions)) {
            throw new Error('Сохранённое состояние повреждено или отсутствует');
        }
    } catch (err) {
        GamePlay.showError(`Ошибка загрузки игры: ${err.message}`);
        return;
    }

    // Сохранение .score-board
    const scoreBoard = document.querySelector('.score-board');
    let scoreBoardContent = '';
    if (scoreBoard) {
      scoreBoardContent = scoreBoard.outerHTML; // Сохраняем HTML
      scoreBoard.remove(); // Удаляем из DOM
    }

    // Восстановление состояния
    try {
        // Преобразование загруженного объекта в экземпляр GameState
        this.gameState = GameState.from(loadState);
        console.log('Восстановленное состояние:', this.gameState);

        // Восстановление массива позиций
        this.positions = this.gameState.positions.map((pos) => {
            const CharacterClass = characterTypeMap[pos.character.type];
            if (!CharacterClass) {
                throw new Error(`Неизвестный тип персонажа: ${pos.character.type}`);
            }
            const character = Object.assign(new CharacterClass(), pos.character);
            return { position: pos.position, character };
        });

        console.log('Загруженные позиции:', this.positions);

        this.currentScore = loadState.currentScore || 0;
        // this.currentScore = loadState.userStats || 0;
        this.maxScore = loadState.maxScore || this.maxScore;
        // this.maxScore = Math.max(this.maxScore, loadState.maxScore || 0);
        console.log('Текущий счёт после загрузки:', this.currentScore);
        console.log('loadState.userStats', loadState.userStats);
        console.log('Максимальный счёт после загрузки:', this.maxScore);

        // Обновление команд
        this.playerTeam = this.positions.filter((pos) =>
            ['bowman', 'swordsman', 'magician'].includes(pos.character.type)
        );
        console.log('Команда игрока после загрузки:', this.playerTeam);

        this.enemyTeam = this.positions.filter((pos) =>
            ['vampire', 'undead', 'daemon'].includes(pos.character.type)
        );
        console.log('Команда врага после загрузки:', this.enemyTeam);

        // Восстановление темы через levelToThemeMap
        // const levelToThemeMap = ['prairie', 'desert', 'arctic', 'mountain'];
        // const themeKey = levelToThemeMap[this.gameState.level - 1]; // Индекс = уровень - 1
        // const theme = themes[themeKey];
        // if (!theme) {
        //     throw new Error(`Тема для уровня ${this.gameState.level} (${themeKey}) не найдена`);
        // }

        // Восстанавливаем текущий уровень и индекс темы
        this.currentThemeIndex = (loadState.level || 1) - 1; // Приводим уровень к индексу темы
        const theme = Object.values(themes)[this.currentThemeIndex];

        if (!theme) {
          throw new Error(`Тема для уровня ${loadState.level} не найдена`);
        }
        console.log('Тема после загрузки:', theme);
        console.log('Уровень после загрузки:', this.gameState.level);

        this.gamePlay.drawUi(theme);
        this.redrawPositions();
        this.addButtonListeners(); // Повторно привязываем кнопки
        // Восстановление .score-board
        if (scoreBoardContent) {
          this.gamePlay.container.insertAdjacentHTML('beforeend', scoreBoardContent);
        }

        GamePlay.showMessage('Игра успешно загружена!');
        this.updateScoreDisplay(); // Обновляем отображение счётчиков
    } catch (err) {
        GamePlay.showError(`Ошибка восстановления игры: ${err.message}`);
    }
  };

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
    // console.log('Текущие занятые позиции:', this.occupiedPositions);

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
    // console.log('Массив индексов для хода:', range, 'position:', position);
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

    // console.log('Массив индексов для атаки:', attackRange, 'position:', position);
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
}
