import Character from '../Character';
import Bowman from '../characters/Bowman';
import Swordsman from '../characters/Swordsman';
import Magician from '../characters/Magician';
import { characterGenerator, generateTeam } from '../generators';

// Тесты на исключения при создании объектов
describe('Character class behavior', () => {

  test('Should throw "Cannot create instance of Character directly" error when creating a base Character instance', () => {
    expect(() => new Character(1)).toThrow('Cannot instantiate Character directly');
  });

  test('Should not throw an error when creating a Bowman instance', () => {
    expect(() => new Bowman(1)).not.toThrow();
  });

  test('Should not throw an error when creating a Swordsman instance', () => {
    expect(() => new Swordsman(1)).not.toThrow();
  });

  test('Should not throw an error when creating a Magician instance', () => {
    expect(() => new Magician(1)).not.toThrow();
  });
});

// Тесты на проверку характеристик первого уровня
describe('Character stats at level 1', () => {
  test('Bowman should have attack 25', () => {
    const bowman = new Bowman(1);
    expect(bowman.attack).toBe(25);
  });

  test('Bowman should have defence 25', () => {
    const bowman = new Bowman(1);
    expect(bowman.defence).toBe(25);
  });

  test('Bowman should have level 1', () => {
    const bowman = new Bowman(1);
    expect(bowman.level).toBe(1);
  });

  test('Swordsman should have attack 40', () => {
    const swordsman = new Swordsman(1);
    expect(swordsman.attack).toBe(40);
  });

  test('Swordsman should have defence 10', () => {
    const swordsman = new Swordsman(1);
    expect(swordsman.defence).toBe(10);
  });

  test('Swordsman should have level 1', () => {
    const swordsman = new Swordsman(1);
    expect(swordsman.level).toBe(1);
  });

  test('Magician should have attack 10', () => {
    const magician = new Magician(1);
    expect(magician.attack).toBe(10);
  });

  test('Magician should have defence 40', () => {
    const magician = new Magician(1);
    expect(magician.defence).toBe(40);
  });

  test('Magician should have level 1', () => {
    const magician = new Magician(1);
    expect(magician.level).toBe(1);
  });
});

// Тесты на characterGenerator
describe('Character generator', () => {
  const allowedTypes = [Bowman, Swordsman, Magician];

  test.each(allowedTypes)(
    'Should generate %p as a character from allowedTypes',
    (CharacterType) => {
      const generator = characterGenerator([CharacterType], 1);
      const character = generator.next().value;

      expect(character.constructor).toBe(CharacterType);
    }
  );

  test('Should generate only characters from allowedTypes', () => {
    const generator = characterGenerator(allowedTypes, 1);
    const character = generator.next().value;

    // Проверяем, что тип созданного персонажа есть в списке разрешённых
    expect(allowedTypes).toContain(character.constructor);
  });

  test('Should give out generator characterGenerator infinitely new characters from the list', () => {
    const generator = characterGenerator(allowedTypes, 1);
    const character1 = generator.next().value;
    const character2 = generator.next().value;

    expect(character1).not.toBe(character2); // Проверка, что персонажи разные
  });

});

// Тесты на generateTeam
describe('Team generation', () => {
  test('Should generate the correct number of characters', () => {
    const team = generateTeam([Bowman], 1, 3);
    expect(team.length).toBe(3);
  });

  test('Each generated character should have a level not less than 1', () => {
    const maxLevel = 3;
    const team = generateTeam([Bowman], maxLevel, 3);

    team.forEach((char) => {
      expect(char.level).toBeGreaterThanOrEqual(1);
    });
  });

  test('Each generated character should have a level not greater than maxLevel', () => {
    const maxLevel = 3;
    const team = generateTeam([Bowman], maxLevel, 3);

    team.forEach((char) => {
      expect(char.level).toBeLessThanOrEqual(maxLevel);
    });
  });


  test('Each generated character should belong to allowedTypes', () => {
    const allowedTypes = [Bowman, Swordsman];
    const team = generateTeam(allowedTypes, 1, 3);

    team.forEach((char) => {
      expect(allowedTypes).toContain(char.constructor);
    });
  });
});
