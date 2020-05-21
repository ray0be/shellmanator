// shellman.components.js
"use strict";

/**
 * ==========================================================================
 *  Navigation : list of servers
 * ==========================================================================
 */

Vue.component('nav-links', {
    props: ['session'],
    data: function() {
        return {};
    },
    template: `
        <nav class="nav-links" v-if="session">
            <ul>
                <li v-for="module in listOfModules()">
                    <a :class="(module.name == currentModule) ? 'active' : ''" @click="switchModule(module.name)">
                        <span :class="'silkicon ' + module.icon"></span>
                        {{ module.title }}
                    </a>
                </li>
                <li>
                    <a @click="disconnect">
                        <span class="silkicon door_out"></span>
                        Close session
                    </a>
                </li>
            </ul>
        </nav>`,
    computed: {
        currentModule: function() {
            return this.$store.state.currentModule;
        }
    },
    methods: {
        listOfModules: function() {
            return sessionList[this.session].listOfModules();
        },
        switchModule: function(moduleName) {
            sessionList[this.session].switchModule(moduleName);
        },
        disconnect: function() {
            this.$store.commit('setSession', null);
            delete sessionList[this.session];
            eventHub.$emit('open-servers-list');

            console.log(`Closed session "${this.session}"`);
        }
    }
});

Vue.component('nav-servers', {
    data: function() {
        return {
            expanded: true
        };
    },
    template: `
        <nav :class="'nav-servers' + (expanded ? ' expanded' : '')">
            <ul>
                <li>
                    <a class="toggle" @click="toggle">
                        <span class="silkicon server"></span>
                        Servers: {{ nbServers }}
                        <span :class="'silkicon bullet_arrow_' + (expanded ? 'down' : 'up')"></span>
                    </a>
                </li>
                <li v-for="(serv, servid) in listOfServers()" v-show="expanded || servid == currentSession">
                    <a :class="(servid == currentSession) ? 'active' : ''" @click="openSession(servid)">{{ serv.domain }}</a>
                </li>
                <li>
                    <a class="manage" @click="" v-show="expanded">
                        <span class="silkicon cog"></span>
                        Manage
                    </a>
                </li>
            </ul>
        </nav>`,
    created: function() {
        eventHub.$on('open-servers-list', this.open);
    },
    beforeDestroy: function () {
        eventHub.$off('open-servers-list');
    },
    computed: {
        nbServers: function() {
            return this.$store.state.nbServers;
        },
        currentSession: function() {
            return this.$store.state.currentSession;
        }
    },
    methods: {
        listOfServers: function() {
            return serverList;
        },
        open: function() {
            if (!this.expanded) this.toggle();
            return true;
        },
        toggle: function() {
            this.expanded = !this.expanded;
            return this.expanded;
        },
        openSession: function(servid) {
            if (this.expanded) this.toggle();

            if (servid !== this.$store.state.currentSession) {
                // User asked to switch session
                this.$store.commit('setSession', null);

                if (servid in sessionList) {
                    // The Session already exists, so switch to it immediately
                    this.$store.commit('setSession', servid);
                }
                else {
                    // We need to open a new Session
                    app.remoteAPIcall('core', 'healthstatus', {}, null, (status, content) => {
                        if (status == 418) {
                            var d = JSON.parse(content);
                            if (typeof d == 'object' && 'time' in d && 'modules' in d) {
                                sessionList[servid] = new Session(servid, d.modules);
                                this.$store.commit('setSession', servid);
                                sessionList[servid].switchModule('core');
                            }
                        }
                        else {
                            this.open();
                        }
                    }, servid);
                }
            }
        }
    }
});

Vue.component('session-frame', {
    props: ['session'],
    data: function() {
        return {};
    },
    template: `
        <div v-show="session == currentSession" class="session-frame">
            <component
                v-for="(mod, modid) in listOfModules()"
                v-bind:is="'module-' + modid"
                v-if="hasModule(modid)"
                v-show="modid == currentModule"
                v-bind:key="'session-'+session+'-module-'+modid"
                v-bind:session="session"
                v-bind:module="modid"
                v-bind:isModule="true"
            ></component>
        </div>`,
    computed: {
        currentSession: function() {
            return this.$store.state.currentSession;
        },
        currentModule: function() {
            return this.$store.state.currentModule;
        }
    },
    methods: {
        listOfModules: function() {
            if (this.session in sessionList) {
                return sessionList[this.session].listOfModules();
            }
            return null;
        },
        hasModule: function(moduleName) {
            return this.session in sessionList && sessionList[this.session].hasModule(moduleName);
        }
    }
});
