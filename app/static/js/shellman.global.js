// shellman.global.js
"use strict";

/**
 * ==========================================================================
 *  API endpoints
 * ==========================================================================
 */

const API_LOCAL = '/api';
const API_REMOTE = '/remote/api';


/**
 * ==========================================================================
 *  List of modules
 * ==========================================================================
 */

var moduleList = null;


/**
 * ==========================================================================
 *  List of servers
 * ==========================================================================
 */

var serverList = null;


/**
 * ==========================================================================
 *  Events
 * ==========================================================================
 */

const eventHub = new Vue();


/**
 * ==========================================================================
 *  Vuex State Store
 * ==========================================================================
 */

Vue.use(Vuex);
const stateStore = new Vuex.Store({
    state: {
        nbServers: 0,
        currentSession: null
    },
    mutations: {
        setNbServers: function(state, nb) {
            state.nbServers = nb;
        },
        switchSession: function(state, sid) {
            if (typeof sid == 'string' || sid === null) {
                if (sid !== state.currentSession && sid in sessionList) {
                    state.currentSession = sid;
                }
            }
        }
    }
});


/**
 * ==========================================================================
 *  Session
 * ==========================================================================
 */

var sessionList = {};

class Session
{
    constructor(sid, modules) {
        this.server = sid;

        this.currentModule = null;
        this.modules = {};
        for (let m in modules) {
            this.modules[m] = new Module(m);
        }
    }

    listOfModules() {
        return this.modules;
    }

    getModule(moduleName) {
        if (moduleName in this.modules) {
            return this.modules[moduleName];
        }
        return null;
    }

    switchModule(newmod) {
        if (newmod in this.modules) {
            this.currentModule = newmod;
            return true;
        }

        console.error(`Cannot switch to unknown module "${newmod}" !`);
    }

    // close() {
    //     // Destroy all modules Vue instances
    //     for (let m in this.modules) {
    //         this.modules[m].instance.$destroy();
    //         this.modules[m] = null;
    //     }
    // }
}

class Module
{
    constructor(moduleName) {
        this.moduleName = moduleName;
    }

    makeRequest(data, cb) {
        app.remoteAPIcall(this.moduleName, data, cb);
    }
}


/**
 * ==========================================================================
 *  Register a Module's Vue instance
 *  => helper for modules
 * ==========================================================================
 */

// var getModule = function(moduleName) {
//     let tmp_session = stateStore.state.currentSession;
//     if (tmp_session && tmp_session in sessionList) {
//         let tmp_module = sessionList[tmp_session].getModule(moduleName);

//         if (tmp_module) {
//             return tmp_module;
//         }
//         else {
//             alert(`Unable to retrieve "${moduleName}" : no module with this name`);
//         }
//     }
// };

// var MODULE_DASHBOARD = getModule('dashboard');
// MODULE_DASHBOARD.setVueInstance(new Vue(...));
// MODULE_DASHBOARD.makeRequest({'lol':2}, function(data) {
    //
// });
