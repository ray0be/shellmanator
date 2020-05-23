// shellman.main.js
"use strict";


/**
 * ==========================================================================
 *  App : main Vue instance
 * ==========================================================================
 */

const app = new Vue({
    el: '#vue-root',
    store: stateStore,
    data: {
        pleasewait: false,
        request: {
            isInProgress: false,
            type: null,
            info: null,
            status: null,
            color: '#e3e3e3',
            startedAt: null,
            endedAt: null,
            duration: null
        },
        status: {
            vpn: null,
            tor: null,
            geoloc: {
                dir: {
                    country: null,
                    city: null,
                    ip: null
                },
                tor: {
                    country: null,
                    city: null,
                    ip: null
                }
            }
        },
        modalData: {
            activeClass: false,
            title: "",
            body: "",
            cbSubmit: null,
            cbCancel: null
        }
    },
    computed: {
        currentSession: function() {
            return this.$store.state.currentSession;
        }
    },
    methods: {
        /**
         * Returns the list of all the registered servers
         */
        listOfServers: function() {
            return serverList;
        },

        /**
         * Semi-methods that help to start and terminate an HTTP request.
         */
        startAPIcall: function(localOrRemote, actionOrModuleName, remoteHandler, data) {
            if (!this.request.isInProgress) {
                // No in-progress request, let's prepare for a new one
                this.request.color = '#e3e3e3';
                this.request.isInProgress = true;
                this.request.type = localOrRemote.toUpperCase();

                var tmp = (localOrRemote == 'remote') ? 'module=' : 'action=';
                tmp += actionOrModuleName;
                tmp += (localOrRemote == 'remote') ? ` | handler=${remoteHandler}` : '';
                for (let param in data) {
                    let tmpdata = data[param];
                    tmpdata = /\s/.test(tmpdata) ? '[...]' : tmpdata;
                    tmpdata = (tmpdata.length > 15) ? tmpdata.substr(0, 10)+'[...]' : tmpdata;
                    tmp += ` | ${param}=${tmpdata}`;
                }
                this.request.info = tmp;

                this.request.duration = null;
                this.request.startedAt = (new Date()).getTime();

                console.log(`AJAX: ${this.request.type} - ${this.request.info}...`);
                return true;
            }

            console.error('Cannot send a new request, another is still waiting for response.');
            return false;
        },
        endAPIcall: function(error, statusCode, statusText) {
            this.request.status = statusCode + ' ' + statusText;
            this.request.endedAt = (new Date()).getTime();
            this.request.duration = this.request.endedAt - this.request.startedAt;
            this.request.isInProgress = false;

            if (statusCode == 418) {
                this.request.color = '#93E4FF'; // light blue
                error = false;
            }
            else if (statusCode >= 500 || error) {
                this.request.color = '#FFA893'; // orange/red
            }
            else if (statusCode >= 100 && statusCode < 200) {
                this.request.color = '#fff'; // white
            }
            else if (statusCode >= 200 && statusCode < 300) {
                this.request.color = '#93FF9E'; // green
            }
            else if (statusCode >= 300 && statusCode < 400) {
                this.request.color = '#FFF193'; // yellow
            }
            else if (statusCode >= 400 && statusCode < 500) {
                this.request.color = '#FF93E7'; // purple
            }

            var logfunc = error ? console.error : console.log;
            logfunc(`AJAX: ${this.request.type} - ${this.request.info} => ${this.request.status} (${this.request.duration}ms)`);
        },

        /**
         * Performs a request against the local API
         */
        localAPIcall: function(info, data, cb) {
            if (this.startAPIcall('local', info, null, data)) {
                jQuery.ajax({
                    method: "POST",
                    url: API_LOCAL,
                    data: JSON.stringify({
                        "info": info,
                        "data": data
                    }),
                    timeout: 10000,
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    success: (data, status, xhr) => {
                        this.endAPIcall(false, xhr.status, xhr.statusText);
                        cb(data);
                    },
                    error: (xhr, status, httperror) => {
                        this.endAPIcall(true, xhr.status, `${xhr.statusText} (${status})`);
                    }
                });
            }
        },

        /**
         * Performs a request that is forwarded to the remote API
         * (the webshell on remote server)
         */
        remoteAPIcall: function(moduleName, handler, data, cb, cbError=null, servid=null) {
            if (this.startAPIcall('remote', moduleName, handler, data)) {
                jQuery.ajax({
                    method: "POST",
                    url: API_REMOTE,
                    data: JSON.stringify({
                        "server": (servid ? servid : this.$store.state.currentSession),
                        "module": moduleName,
                        "data": {
                            "handler": handler,
                            "data": data
                        }
                    }),
                    timeout: 10000,
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    success: (data, status, xhr) => {
                        this.endAPIcall(false, xhr.status, xhr.statusText);
                        if (cb) cb(data);
                    },
                    error: (xhr, status, httperror) => {
                        var msg = xhr.statusText + (xhr.status != 418 ? ` (${status})` : '');
                        this.endAPIcall(true, xhr.status, msg);
                        if (cbError) cbError(xhr.status, xhr.responseText);
                    }
                });
            }
        },

        /**
         * Refresh IP Status
         */
        refreshStatus: function() {
            this.localAPIcall('status', null, (d) => {
                this.status.vpn = d.vpn_status;
                this.status.tor = d.tor_status;

                var dirmode = ('vpn' in d.ipgeoloc) ? 'vpn' : 'direct';
                if ('ip' in d.ipgeoloc[dirmode]) {
                    this.status.geoloc.dir.country = d.ipgeoloc[dirmode].country_code3;
                    this.status.geoloc.dir.city = d.ipgeoloc[dirmode].city;
                    this.status.geoloc.dir.ip = d.ipgeoloc[dirmode].ip;
                }

                if ('tor' in d.ipgeoloc) {
                    this.status.geoloc.tor.country = d.ipgeoloc.tor.country_code3;
                    this.status.geoloc.tor.city = d.ipgeoloc.tor.city;
                    this.status.geoloc.tor.ip = d.ipgeoloc.tor.ip;
                }
            });
        },

        /**
         * Requests a new identity on Tor network,
         * and then a new IP address.
         */
        changeIdentity: function() {
            this.localAPIcall('newnym', null, (d) => {
                this.refreshStatus();
            });
        },

        /**
         * Methods to work with Modals
         *
         * Used to open & close modals.
         */
        modal: function(title, body, cbSubmit, cbCancel=null) {
            this.modalData.title = title;
            this.modalData.body = body;
            this.modalData.cbSubmit = cbSubmit;
            this.modalData.cbCancel = cbCancel;
            this.modalData.activeClass = "active";
        },

        cancelModal: function() {
            this.modalData.activeClass = "";
            if (this.modalData.cbCancel) {
                this.modalData.cbCancel();
            }
        },

        submitModal: function() {
            this.modalData.activeClass = "";
            if (this.modalData.cbSubmit) {
                this.modalData.cbSubmit();
            }
        }
    }
});


/**
 * ==========================================================================
 *  Init
 * ==========================================================================
 */

$(function() {
    // Fetch the list of modules
    app.localAPIcall('modules', null, function(d) {
        moduleList = d;

        for (var m in moduleList) {
            let scriptElement = document.createElement('script');
            scriptElement.src = `/module/${m}.js`;
            document.body.appendChild(scriptElement);
        }

        // Fetch the list of servers
        app.localAPIcall('servers', null, function(d) {
            stateStore.commit('setNbServers', Object.keys(d).length);
            serverList = d;
            //app.refresh_status();
        });
    });
});
