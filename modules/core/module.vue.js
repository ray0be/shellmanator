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

                        <dt>Secret Key <a @onclick="" title="Renew"><span class="silkicon arrow_refresh"></span></a></dt>
                        <dd>{{ server.secretkey }}</dd>
                    </dl>
                </div>
                <div class="column col-6">
                    <h2>Notes</h2>
                    <textarea class="form-input" rows="10" @blur="saveNote" placeholder="Enter notes" v-model="noteContent"></textarea>
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
        saveNote: function() {
            if (this.noteContent !== this.noteContentInitial) {
                app.localAPIcall('savenote', {"servid":this.session, "content":this.noteContent}, (d) => {
                    this.noteContentInitial = this.noteContent;
                });
            }
        }
    }
});
