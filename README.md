# The Shellmanator

The Shellmanator is a PHP-webshells orchestrator.

![WORK IN PROGRESS](https://lh3.googleusercontent.com/qCbfU3gxX76gR5LCV3yCr-JcMa6B_r5PJhe736LZRXnHx0jTxWA47PPmwqUq5jSMSuM)

It enables you to run commands on remote servers, extract information, manage
FTP, access databases, etc.

Basically, you upload the special webshell (so called "romanishell") to a
remote server, and you add it to a local application that runs on your machine,
so the local app maintains a list of all your registered servers.

**The local application** = *The Shellmanator* = A Python webserver that runs
on your machine and provides a web interface to manage all your servers.

**The remote webshells** = *romanishells* = PHP scripts that are uploaded on
the remote servers you want to control. They act as APIs and respond to
HTTP(S) requests.

At the time of upload, the remote webshell is minimalist and lightweight.
From the Local App, you may add some modules to the standard romanishell, in
order to get more features (terminal, ftp, database access, etc.).
When you add modules, the romanishell is able to upgrade itself remotely. It
just takes you one click.


## Disclaimer

The Shellmanator is <ins>designed for educational purpose and/or to be used as
a penetration testing tool</ins>. Even if there is an authentication mechanism,
**you MUST NOT use this tool for a real-world server administration** because
it'd expose your host to high security risks.

I want to be as clear as possible : DO NOT let a webshell (romanishell) on
your or someone else's system. If you need to admin a Linux machine, prefer a
standard and secure method.


## Technologies

Requirements (local app) :

* Python 3
* PHP 5.6+
* Firefox / Chrome (latest)

Requirements (remote servers) :

* PHP 5.6+

Credits :

* Python :
  * [Totoro 1.1.2](https://github.com/ray0be/totororequests) ([MIT](https://opensource.org/licenses/MIT))
  * [Flask 1.1.2](https://flask.palletsprojects.com/en/1.1.x/) ([Flask License](https://flask.palletsprojects.com/en/1.1.x/license/))
  * [Requests 2.23.0](https://requests.readthedocs.io/en/master/) ([Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0))
* Javascript :
  * [Vue.js v2.6.11](https://vuejs.org/) ([MIT](https://opensource.org/licenses/MIT))
  * [Vuex v3.4.0](https://vuex.vuejs.org) ([MIT](https://opensource.org/licenses/MIT))
  * [CodeMirror v5.53.2](https://codemirror.net/) ([MIT](https://opensource.org/licenses/MIT))
  * [jQuery v3.5.1](https://jquery.com/) ([MIT](https://opensource.org/licenses/MIT))
  * [jQuery timeago 1.6.7](https://timeago.yarp.com/) ([MIT](https://opensource.org/licenses/MIT))
* CSS :
  * [Spectre.css 0.5.8](https://picturepan2.github.io/spectre/index.html) ([MIT](https://opensource.org/licenses/MIT))
* Icons :
  * [FAMFAMFAM Silk Icons 1.3](http://www.famfamfam.com/lab/icons/silk/) ([CC A 2.5](https://creativecommons.org/licenses/by/2.5/))


## Versions

History :

/

