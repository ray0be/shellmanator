// shellman.components.js
"use strict";

/**
 * ==========================================================================
 *  Navigation : list of servers
 * ==========================================================================
 */

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
                this.$store.commit('switchSession', null);

                if (servid in sessionList) {
                    // The Session already exists, so switch to it immediately
                    this.$store.commit('switchSession', servid);
                }
                else {
                    // We need to open a new Session
                    app.remoteAPIcall('core', {ask:'healthstatus'}, (d) => {
                        sessionList[servid] = new Session(servid, d.modules);
                        this.$store.commit('switchSession', servid);
                    }, servid);
                }
            }
        }
    }
});
