var RLTB = new (function() {

    var __connectBuffer = [];

    self.onconnect = function(evt) {
        __connectBuffer.push(evt);
    };

    this.onconnect = function(fn) {
        self.onconnect = fn;

        for (var key in __connectBuffer) {
            fn(__connectBuffer[key]);
        }

        __connectBuffer = [];
    };

    var subScripts = [
        "/vendor/rltb/lib/rltb.util.js",
        "/vendor/rltb/lib/rltb.core.js",
        "/vendor/rltb/lib/rltb.overbug.js",
        "/vendor/rltb/lib/rltb.games.js",
        "/vendor/rltb/lib/rltb.windows.js",
        "/vendor/rltb/lib/rltb.workers.js",
        "/vendor/rltb/lib/rltb.rpc.js",
        "/vendor/rltb/lib/rltb.settings.js",
        "/vendor/rltb/lib/rltb.loca.js",
        "/vendor/rltb/lib/rltb.templates.js"
    ];

    var __readyCallbacks = [];
    var __hold = 0;

    this.ready = function(callback) {
        if (__hold === 0) {
            setTimeout(function() {
                callback();
            });
            return;
        }

        __readyCallbacks.push(callback);
    };

    function triggerReady() {
        console.warn("TRIGGER READY");
        for (var key in __readyCallbacks) {
            __readyCallbacks[key]();
        }
    }

    this.holdReady = function(hold) {
        if (hold) {
            __hold++;
        } else {
            __hold--;
            if (__hold <= 0) {
                setTimeout(function() {
                    triggerReady();
                });
            }
        }
    };

    this.holdReady(true);

    function isWorker() {
        return typeof importScripts !== "undefined";
    }

    this.scriptReady = function() {
        console.warn(subScripts[__currentScript] + " ready.");
        __currentScript++;

        loadNextScript();
    };

    var __currentScript = 0;
    function loadNextScript() {
        if (__currentScript >= subScripts.length) {
            that.loadResourceFile(null, function() {
                that.holdReady(false);
            });
            return;
        }

        loadScript(subScripts[__currentScript]);
    }

    var that = this;
    this.loadResources = function(data, callback) {
        this.loadScripts(data.js, function() {
            that.loadCSS(data.css, function() {
                if (data.import && data.import.length > 0) {
                    var __callbacks = 0;
                    for (var index in data.import) {
                        that.loadResourceFile(data.import[index], function() {
                            if (++__callbacks === data.import.length) {
                                callback && callback();
                            }
                        });
                    }
                } else {
                    callback && callback();
                }
            });
        });
    };

    this.loadResourceFile = function(path, callback) {
        if (!path) {
            if (isWorker()) {
                path = self.location.search.substr("?file=".length);
                path = path.replace(".js", ".resource.json");
            } else {
                path = RLTB.windows.getCurrentWindowPath();
                path = path.replace(".html", ".resource.json");
            }
        }

        if (path.indexOf("/") === 0) {
            path = path.substring(1);
        }

        console.log("Loading resource file from '" + path + "'");
        $.ajax({
            url: "/" + path,
            dataType: 'text',
            success : function(d) {
                var data = JSON.parse(d);
                that.loadResources(data, callback);
            },
            error : function() {
                callback && callback();
            }
        });
    };

    function loadScript(path, onScriptLoaded) {
        console.log("Loading script " + path);
        if (isWorker()) {
            setTimeout(function() {
                importScripts(path);
                if (onScriptLoaded) {
                    onScriptLoaded();
                }
            });
        } else {
            $.getScript(path, function() {
                if (onScriptLoaded) {
                    onScriptLoaded();
                }
            });
        }
    }

    this.loadScript = function(path, onScriptLoaded) {
        loadScript(path, function() {
            console.log("Loaded " + path);
            onScriptLoaded && onScriptLoaded();
        });
    };

    this.loadScripts = function(paths, onScriptsLoaded) {
        if (paths.length === 0) {
            if (onScriptsLoaded) {
                onScriptsLoaded();
            }

            return;
        }

        console.log(paths);

        var that = this;
        this.loadScript(paths.shift(), function() {
            that.loadScripts(paths, onScriptsLoaded);
        });
    };

    this.loadCSS = function(paths, onCSSLoaded) {
        if (onCSSLoaded) {
            onCSSLoaded();
        }
    };

    var that = this;
    function jQueryLoaded() {
        loadNextScript();
    }

    if (typeof jQuery !== "undefined") {
        jQueryLoaded();
        return;
    }

    if (isWorker()) {
        importScripts("/vendor/rltb/vendor/jquery/jquery.nodom.js");
        jQueryLoaded();
    } else {
        //Taken from http://stackoverflow.com/a/14786759/792725

        // adding the script tag to the head as suggested before
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = "/vendor/rltb/vendor/jquery/jquery-2.1.1.js";

        // then bind the event to the callback function
        // there are several events for cross browser compatibility
        script.onreadystatechange = jQueryLoaded;
        script.onload = jQueryLoaded;

        // fire the loading
        head.appendChild(script);
    }
})();