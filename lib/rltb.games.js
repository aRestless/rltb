(function() {
    if (typeof overwolf === "undefined") {
        RLTB.scriptReady();
        return;
    }
    RLTB.games = new (function() {

        this.onGamePropertyChanged = function(callback) {
            var cb = callback;
            overwolf.games.onGameInfoUpdated.addListener(function(gameInfoChangedData) {
                cb(gameInfoChangedData);
            });
        };

        this.onResolutionChanged = function(callback) {
            var __currentResolution = {width: 0, height: 0};
            this.onGamePropertyChanged(function(gameInfoChangedData) {
                if (!gameInfoChangedData || !gameInfoChangedData.gameInfo) {
                    return;
                }

                var width = gameInfoChangedData.gameInfo.width;
                var height = gameInfoChangedData.gameInfo.height;

                if (width !== __currentResolution.width || height !== __currentResolution.width) {
                    __currentResolution = {
                        width : width,
                        height : height
                    };

                    callback && callback(width, height);
                }
            });
        };

        var __currentGameProperties;
        this.onGamePropertyChanged(function(gameInfoChangedData) {
            if (!gameInfoChangedData || !gameInfoChangedData.gameInfo) {
                return;
            }

            __currentGameProperties = gameInfoChangedData.gameInfo;
        });

        this.getResolution = function() {
            return {
                width : (__currentGameProperties && __currentGameProperties.width) || 0,
                height : (__currentGameProperties && __currentGameProperties.height) || 0
            };
        };

        this.onGameFocusChanged = function(callback) {
            this.onGamePropertyChanged(function(gameInfoChangedData) {
                if (gameInfoChangedData && gameInfoChangedData.focusChanged) {
                    callback && callback(gameInfoChangedData.gameInfo.isInFocus);
                }
            });
        };

        this.onGameClosed = function(gameName, callback) {
            this.onGamePropertyChanged(function(gameInfoChangedData) {
                if (!gameInfoChangedData || !gameInfoChangedData.gameInfo) {
                    return;
                }

                if (gameInfoChangedData.gameInfo.title === gameName && !gameInfoChangedData.gameInfo.isRunning) {
                    callback && callback();
                }
            });
        };

        overwolf.games.getRunningGameInfo(function(gameInfo) {
            __currentGameProperties = gameInfo;
            RLTB.scriptReady();
        });
    })();
})();