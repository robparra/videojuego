import {entity} from './entity.js';


export const ui_controller = (() => {

  class UIController extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._quests = {};
    }
  
    InitComponent() {
      this._iconBar = {
        inventory: document.getElementById('icon-bar-inventory'),
      };

      this._ui = {
        inventory: document.getElementById('inventory'),
      };

      this._iconBar.inventory.onclick = (m) => { this._OnInventoryClicked(m); };
      this._HideUI();
    }


    _HideUI() {
      this._ui.inventory.style.visibility = 'hidden';
    }
    

    _OnInventoryClicked(msg) {
      const visibility = this._ui.inventory.style.visibility;
      this._HideUI();
      this._ui.inventory.style.visibility = (visibility ? '' : 'hidden');
    }

    Update(timeInSeconds) {
    }
  };

  return {
    UIController: UIController,
  };

})();