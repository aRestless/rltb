(function() {
    RLTB.windows = new (function() {
        var __currentWindowName;
        var __manifest;

        if (typeof overwolf !== "undefined") {
            overwolf.extensions.current.getManifest(function(result) {
                __manifest = result;
                overwolf.windows.getCurrentWindow(function(result) {
                    __currentWindowName = result.window.name;
                    RLTB.scriptReady();
                });
            });
        } else {
            RLTB.scriptReady();
        }

        this.isMainWindow = function() {
            return !RLTB.util.isWorker() && (__manifest.data.start_window === __currentWindowName);
        };

        this.getCurrentWindowName = function() {
            return __currentWindowName;
        };

        this.getCurrentWindowPath = function() {
            return this.getManifest().data.windows[this.getCurrentWindowName()].file;
        };

        this.open = function () {
            for (var i = 0; i < arguments.length; i++) {
                overwolf.windows.obtainDeclaredWindow(arguments[i], function (result) {
                    overwolf.windows.restore(result.window.id, function () {});
                });
            }
        };
        
        this.close = function() {
            if (arguments.length === 0 || (arguments.length === 1 && $.isFunction(arguments[0]))) {
                overwolf.windows.getCurrentWindow(function (result) {
                    overwolf.windows.close(result.window.id, function () {
                        localStorage.setItem("windows.close." + result.window.id, Date.now());
                        if (arguments.length === 1 && $.isFunction(arguments[0])) {
                            arguments[0]();
                        }
                    });
                });
            }

            var length = arguments.length;
            var callback = undefined;

            if ($.isFunction(arguments[length - 1])) {
                callback = arguments[length - 1];
                length = length - 1;
            }

            var callbacksReceived = 0;

            for (var i = 0; i < length; i++) {
                overwolf.windows.obtainDeclaredWindow(arguments[i], function (result) {
                    overwolf.windows.close(result.window.id, function () {
                        callbacksReceived++;
                        if (callback && callbacksReceived === length) {
                            callback();
                        }
                    });
                });
            }
        };
        
        this.closeAll = function() {
            var windowList = [];
            overwolf.extensions.current.getManifest(function(result) {
                for (var w in result.data.windows) {
                    windowList.push(w);
                }
                RLTB.windows.close.apply(this, windowList);
            });
        };

        this.minimize = function() {
            if (arguments.length === 0) {
                overwolf.windows.getCurrentWindow(function (result) {
                    overwolf.windows.minimize(result.window.id, function () {});
                });
            }

            if (arguments.length === 1) {
                if (windows.isFunction(arguments[0])) {
                    overwolf.windows.getCurrentWindow(function (result) {
                        overwolf.windows.minimize(result.window.id, arguments[0]);
                    });
                    return;
                }
            }

            for (var i = 0; i < arguments.length; i++) {
                overwolf.windows.obtainDeclaredWindow(arguments[i], function (result) {
                    overwolf.windows.minimize(result.window.id, function () {});
                });
            }
        };

        this.restore = function(callback) {
            overwolf.windows.getCurrentWindow(function(result) {
                overwolf.windows.restore(result.windows.id, function() {
                    callback && callback();
                });
            });
        };

        this.getManifest = function() {
            return __manifest;
        };

        this.onClose = function() {
            console.error("Implement Me!");
        };

        this.changeSize = function(width, height) {
            overwolf.windows.getCurrentWindow(function(result) {
                if (result.window.width !== width ||result.window.height !== height) {
                    overwolf.windows.changeSize(result.window.id, width, height);
                }
            });
        };

        this.changePositionAndSize = function(x,y,width,height) {
            console.log("Resizing to " + width + "x" + height);
            overwolf.windows.getCurrentWindow(function(result) {
                if (result.window.width !== width ||result.window.height !== height) {
                    overwolf.windows.changeSize(result.window.id, width, height);
                }

                if (result.window.left !== x ||result.window.top !== y) {
                    overwolf.windows.changePosition(result.window.id, x, y);
                }
            });
        };

        this.centerAroundMouse = function() {
            var that = this;
            overwolf.games.inputTracking.getMousePosition(function(mouse) {
                if (!mouse || mouse.status !== "success") {
                    return;
                }

                that.centerAround(mouse.mousePosition.x, mouse.mousePosition.y);
            });
        };

        this.centerAround = function(x, y) {
            overwolf.windows.getCurrentWindow(function(wndw) {
                overwolf.windows.changePosition(wndw.window.id, Math.round(x) - Math.round(wndw.window.width  / 2), Math.round(y) - Math.round(wndw.window.height  / 2));
            });
        };

        this.getCurrentWindow = function(callback){
            overwolf.windows.getCurrentWindow(callback);
        };

        this.keepInFullscreen = function() {
            var that = this;
            RLTB.games.onResolutionChanged(function(width, height) {
                that.changePositionAndSize(0,0, width, height);
            });

            var currentResolution = RLTB.games.getResolution();
            that.changePositionAndSize(0,0,currentResolution.width, currentResolution.height);
        };

        this.closeWithGame = function(gameName) {
            var that = this;
            RLTB.games.onGameClosed(gameName, function() {
                that.close();
            });
        }
    })();
})();