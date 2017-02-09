# RestLess ToolBox (RLTB)

The RestLess ToolBox is a collection of useful tools for [Overwolf](http://www.overwolf.com) developers.
It simplifies common tasks and workflows, and also provides an abstraction layer on top
of Overwolf's API, often with simpler interfaces.

While with Overwolf's default API you'd need this to open a simple window:

    overwolf.windows.obtainDeclaredWindow("windowName", function(result) {
        overwolf.windows.restore(result.window.id, function() {});
    });

With the RLTB this becomes significantly shorter:

    RLTB.windows.open("windowName");
    
And even works for multiple windows:

    RLTB.windows.open("windowName1", "windowName2");
    
These improvements to the API have been the reason the RLTB was first developed, but over
time more and more features found their way in that are solutions to everyday challenges
Overwolf developers face. This includes messaging, templates, settings mechanisms,
localization, and more.

## Setting it up

Setup is easy. The library expects to be placed in `/vendor/rltb`, where `/` is the root
directory of your Overwolf app (the directory where your `manifest.json` is located). Then
just simply include it in the HTML of each of your app's windows with

    <script type="text/javascript" src="/vendor/rltb/rltb.js">
    
and that's it. The initialization of your own code should happen after the RLTB fires
its `ready` event:

    RLTB.ready(function() {
        //your own code
    });
    
## Features

### Automatic loading of resources

If your code has a lot of dependencies, the `<head>` section of your Overwolf windows
can become quite bloated, and also repetitive if different windows depend on the same
libraries. The RLTB has a way around that. First of all, the RLTB will automatically load
jQuery for all windows, and a "no DOM" version of jQuery inside web workers. On top of that,
upon loading, the RLTB checks for a _resource file_, named like the window's HTML file,
but ending in `.resource.json`. So for your `index.html` the respective resource file
would be located in the same folder, but named `index.resource.json`.

You can use the resource file to include JavaScript and CSS files, as well as include
other resource files, like in the following example:

    {
        "js" : [
            "/Files/js/index.js",
            "/Files/js/menu.js"
        ],
        "css": [
            "/Files/css/index.css
        ],
        "import" : [
            "/Files/common.resource.json"
        ]
    }
    
If you had JavaScript and CSS files you wanted to use across multiple windows, you could
define them in `/Files/common.resource.json` and just include that resource file from
all other resource files, so you don't have to repeat yourself.

## rltb.conf.json

## RLTB.games

## RLTB.loca

## RLTB.rpc

## RLTB.settings

## RLTB.templates

## RLTB.util

## RLTB.windows

## RLTB.workers

## RLTB.messaging