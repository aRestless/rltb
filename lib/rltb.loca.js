(function() {
    RLTB.loca = new (function() {
        var __translations = {};

        function __get(language, key) {
            var selector = key.split(".");
            var obj = __translations[language];

            for (var i = 0; i < selector.length; i++) {
                if (typeof obj === "undefined") {
                    return false;
                }

                obj = obj[selector[i]];
            }

            return obj;
        }

        this.get = function(key) {
            var currentLanguage = RLTB.util.getCurrentLanguage();
            var result = __get(currentLanguage, key);

            if (result !== false) {
                return result;
            }

            var defaultLanguage = RLTB.config.loca.defaultLanguage;

            if (currentLanguage !== defaultLanguage) {
                return __get(defaultLanguage, key) || key;
            }

            return key;
        };

        function __load(locaFile) {
            $.ajax({
                url: locaFile,
                async: false,
                dataType: "json",
                success: function(data) {
                    $.extend(true, __translations, data.loca);
                    if (typeof data.import !== "undefined") {
                        for (var key in data.import) {
                            __load(data.import[key]);
                        }
                    }
                },
                error: function() {
                    console.error("Error loading " + locaFile);
                }
            });
        }

        __load(RLTB.config.loca.file);
        RLTB.scriptReady();
    })();
})();
