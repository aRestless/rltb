importScripts("/vendor/rltb/rltb.js");

RLTB.ready(function() {
    importScripts(self.location.search.substr("?file=".length));
});

