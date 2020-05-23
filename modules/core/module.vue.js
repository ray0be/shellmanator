// core.component

Vue.component('module-core', {
    props: ['session', 'module', 'isModule'],
    data: function() {
        return {
            noteContent: "",
            noteContentInitial: ""
        };
    },
    template: `
        <section style="color:black;background-image:linear-gradient(to bottom right, #E3FF9D, #FFDE85);">
            <div class="columns">
                <div class="column col-6">
                    <h2>Welcome to this server !</h2>
                    <dl>
                        <dt>Server description</dt>
                        <dd>{{ server.desc }}</dd>

                        <dt>Domain</dt>
                        <dd>{{ server.domain }}</dd>

                        <dt>Romanishell URL</dt>
                        <dd>{{ server.url }}</dd>

                        <dt>Secret Key <a @click="renewSecretKey" title="Renew"><span class="silkicon arrow_refresh"></span></a></dt>
                        <dd>{{ server.secretkey }}</dd>
                    </dl>
                </div>
                <div class="column col-6">
                    <h2>Notes</h2>
                    <textarea class="form-input" rows="10" @blur="saveNote" placeholder="Enter notes" v-model="noteContent"></textarea>
                </div>
            </div>
            <div class="columns" style="margin-bottom:25px;">
                <div class="column">
                    <h2>List of modules</h2>

                    <table class="table table-hover" style="background:#FBFFD4;">
                        <thead>
                            <tr>
                                <th>Module</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(mod, modid) in listOfAllModules()">
                                <td>
                                    <span :class="'silkicon ' + mod.icon"></span> <strong>{{ mod.title }}</strong>
                                    <br><small>{{ mod.desc }}</small>
                                </td>
                                <td><span v-if="hasAvailableModule(modid)" class="text-success">Available</span></td>
                                <td>
                                    <a @click="removeModule(modid)" v-if="hasAvailableModule(modid) && modid !== 'core'" title="Remove this module"><span class="silkicon cross"></span> Remove</a>
                                    <a @click="addModule(modid)" v-else-if="modid !== 'core'" title="Add this module"><span class="silkicon add"></span> Add</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>`,
    computed: {
        server: function() {
            if (this.session in serverList) {
                return serverList[this.session];
            }
            return null;
        }
    },
    methods: {
        /**
         * This function is called each time the user ask to display the
         * module. When it's the first time in the session that this module is
         * displayed, firstTime is True.
         * This may be useful to fetch data automatically, on first access only.
         */
        wakeUp: function(firstTime) {
            if (firstTime) {
                app.localAPIcall('getnote', {"servid":this.session}, (d) => {
                    if ('content' in d) {
                        this.noteContent = d.content;
                        this.noteContentInitial = d.content;
                    }
                });
            }
        },

        /**
         * Save the content of the note
         */
        saveNote: function() {
            if (this.noteContent !== this.noteContentInitial) {
                app.localAPIcall('savenote', {"servid":this.session, "content":this.noteContent}, (d) => {
                    this.noteContentInitial = this.noteContent;
                });
            }
        },

        /**
         * Modules info
         */
        listOfAllModules: function() {
            return moduleList;
        },
        listOfAvailableModules: function() {
            if (this.session in sessionList) {
                return sessionList[this.session].listOfModules();
            }
            return null;
        },
        hasAvailableModule: function(modid) {
            return modid in this.listOfAvailableModules();
        },

        /**
         * Helper used to generate a new romanishell and confirm its upload.
         */
        generateAndUpdateRomanishell: function(title, html, modules, newKey=false) {
            app.modal(`${title} - 1/2`, html, ()=>{
                app.localAPIcall('genshell', {'servid':this.session, 'key':(newKey ? 'new' : ''), 'modules':modules}, (d) => {
                    if ('secretkey' in d && 'shell' in d) {
                        html = `<p>The new romanishell has been generated.</p>
                            <p>Check the file <strong>${d.shell}</strong> and continue if everything seems OK.</p>`;
                        app.modal(`${title} - 2/2`, html, ()=>{
                            this.apiCall('update', {'secretkey':d.secretkey}, (d)=>{
                                if (d.success) {
                                    //sessionList[this.session].modules = {};
                                    var nextSteps = ()=>{
                                        delete sessionList[this.session];
                                        this.$store.commit('setSession', null);
                                        this.$store.commit('setModule', null);

                                        app.pleasewait = true;
                                        setTimeout(()=>{
                                            eventHub.$emit('open-session', this.session);
                                            app.pleasewait = false;
                                        }, 5000);
                                    };

                                    if (newKey) {
                                        app.localAPIcall('servers', null, (d)=>{
                                            stateStore.commit('setNbServers', Object.keys(d).length);
                                            serverList = d;
                                            nextSteps();
                                        });
                                    }
                                    else {
                                        nextSteps();
                                    }
                                }
                            }, ()=>{
                                alert('Une erreur est survenue.');
                            });
                        });
                    }
                }, ()=>{
                    alert('Une erreur est survenue.');
                });
            });
        },

        /**
         * Change the secret key
         */
        renewSecretKey: function() {
            var html = `
                <p>You are about to change the secret key.</p>
                <p class="text-error">Caution: this will completely update the remote romanishell.</p>
                <p>If you don't have a specific reason to do that, you should consider canceling this action.</p>
            `;
            this.generateAndUpdateRomanishell('Renewing the secret key', html, Object.keys(this.listOfAvailableModules()), true);
        },

        /**
         * Add a new module to the remote server.
         */
        addModule: function(modid) {
            var list = '';
            var tabmodules = [];
            for (let mid in this.listOfAvailableModules()) {
                list += (list!='') ? ', ' : '';
                list += moduleList[mid].title;
                tabmodules.push(mid);
            }
            list += ', ' + moduleList[modid].title;
            tabmodules.push(modid);

            var html = `
                <p>You are about to add the <strong>${moduleList[modid].title}</strong> module to the remote server.</p>
                <p class="text-error">Caution: this will completely update the remote romanishell.</p>
                <p>Below is the full list of modules once this task is complete:</p>
                <p class="text-primary">${list}</p>
            `;
            this.generateAndUpdateRomanishell('Adding a module', html, tabmodules);
        },

        /**
         * Remove a module from the remote server.
         */
        removeModule: function(modid) {
            var list = '';
            var tabmodules = Object.keys(this.listOfAvailableModules());
            var bckTitle = moduleList[modid].title;
            tabmodules.splice(tabmodules.indexOf(modid), 1);
            for (let mid of tabmodules) {
                list += (list!='') ? ', ' : '';
                list += moduleList[mid].title;
            }

            var html = `
                <p>You are about to remove the <strong>${bckTitle}</strong> module from the remote server.</p>
                <p class="text-error">Caution: this will completely update the remote romanishell.</p>
                <p>Below is the full list of modules once this task is complete:</p>
                <p class="text-primary">${list}</p>
            `;
            this.generateAndUpdateRomanishell('Removing a module', html, tabmodules);
        }
    }
});
