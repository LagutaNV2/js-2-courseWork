export default class GameState {
  constructor() {
    this.positions = [];   // Массив объектов, где каждый хранит персонажа и его позицию на поле
    this.occupiedPositions = new Set(); // Множество позиций поля, которые заняты персонажам
    this.playerMove = true; // Ход игрока
    this.level = 1;        // Текущий уровень
    this.userStats = 0;   // Очки пользователя
  }

  // Восстановления состояния игры:
  //   создание экземпляра GameState на основе переданного объекта (object);
  //   копируем все свойства из object в экземпляр gameState (Object.assign);
  //   восстанавливаем множество (Set) обратно из массива:
  //     occupiedPositions в GameState хранится как Set, а не массив, но
  //     при сохранении игры объект Set преобразуется в массив, так как
  //     JSON.stringify не поддерживает сериализацию Set
  static from(object) {
    if (typeof object === 'object' && object !== null) {
      const gameState = new GameState();
      Object.assign(gameState, object);
      gameState.occupiedPositions = new Set(object.occupiedPositions || []);
      return gameState;
    }
    return null;
  }
}
