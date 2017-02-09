onconnect = function(evt) {
    var port = evt.ports[0];

    port.onmessage = function(evt) {
        port.postMessage("GOT IT");
    };

    port.start();
};