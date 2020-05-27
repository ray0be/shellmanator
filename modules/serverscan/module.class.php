<?php

class ServerscanModule extends BaseModule
{
    private $_funclist = array(
        'openssl_random_pseudo_bytes',
        'openssl_cipher_iv_length',
        'openssl_encrypt',
        'openssl_decrypt',
        'hash_hmac',
        'hash_equals',

        'base64_encode',
        'base64_decode',
        'eval',
        'call_user_func',
        'json_encode',
        'json_decode',

        'system',
        'exec',
        'shell_exec',
        'passthru',

        'proc_open',
        'proc_close',
        'stream_get_contents',

        'ob_start',
        'ob_get_contents',
        'ob_end_clean',

        'file_get_contents',
        'highlight_file',
        'show_source',
        'readfile',

        'move_uploaded_file',
        'file_put_contents',

        'fopen',
        'fread',
        'fclose',
        'filesize',
        'filetype',
        'lstat',
        'posix_getpwuid',
        'posix_getgrgid',

        'scandir',
        'glob',
        'rename',
        'mkdir',
        'rmdir',
        'touch',
        'unlink',

        'phpversion',
        'phpinfo',
        'php_uname',

        'curl_init',
        'curl_exec',
    );

    /**
     * Checks the entire list of function to detect which functions are not
     * available on this server.
     */
    private function check_functions() {
        $checkedlist = array();

        foreach ($this->_funclist as $func) {
            $checkedlist[$func] = checkfunc($func);
        }

        return $checkedlist;
    }

    /**
     * Returns server information.
     */
    public function api_allinfo() {
        return jsonback(array(
            # Uname
            'uname' => runcmd('uname -a'),
            # Uptime
            'uptime' => runcmd('uptime -p'),
            # Last logins
            'last' => runcmd('last -Fan 100'),
            # Server date
            'date' => runcmd('date'),

            # Webserver, version & modules
            'serversoftware' => isset($_SERVER['SERVER_SOFTWARE']) ? $_SERVER['SERVER_SOFTWARE'] : null,
            'serversignature' => isset($_SERVER['SERVER_SIGNATURE']) ? $_SERVER['SERVER_SIGNATURE'] : null,
            'apachemodules' => checkfunc('apache_get_modules') ? @apache_get_modules() : null,
            # PHP Version, function & extensions
            'phpversion' => @phpversion(),
            'phpfunctions' => $this->check_functions(),
            'phpextensions' => @get_loaded_extensions(),

            # Database checks
            'databases' => array(
                'mysql' => runcmd('mysql --version'),
                'mariadb' => runcmd('mariadb --version'),
                'postgresql' => runcmd('psql --version'),
                'mongo' => runcmd('mongo --version'),
                'redis' => runcmd('redis-server -v'),
            ),

            # Webserver user
            'whoami' => runcmd('whoami'),
            'mygroups' => runcmd('groups'),
            # List of users
            'users' => runcmd('cat /etc/passwd'),
            # List of home directories
            'homedirs' => runcmd('ls -lh /home'),
            # List of root filesystem
            'rootfs' => runcmd('ls -lh /'),

            # Hostnamectl
            'hostnamectl' => runcmd('hostnamectl'),
            # Disk info (partitions, total/free space)
            'df' => runcmd('df -kh --total'),
            'lsblk' => runcmd('lsblk'),
            'fstab' => runcmd('cat /etc/fstab'),
            'mount' => runcmd('mount'),
            # RAM info (total/free space)
            'meminfo' => runcmd('cat /proc/meminfo'),
            # Processes snapshot
            'top' => runcmd('top -b -n1'),
            'ps' => runcmd('ps auxwwf'),
            # Listening ports / services
            'netstat' => runcmd('netstat -ntupl 2>/dev/null'),
            # IP config (ip, routes)
            'ip' => runcmd('ip a'),
            'routes' => runcmd('ip r'),
            # curl
            'curl' => @curl_version(),
        ));
    }
}
