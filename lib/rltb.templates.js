(function() {

    //Only for windows
    if (RLTB.util.isWorker()) {
        RLTB.scriptReady();
        return;
    }

    RLTB.templates = new (function() {
        var that = this;

        this.import = function(template) {
            var result;
            $.ajax("/Files/templates/" + templateName + ".html", {
                async : false,
                success : function(data, textStatus, jqXHR) {
                    result = data;
                },
                dataType : "html"
            });

            result = result.replace(/{{.*}}/g, function(match) {
                var replacement = match.replace(/{{/g, "").replace(/}}/g).trim();
                return RLTB.loca.get(replacement);
            });

            __replaceTemplates(result);

            return result;
        };

        function __replaceTemplates(element) {
            element.find("template").each(function() {
                $(this).replaceWith(that.import($(this).data("src")));
            });
        }

        __replaceTemplates($("body"));
    })();

    RLTB.scriptReady();
})();