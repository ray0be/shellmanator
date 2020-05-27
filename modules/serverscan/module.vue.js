// serverscan.component

Vue.component('module-serverscan-block', {
    props: ['size', 'maxheight', 'title', 'data', 'bgcolor'],
    template: `
        <div :class="'column col-' + size">
            <div :class="'panel ' + (bgcolor ? 'bg-'+bgcolor : 'bg-gray')" style="margin-bottom:15px;">
                <div class="panel-header">
                    <div class="panel-title">{{ title }}</div>
                </div>
                <div class="panel-body" :style="'padding-bottom:10px;overflow:auto;'+(maxheight ? 'max-height:'+maxheight+'px' : '')">
                    <!-- Command return -->
                    <div v-if="typeof data == 'object' && !Array.isArray(data) && 'method' in data && 'exit' in data && 'stdout' in data && 'stderr' in data">
                        <pre style="margin:0;margin-bottom:10px;"><!--
                            --><div v-for="line in data.stdout" v-if="line.trim() != ''">{{ line }}</div><!--
                            --><div v-for="line in data.stderr" v-if="line.trim() != ''" class="text-error">{{ line }}</div><!--
                        --></pre>
                    </div>

                    <!-- Simple string -->
                    <div v-else-if="typeof data == 'string'" style="margin-bottom:10px;">
                        {{ data }}
                    </div>

                    <!-- Array -->
                    <div v-else-if="typeof data == 'object' && Array.isArray(data)" style="margin-bottom:10px;">
                        {{ data.join(', ') }}
                    </div>

                    <!-- PHP associative array / JS object -->
                    <div v-else-if="typeof data == 'object' && !Array.isArray(data)">
                        <ul style="margin:0;margin-bottom:10px;">
                            <li v-for="(val, elem) in data" style="margin-top:0;">
                                <strong>{{ elem }}</strong> :
                                <span v-if="typeof val == 'boolean' && val" class="text-success">OK</span>
                                <span v-else-if="typeof val == 'boolean'" class="text-error">NOK</span>
                                <span v-else>{{ val }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>`
});

