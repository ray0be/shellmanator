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
        currentSession: null,
        currentModule: null
    },
    mutations: {
        setNbServers: function(state, nb) {
            state.nbServers = nb;
        },
        setSession: function(state, sid) {
            if (sid === null) {
                state.currentSession = null;
            }
            else if (typeof sid == 'string' && sid !== state.currentSession && sid in sessionList) {
                // update session
                state.currentSession = sid;

                // retrieve the current module of this session
                state.currentModule = sessionList[sid].currentModule;

                console.log(`Switched session to "${sid}"`);
            }
        },
        setModule: function(state, moduleName) {
            state.currentModule = moduleName;

            console.log(`Switched module to "${moduleName}"`);
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
        for (let m of modules) {
            this.modules[m] = new Module(m);
        }
    }

    listOfModules() {
        return this.modules;
    }

    hasModule(moduleName) {
        return moduleName in this.modules;
    }

    getModule(moduleName) {
        if (this.hasModule(moduleName)) {
            return this.modules[moduleName];
        }
        return null;
    }

    switchModule(newModuleName) {
        if (newModuleName != this.currentModule) {
            if (newModuleName in this.modules) {
                this.currentModule = newModuleName;
                stateStore.commit('setModule', newModuleName);
                setTimeout(() => {
                    eventHub.$emit(`session-${this.server}-module-${newModuleName}`);
                }, 50);
                return true;
            }
            console.error(`Cannot switch to unknown module "${newModuleName}" !`);
        }
    }
}


/**
 * ==========================================================================
 *  List of modules
 * ==========================================================================
 */

var moduleList = null;

class Module
{
    constructor(moduleName) {
        this.name = moduleName;
        this.title = moduleList[moduleName].title;
        this.icon = moduleList[moduleName].icon;
        this.desc = moduleList[moduleName].desc;
    }

    makeRequest(handler, data, cb, cbError=null) {
        app.remoteAPIcall(this.name, handler, data, cb, cbError);
    }
}

/**
 * Module mixin
 */
Vue.mixin({
    data: function() {
        return {
            firstTimeWakeUp: true
        };
    },
    created: function() {
        if (this.isModule) eventHub.$on(`session-${this.session}-module-${this.module}`, this.pleaseWakeUpNow);
    },
    beforeDestroy: function () {
        if (this.isModule) eventHub.$off(`session-${this.session}-module-${this.module}`);
    },
    methods: {
        pleaseWakeUpNow: function() {
            if (this.wakeUp) {
                this.wakeUp(this.firstTimeWakeUp);
            }
            this.firstTimeWakeUp = false;
        },
        apiCall: function(...args) {
            if (this.isModule) sessionList[this.session].getModule(this.module).makeRequest(...args);
        }
    }
});
