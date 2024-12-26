import GameController from '../GameController';
import GamePlay from '../GamePlay';
import PositionedCharacter from "../PositionedCharacter";
import { Team } from '../Team';
import Character from "../Character";
// import StateService from '../StateService';
import Bowman from '../characters/Bowman';
import Swordsman from '../characters/Swordsman';
import Magician from '../characters/Magician';
import Vampire from '../characters/Vampire';
import Undead from '../characters/Undead';
import Daemon from '../characters/Daemon';

jest.mock('../GamePlay'); // Мокируем GamePlay
// jest.mock('../StateService'); // Мокируем StateService

describe('GameController', () => {
  let gamePlay;
  let stateService;
  let gameController;

  beforeEach(() => {
    gamePlay = new GamePlay();
    // stateService = new StateService();
    gameController = new GameController(gamePlay, stateService);
  });

  test('init() initializes the game correctly', () => {
    gameController.init();

    expect(gamePlay.drawUi).toHaveBeenCalledWith('prairie');
    expect(gameController.playerTeam.length).toBe(2); // Проверяем размер команды
    expect(gameController.enemyTeam.length).toBe(2); // Проверяем размер команды
    expect(gamePlay.redrawPositions).toHaveBeenCalledWith(gameController.positions);
  });

  test('createTeams() generates unique positions for characters', () => {
    gameController.createTeams();

    const allPositions = gameController.positions.map((pos) => pos.position);
    const uniquePositions = new Set(allPositions);

    expect(allPositions.length).toBe(uniquePositions.size); // Все позиции уникальны
  });

  test('placeTeam() places characters in correct columns', () => {
    const characters = [new Bowman(1), new Bowman(2)];
    const placedTeam = gameController.placeTeam(characters, [0, 1]);

    placedTeam.forEach((posChar) => {
      const column = posChar.position % gameController.boardSize;
      expect([0, 1]).toContain(column); // Проверяем, что позиции в столбцах 0 или 1
    });
  });

  test('formatCharacterInfo() formats character info correctly', () => {
    const character = new Bowman(1);
    character.attack = 25;
    character.defence = 25;
    character.health = 100;

    const formatted = gameController.formatCharacterInfo(character);
    expect(formatted).toBe('🎖1 ⚔25 🛡25 ❤100');
  });

  test('onCellEnter() shows tooltip with character info', () => {
    const character = new Bowman(1);
    character.attack = 25;
    character.defence = 25;
    character.health = 100;

    gameController.positions = [{ character, position: 5 }];
    gameController.onCellEnter(5);

    expect(gamePlay.showCellTooltip).toHaveBeenCalledWith('🎖1 ⚔25 🛡25 ❤100', 5);
  });

  test('onCellLeave() hides tooltip', () => {
    gameController.onCellLeave(5);
    expect(gamePlay.hideCellTooltip).toHaveBeenCalledWith(5);
  });

});

describe('GameController - Movement Ranges', () => {
  let gameController;

  beforeEach(() => {
    const gamePlay = new GamePlay();
    const stateService = {}; // Пустой объект для stateService
    gameController = new GameController(gamePlay, stateService);
    gameController.createTeams();
  });

  test('Bowman movement range', () => {
    const bowman = new Bowman(1);
    const position = 27; // Позиция в центре доски
    const range = gameController.getMoveRange(bowman, position);
    expect(range).toEqual(expect.arrayContaining([19, 20, 26, 28, 34, 35]));
  });

  test('Swordsman movement range', () => {
    const swordsman = new Swordsman(1);
    const position = 27;
    const range = gameController.getMoveRange(swordsman, position);
    expect(range).toEqual(expect.arrayContaining([3, 11, 19, 35, 43, 51]));
  });

  test('Magician movement range', () => {
    const magician = new Magician(1);
    const position = 27;
    const range = gameController.getMoveRange(magician, position);
    expect(range).toEqual(expect.arrayContaining([26, 28, 19, 35]));
  });

  test('Vampire movement range', () => {
    const vampire = new Vampire(1);
    const position = 27;
    const range = gameController.getMoveRange(vampire, position);
    expect(range).toEqual(expect.arrayContaining([19, 20, 26, 28, 34, 35]));
  });

  test('Undead movement range', () => {
    const undead = new Undead(1);
    const position = 27;
    const range = gameController.getMoveRange(undead, position);
    expect(range).toEqual(expect.arrayContaining([3, 11, 19, 35, 43, 51]));
  });

  test('Daemon movement range', () => {
    const daemon = new Daemon(1);
    const position = 27;
    const range = gameController.getMoveRange(daemon, position);
    expect(range).toEqual(expect.arrayContaining([26, 28, 19, 35]));
  });

});

describe('GameController - Attack Range', () => {
  let gameController;

  beforeEach(() => {
    const gamePlay = new GamePlay();
    gameController = new GameController(gamePlay);

    // Инициализируем команды
    gameController.playerTeam = [
      new PositionedCharacter(new Bowman(1), 27), // Игрок на позиции 27
    ];

    gameController.enemyTeam = [
      new PositionedCharacter(new Vampire(1), 18), // Враг на позиции 18
      new PositionedCharacter(new Undead(1), 19),  // Враг на позиции 19
    ];

    // Объединяем всех персонажей в positions
    gameController.positions = [
      ...gameController.playerTeam,
      ...gameController.enemyTeam,
    ];

    // Обновляем занятые позиции
    gameController.updateOccupiedPositions();
  });

  test('Bowman attack range includes enemy positions', () => {
    const bowman = gameController.playerTeam[0].character; // Игрок-Боумен
    const position = gameController.playerTeam[0].position; // Позиция Боумена

    const range = gameController.getAttackRange(bowman, position);

    expect(range).toEqual(expect.arrayContaining([18, 19]));
  });

  test('Swordsman attack range includes enemy positions', () => {
    gameController.playerTeam = [
      new PositionedCharacter(new Swordsman(1), 27),
    ];

    const swordsman = gameController.playerTeam[0].character; // Игрок-Мечник
    const position = gameController.playerTeam[0].position; // Позиция Мечника

    const range = gameController.getAttackRange(swordsman, position);

    expect(range).toEqual(expect.arrayContaining([18, 19]));
  });

  test('Magician attack range includes enemy positions', () => {
    gameController.playerTeam = [
      new PositionedCharacter(new Magician(1), 27),
    ];

    const magician = gameController.playerTeam[0].character; // Игрок-Маг
    const position = gameController.playerTeam[0].position; // Позиция Мага

    const range = gameController.getAttackRange(magician, position);

    expect(range).toEqual(expect.arrayContaining([18, 19]));
  });
});
