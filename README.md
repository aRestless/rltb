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

The `rltb.conf.json` is a general configuration file that is placed in the app's root folder and contains
settings for the different RLTB modules, which are explained in the upcoming sections. On top of these
settings, the file can also contain an `import` array, much like the resource files described above, to
import more configuration files. This is particularly useful if you use (or provide) a library, that itself
uses the RLTB.

## RLTB.games

This module contains convenience methods for `overwolf.games`.

    RLTB.games.onGamePropertyChanged(callback);

    RLTB.games.onResolutionChanged(callback);

    RLTB.games.getResolution();

    RLTB.games.onGameFocusChanged(callback);

    RTLB.games.onGameClosed(gameName, callback);

## RLTB.loca

This module is used for translations. These translations are located in a file defined in `rltb.conf.json`.

    //rltb.conf.json
    {
        "loca" : {
            "file" : "/rltb.loca.json",
            "defaultLanguage" : "en"
        }
    }

The localization files have a hierarchical structure, beginning with the short language code of the
respective language

    //rltb.loca.json
    {
        "loca" : {
            "en" : {
                "menu" : {
                    "title" : "Menu",
                    "content" : "The menu's content"
                }
            },
            "de" : {
                "menu" : {
                    "title" : "Menü",
                    "content" : "Der Inhalte des Menüs"
                }
            }
        },
        "import" : [
            "/some/other/file.loca.json"
        ]
    }
    
The language that is used is the one set in Overwolf (and returned by `RLTB.util.getCurrentLanguage()`).
If there are no translation for that specific language, the `defaultLanguage` defined in 
`rltb.conf.json` will be used.

To get a translation for an entry, call

    RLTB.loca.get("menu.title");
    
You can also use them in template files

    <h1>{{menu.title}}</h2>

## RLTB.rpc

In development.

## RLTB.settings

Provides an hierarchical settings mechanism. Default settings can be set in `rltb.conf.json`.

    //rltb.conf.json
    {
        "settings" : {
            "default" : {
                "performance" : {
                    "refreshTime" : 5000
                },
                "appearance" : {
                    "color" : "#FF0000",
                    "size" : {
                        "width" : 1920,
                        "height" : 1080
                    }
                },
                "someArray" : [1,2,3]
            }
        }
    }

    RLTB.settings.get("performance.refreshTime");
    
    RLTB.settings.get("performance.refreshTime', 7500);
    
    RTLB.settings.set("appearance.size", {
        "width": 1024,
        "height": 768
    });
    
    RLTB.settings.push("someArray", 4);
    
    RLTB.settings.onChange(function(size) {
        console.log(size.width);
    }, "appearance.size");
    
    

## RLTB.templates
This modules expects template files to be placed in `/Files/templates` (which is likely to change). Those
templates can be imported either via JavaScript

    RLTB.templates.import("myTemplate");
    
or directly in HTML, by providing using a `template` element

    <template data-src="myTemplate"></template>

This replacement in HTML is automatically executed on page load (and occurs before `RLTB.ready()`).
Templates can also include other templates this way.
    
Both of these examples would import `/Files/templates/myTemplate.html`.

## RLTB.util

    RLTB.util.isWorker();
    
    RLTB.util.getCurrentLanguage();
    
    RLTB.util.getCurrentConfig();

## RLTB.windows

This module contains convenience methods for `overwolf.windows`

    RLTB.windows.isMainWindow();
    
    RLTB.windows.getCurrentWindowName();
    
    RLTB.windows.getCurrentWindowPath();
    
    RLTB.windows.open("index");
    RLTB.windows.open("subWindow");
    RLTB.windows.open("index", "subWindow");
    
    RLTB.windows.close();
    RLTB.windows.close("subWindow");
    RLTB.windows.close("subWindow", "index", callback);
    
    RLTB.windows.closeAll();
    
    RLTB.windows.minimize();
    
    RLTB.windows.restore(callback);
    
    RLTB.windows.changeSize(width, height);
    
    RLTB.windows.changePositionAndSize(x,y,width,height);
    
    RLTB.windows.centerAroundMouse();
    
    RLTB.windows.centerAround(x,y);
    
    RLTB.windows.getCurrentWindow(callback);
    
    RLTB.windows.keepInFullscreen();
    
    RLTB.windows.closeWithGame(gameName);

## RLTB.workers

## RLTB.messaging