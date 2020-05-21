<?php

class CoreModule extends BaseModule
{
    /**
     * The only un-timestamped request.
     * Used as healthstatus to see if the server is OK.
     * Returns the timestamp of the server, for protecting later requests
     * against replay attacks.
     * Also returns the list of available modules.
     */
    public function api_healthstatus() {
        global $MODULES;
        header("HTTP/1.1 418 I'm a teapot");
        return jsonback(array(
            'time' => time(),
            'modules' => $MODULES
        ));
    }
}
