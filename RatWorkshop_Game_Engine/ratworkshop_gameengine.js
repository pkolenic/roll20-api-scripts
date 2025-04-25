class RatWorkshop_GameEngine_Module {
  static VERSION = 0.1;
  static MODULE_NAME = "Base Module";
  static DEFAULT_STATE = {
    moduleName: RatWorkshop_GameEngine_Module.MODULE_NAME,
    version: RatWorkshop_GameEngine_Module.VERSION,
    gcUpdated: 0,
  }

  static getModuleName() {
    return this.MODULE_NAME;
  }
  static getStateKey() {
    return `RatWorkShop_${this.MODULE_NAME}`;
  }

  static getGlobalConfigKey() {
    return this.getStateKey().replace(new RegExp('_', 'g'), '').toLowerCase();
  }

  logObject(obj = {}, header = '', depth = 0) {
    log('====================================================');
    log(`==== ${header}`);
    log('====================================================');

    function logNestedValue(value, depth) {
      const indent = '   '.repeat(depth);
      if (Array.isArray(value)) {
        log(`==== ${indent}[`);
        value.forEach((item) => {
          if (typeof item === 'object') {
            logNestedObject(item, depth + 1);
          } else {
            log(`==== ${indent}   ${item}`);
          }
        });
        log(`==== ${indent}]`);
      } else if (typeof value === 'object') {
        logNestedObject(value, depth);
      } else {
        log(`==== ${indent}${value}`);
      }
    }

    function logNestedObject(obj, depth) {
      const indent = '   '.repeat(depth);
      Object.entries(obj).forEach(([ key, value ]) => {
        log(`==== ${indent}${key}: {`);
        logNestedValue(value, depth + 1);
        log(`==== ${indent}}`);
      });
    }

    logNestedObject(obj, depth);
    log('====================================================');
  }

  register() {
    if (this.constructor.getModuleName() === RatWorkshop_GameEngine_Module.MODULE_NAME) {
      log('Base RatWorkshop Module cannot be registered, extend it first');
      return;
    }

    let intervalId = null;
    function registerModuleWithEngine(module) {
      if (typeof ratWorkshopGameEngine === 'object') {
        clearInterval(intervalId);
        ratWorkshopGameEngine.registerModule(module);
        return true;
      }
      return false;
    }
    // Register the Module with the GameEngine, if it exists otherwise register on an interval
    if (!registerModuleWithEngine(this)) {
      intervalId = setInterval(registerModuleWithEngine, 200, this);
    }
  }

  /**
   * Used to update State based on One-Click useroptions
   */
  initializeConfigurations() {
    // Override in SubClasses
  }

  /**
   * Populates the state references from the global state
   */
  setStateReferences() {
    // Quick Reference to the Stored States
    this.settings = state[this.constructor.getStateKey()] || {};
  }

  constructor() {
    this.GLOBAL_CONFIGURATIONS = globalconfig && globalconfig[this.constructor.getStateKey()];
    this.initializeConfigurations();
    this.setStateReferences();
    this.register();
  }
}

class RatWorkshop_Entity {
  constructor() {}
}

class RatWorkshop_Player extends RatWorkshop_Entity {
  constructor() {
    super();
  }
}

class RatWorkshop_Creature extends RatWorkshop_Entity {
  constructor() {
    super();
  }
}

class RatWorkshop_DungeonMaster extends RatWorkshop_GameEngine_Module {
  static MODULE_NAME = "DungeonMasterTools";
  static DEFAULT_STATE = {
    ...RatWorkshop_GameEngine_Module.DEFAULT_STATE,
  }

  constructor() {
    super();
  }
}

class RatWorkshop_GameEngine extends RatWorkshop_GameEngine_Module {
  static MODULE_NAME = "GameEngine";
  static VERSION = 0.1;
  static DEFAULT_STATE = {
    ...RatWorkshop_GameEngine_Module.DEFAULT_STATE,
    moduleName: RatWorkshop_GameEngine.MODULE_NAME,
    version: RatWorkshop_GameEngine.VERSION,
  }

  COMMANDS = {
    'reset': () => this.resetSettings(),
  }

  constructor() {
    super();
    this.modules = {};

    // Always register the DungeonMaster
    new RatWorkshop_DungeonMaster();

    // Register Event Listeners
    this.handleAPIMessages();
    log(`RatWorkshop GameEngine Ready!`);
  }
  handleAPIMessages() {
    on('chat:message', (msg) => {
      if (msg.type === 'api' && !msg.rolltemplate) {
        const [ module, command, ...args ] = msg.content.substring(1).split(" ");
        // Only Listen for Commands for RatWorkshop
        if (module.toUpperCase() !== 'RATWORKSHOP') return;
        // Only handle valid Commands
        if (this.COMMANDS[command]) {
          this.COMMANDS[command](args, msg);
        }
      }
    });
  }

  resetSettings() {
    state.RatWorkShop_GameEngine = null
    this.initializeConfigurations();
    this.settings = state.RatWorkShop_GameEngine;
  }

  /**
   * GameEngine shouldn't register itself
   */
  register() {}

  initializeConfigurations() {
    if (!state.RatWorkShop_GameEngine) {
      state.RatWorkShop_GameEngine = RatWorkshop_GameEngine.DEFAULT_STATE;
    } else if (state.RatWorkShop_GameEngine?.version !== RatWorkshop_GameEngine.VERSION) {
      // Sync Current Settings to the latest Default Settings
      // TODO - need to implement this so that we can update the settings without losing user data
      state.RatWorkShop_GameEngine = { ...RatWorkshop_GameEngine.DEFAULT_STATE, ...state.RatWorkShop_GameEngine };
    }

    const gc = this.GLOBAL_CONFIGURATIONS;
    if (gc && gc.lastsaved && gc.lastsaved > state.RatWorkShop_GameEngine.gcUpdated) {
      // TODO - update state from globalconfig
      state.RatWorkShop_GameEngine.gcUpdated = gc.lastsaved;
    }
    this.logObject(state, 'Current State of Sandbox');
  }

  /**
   * Register a module with the GameEngine
   * @param module: The module to register
   * @param force: Force the registration of the module, even if it already exists
   */
  registerModule(module, force = false) {
    const moduleName = module.constructor.getModuleName();
    if (!this.modules[moduleName] || force) {
      this.modules[moduleName] = module;
      log(`${moduleName} has been registered`);
    }
  }
}

// Initialize
ratWorkshopGameEngine = new RatWorkshop_GameEngine();
