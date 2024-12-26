/**
 * Entry point of app: don't change this
 */
import GamePlay from './GamePlay';
import GameController from './GameController';
import GameStateService from './GameStateService';

const gamePlay = new GamePlay();
// querySelector - находит HTML-элемент с идентификатором game-container в DOM-дереве
// bindToDOM(container) - привязывает экземпляр GamePlay к указанному контейнеру и
//           вызывается метод render, чтобы отрисовать интерфейс внутри контейнер:
//           сохраняем контейнер для работы:
//                     this.container = container;
//           вызываем метод, который создаёт/отрисовывает элементы интерфейса:
//                     this.render();
gamePlay.bindToDOM(document.querySelector('#game-container'));

const stateService = new GameStateService(localStorage);

const gameCtrl = new GameController(gamePlay, stateService);
gameCtrl.init();

// don't write your code here