Vue.component('module-serverscan', {
    props: ['session', 'module', 'isModule'],
    data: function() {
        return {
            info: {}
        };
    },
    template: `
        <section style="color:black;background-image:linear-gradient(to bottom right, #A1ADB0, #D6D9DC);">
            <div class="container" v-if="Object.keys(info).length">
                <h3>Basics</h3>
                <div class="columns">
                    <module-serverscan-block bgcolor="secondary" size="4" title="Basics" maxheight="150" :data="{'uname':info.uname.stdout.join(''), 'uptime':info.uptime.stdout.join(''), 'date':info.date.stdout.join(''), 'whoami':info.whoami.stdout.join(''), 'groups':info.mygroups.stdout.join('')}"></module-serverscan-block>
                    <module-serverscan-block size="8" title="Last logins" maxheight="150" :data="info.last"></module-serverscan-block>
                </div>

                <h3>Web Server</h3>
                <div class="columns">
                    <module-serverscan-block bgcolor="warning" size="3" title="Versions" maxheight="150" :data="{'PHP':info.phpversion, 'Server Software':info.serversoftware, 'Server Signature':info.serversignature.replace(/<\\/?address>/gi, '')}"></module-serverscan-block>
                    <module-serverscan-block size="3" title="Apache Modules" maxheight="150" :data="info.apachemodules"></module-serverscan-block>
                    <module-serverscan-block size="3" title="PHP Extensions" maxheight="150" :data="info.phpextensions"></module-serverscan-block>
                    <module-serverscan-block size="3" title="PHP Functions" maxheight="150" :data="info.phpfunctions"></module-serverscan-block>
                </div>

                <h3>System</h3>
                <div class="columns">
                    <module-serverscan-block bgcolor="dark" size="4" title="hostnamectl" maxheight="150" :data="info.hostnamectl"></module-serverscan-block>
                    <module-serverscan-block size="5" title="/etc/passwd" maxheight="150" :data="info.users"></module-serverscan-block>
                    <module-serverscan-block size="3" title="/proc/meminfo" maxheight="150" :data="info.meminfo"></module-serverscan-block>
                </div>

                <h3>Processes</h3>
                <div class="columns">
                    <module-serverscan-block bgcolor="primary" size="12" title="top" maxheight="200" :data="info.top"></module-serverscan-block>

                    <module-serverscan-block :size="8" title="ps" maxheight="250" :data="info.ps"></module-serverscan-block>
                    <module-serverscan-block :size="4" title="Databases" maxheight="250" :data="databases"></module-serverscan-block>
                </div>

                <h3>Network</h3>
                <div class="columns">
                    <module-serverscan-block bgcolor="success" size="6" title="IP" maxheight="200" :data="info.ip"></module-serverscan-block>
                    <module-serverscan-block size="6" title="netstat" maxheight="200" :data="info.netstat"></module-serverscan-block>

                    <module-serverscan-block size="6" title="Routes" maxheight="150" :data="info.routes"></module-serverscan-block>
                    <module-serverscan-block size="6" title="cURL" maxheight="150" :data="{'curl':info.curl.version, 'ssl':info.curl.ssl_version, 'libz':info.curl.libz_version, 'protocols':info.curl.protocols.join(', ')}"></module-serverscan-block>
                </div>

                <h3>Disk</h3>
                <div class="columns">
                    <module-serverscan-block size="6" title="Content : /" maxheight="150" :data="info.rootfs"></module-serverscan-block>
                    <module-serverscan-block size="6" title="Content : /home" maxheight="150" :data="info.homedirs"></module-serverscan-block>

                    <module-serverscan-block size="6" title="df" maxheight="200" :data="info.df"></module-serverscan-block>
                    <module-serverscan-block bgcolor="error" size="6" title="lsblk" maxheight="200" :data="info.lsblk"></module-serverscan-block>

                    <module-serverscan-block size="12" title="mount" maxheight="150" :data="info.mount"></module-serverscan-block>
                    <module-serverscan-block size="12" title="/etc/fstab" maxheight="150" :data="info.fstab"></module-serverscan-block>
                </div>
            </div>

            <!-- # Webserver, version & modules
            'serversoftware' => isset($_SERVER['SERVER_SOFTWARE']) ? $_SERVER['SERVER_SOFTWARE'] : null,
            'serversignature' => isset($_SERVER['SERVER_SIGNATURE']) ? $_SERVER['SERVER_SIGNATURE'] : null,
            'apachemodules' => checkfunc('apache_get_modules') ? apache_get_modules() : null,
            # PHP Version, function & extensions
            'phpversion' => phpversion(),
            'curl'
            'phpfunctions' => check_functions(),
            'phpextensions' => get_loaded_extensions(),

            # Database checks
            'databases' => array(
                'mysql' => runcmd('mysql --version'),
                'mariadb' => runcmd('mariadb --version'),
                'postgresql' => runcmd('psql --version'),
                'mongo' => runcmd('mongo --version'),
                'redis' => runcmd('redis-server -v'),
            ),

            # List of users
            'users' => runcmd('cat /etc/passwd'),
            # List of home directories
            'homedirs' => runcmd('ls -lh /home | grep ^d'),
            # List of root filesystem
            'rootfs' => runcmd('ls -lh /'),

            # Hostnamectl
            'hostname' => runcmd('hostnamectl'),
            # Disk info (partitions, total/free space)
            'df' => runcmd('df -kh --total'),
            'lsblk' => runcmd('lsblk'),
            'fstab' => runcmd('cat /etc/fstab'),
            # RAM info (total/free space)
            'meminfo' => runcmd('cat /proc/meminfo'),
            # Processes snapshot
            'top' => runcmd('top -b -n1'),
            'ps' => runcmd('ps auxwwf'),
            # Listening ports / services
            'netstat' => runcmd('netstat -ntupl 2>/dev/null'),
            # IP config (ip, routes)
            'ip' => runcmd('ip a'),
            'routes' => runcmd('ip r') -->
        </section>`,
    computed: {
        databases: function() {
            var tab = {};
            if ('databases' in this.info) {
                for (var db in this.info.databases) {
                    if (this.info.databases[db].exit == 0) {
                        tab[db] = this.info.databases[db].stdout.join(' | ');
                    }
                    else {
                        tab[db] = false;
                    }
                }
            }
            return tab;
        }
    },
    methods: {
        wakeUp: function(firstTime) {
            if (firstTime) {
                this.apiCall('allinfo', {}, (data)=>{
                    this.info = Object.assign({}, this.info, data);
                });
            }
        },
    }
});
