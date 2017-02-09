(function() {
    RLTB.settings = new (function() {
        var __data = {};
        var __callbacks = [];
        var that = this;

        this.set = function(selectorOrObject, value) {
            var object = selectorOrObject;

            if (selectorOrObject === null) {
                object = value;
            } else if (!$.isPlainObject(selectorOrObject)) {
                object = {};

                var selector = selectorOrObject.split(".");

                var objRecursive = object;
                for (var i = 0; i < selector.length - 1; i++) {
                    objRecursive[selector[i]] = {};
                    objRecursive = objRecursive[selector[i]];
                }

                objRecursive[selector[selector.length - 1]] = value;
            }

            __sync(object);
        };

        this.get = function(selector) {
            var selectorArray = [];

            if (typeof selector !== "undefined") {
                selectorArray = selector.split(".");
            }

            var dataObj = __data;
            for (var key in selectorArray) {
                if (typeof dataObj[selectorArray[key]] === "undefined") {
                    return undefined;
                }

                dataObj = dataObj[selectorArray[key]];
            }

            return dataObj;
        };

        this.push = function(selector, value) {
            var currentValue = this.get(selector);

            if (typeof currentValue === "undefined") {
                currentValue = [];
            }

            if (!$.isArray(currentValue)) {
                return false;
            }

            currentValue.push(value);
            this.set(selector, currentValue);
            return true;
        };

        this.onChange = function(callback, selector) {
            var selectorArray = [];
            if (typeof selector !== "undefined") {
                selectorArray = selector.split(".");
            }

            __callbacks.push({
                selector : selectorArray,
                callback : callback
            });
        };

        function __setup() {
            RLTB.workers.on("RLTB_SETTINGS_UPDATE", function(msg) {
                __update(msg.data);
            });

            RLTB.workers.on("RLTB_SETTINGS_SYNC", function(msg) {
                if (RLTB.util.isWorker()) { //only for the settings syncer worker
                    RLTB.workers.send("RLTB_SETTINGS_UPDATE", "UPDATE", msg.data);
                }
            });


            __load();
        }

        function __extend(data) {
            __data = RLTB.util.extend(true, __data, data);
        }

        function __sync(data) {
            RLTB.workers.send("RLTB_SETTINGS_SYNC", "SYNC", data);
        }

        var __ready = false;
        function __update(data) {
            __extend(data);

            for (var index in __callbacks) {
                var selector = __callbacks[index].selector;
                var dataObj = data;

                var skip = false;
                for (var key in selector) {
                    if (typeof dataObj[selector[key]] === "undefined") {
                        skip = true;
                        break;
                    }

                    dataObj = dataObj[selector[key]];
                }

                if (skip) {
                    continue;
                }

                __callbacks[index].callback(dataObj);
            }

            if (RLTB.windows.isMainWindow()) {
                __save();
            } else {
                if (!__ready) {
                    __ready = true;
                    RLTB.scriptReady();
                }
            }
        }

        function __save() {
            localStorage.setItem("RLTB_SETTINGS", JSON.stringify(__data));
        }

        function __load() {
            if (RLTB.windows.isMainWindow()) {
                var loadedData = RLTB.util.extend(true, {}, RLTB.config.settings.default);

                var storedString = localStorage.getItem("RLTB_SETTINGS");
                var storedData = {};
                if (storedString) {
                    storedData = JSON.parse(storedString);
                }

                loadedData = RLTB.util.extend(true, loadedData, storedData);

                that.set(null, loadedData);
                RLTB.scriptReady();

            } else {
                RLTB.workers.send("RLTB_SETTINGS_REQUEST", "", {});
            }
        }

        __setup.call(this);
    })();

    console.log("settings.js scriptReady");
})();

