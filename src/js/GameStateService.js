export default class GameStateService {
  constructor(storage) {
    this.storage = storage;
  }

  save(state) {
    const savedState = {
      ...state,
      maxScore: state.maxScore || 0,
    };
    this.storage.setItem('state', JSON.stringify(savedState));
  }

  load() {
    try {
      return JSON.parse(this.storage.getItem('state'));
    } catch (e) {
      throw new Error('Invalid state');
    }
  }
}
