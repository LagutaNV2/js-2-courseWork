import PositionedCharacter from './PositionedCharacter';

/**
 * Класс, представляющий персонажей команды
 *
 * @todo Самостоятельно продумайте хранение персонажей в классе
 * Например
 * @example
 * ```js
 * const characters = [new Swordsman(2), new Bowman(1)]
 * const team = new Team(characters);
 *
 * team.characters // [swordsman, bowman]
 * ```
 * */
export default class Team {
  // TODO: write your logic here
  constructor() {
    this.characters = [];
  }

  /**
   * Добавляет персонажа в команду с указанием позиции
   * @param {Character} character экземпляр персонажа
   * @param {number} position позиция на поле
   */
  add(character, position) {
    const positionedCharacter = new PositionedCharacter(character, position);
    this.characters.push(positionedCharacter);
  }

  /**
   * Возвращает список всех персонажей команды
   */
  getAll() {
    return this.characters;
  }
}
