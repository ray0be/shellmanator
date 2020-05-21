// core.component

Vue.component('module-core', {
    props: ['session', 'module', 'isModule'],
    data: function() {
        return {
            //
        };
    },
    template: `
        <section style="">
            Module CORE - welcome page
        </section>`,
    computed: {
        //
    },
    methods: {
        wakeUp: function(firstTime) {
            //
        },
    }
});
