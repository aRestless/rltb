(function() {
    RLTB.config = {
        workers : {
            "rltb.workers.syncer" : {
                file : "/vendor/rltb/lib/rltb.workers.syncer.js",
                subscriptions : [
                    "RLTB_SETTINGS",
                    "RLTB_SETTINGS_UPDATE",
                    "RLTB_SETTINGS_SYNC",
                    "RLTB_SETTINGS_REQUEST",
                    "RLTB_RPC"
                ]
            }
        },
        overbug : {

        },
        loca : {
            file : "/rltb.loca.json",
            defaultLanguage: "en"
        }
        //default values
    };

    RLTB.core = new (function() {
        function loadConfigFile(filePath, suppressReady) {
            console.log("Loading " + filePath);
            $.ajax({
                url : filePath,
                async: false,
                success : function(data) {
                    console.log(data);
                    var config = JSON.parse(data);
                    RLTB.util.extend(true, RLTB.config, config);

                    if (config.import) {
                        for (var key in config.import) {
                            loadConfigFile(config.import[key], true);
                        }
                    }


                    if (!suppressReady) {
                        __fireReady();
                    }

                },
                error : function() {

                }
            });
        }
        function __fireReady() {
            RLTB.scriptReady();
        }

        
        
        loadConfigFile("/rltb.conf.json");
    })();

    RLTB.config.getCurrent = function() {
        if (RLTB.util.isWorker()) {
            return RLTB.config[RLTB.workers.getCurrentWorkerName()]
        }

        return RLTB.config[RLTB.util.getCurrentWindowName()];
    }
})();