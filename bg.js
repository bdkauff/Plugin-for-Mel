// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Background page for Chrome Sounds extension.
 * This tracks various events from Chrome and plays sounds.
 */

// Map of tab numbers to notes on a scale.
var tabNoteSounds = {
  "tab0": "Scale_1.wav",
  "tab1": "Scale_2.wav",
  "tab2": "Scale_3.wav",
  "tab3": "Scale_4.wav",
  "tab4": "Scale_5.wav",
  "tab5": "Scale_6.wav",
  "tab6": "Scale_7.wav"
};

// Map of sounds that play in a continuous loop while an event is happening
// in the content area (e.g. "keypress" while start and keep looping while
// the user keeps typing).
var contentSounds = {
  //"keypress": "bleep2.wav",
  //"resize": "bleep2.wav",
  //"scroll": "bleep2.wav"
};

// Map of events to their default sounds
var eventSounds = {
  "tabCreated": "Austin_Texas_Mental_Hospital_1.mp3",
  //"tabMoved": "bleep2.wav",
  "tabRemoved": "birds.wav",
  "tabSelectionChanged": "bleep2.wav",
  //"tabAttached": "bleep2.wav",
  //"tabDetached": "bleep2.wav",
  "windowCreated": "jackhammer.wav",
  //"windowFocusChanged": "bleep2.wav",
  "bookmarkCreated": "bleep2.wav",
  "bookmarkMoved": "bleep2.wav",
  "bookmarkRemoved": "bleep2.wav",
  "windowCreatedIncognito": "bleep2.wav",
  "startup": "Scale_7.wav"
};

var soundLists = [eventSounds, tabNoteSounds,
    contentSounds];

var sounds = {};

// Map of event names to extension events.
// Events intentionally skipped:
// chrome.windows.onRemoved - can't suppress the tab removed that comes first
var events = {
  "tabCreated": chrome.tabs.onCreated,
  "tabMoved": chrome.tabs.onMoved,
  "tabRemoved": chrome.tabs.onRemoved,
  "tabSelectionChanged": chrome.tabs.onSelectionChanged,
  "tabAttached": chrome.tabs.onAttached,
  "tabDetached": chrome.tabs.onDetached,
  "windowCreated": chrome.windows.onCreated,
  //"windowFocusChanged": chrome.windows.onFocusChanged,
  "bookmarkCreated": chrome.bookmarks.onCreated,
  "bookmarkMoved": chrome.bookmarks.onMoved,
  "bookmarkRemoved": chrome.bookmarks.onRemoved
};

// Map of event name to a validation function that is should return true if
// the default sound should be played for this event.
var eventValidator = {
  "tabCreated": tabCreated,
  "tabRemoved": tabRemoved,
  "tabSelectionChanged": tabSelectionChanged,
  "windowCreated": windowCreated
  //"windowFocusChanged": windowFocusChanged,
};

var started = false;

function shouldPlay(id) {
  // Ignore all events until the startup sound has finished.
  if (id != "startup" && !started)
    return false;
  var val = localStorage.getItem(id);
  if (val && val != "enabled") {
    console.log(id + " disabled");
    return false;
  }
  return true;
}

function didPlay(id) {
  if (!localStorage.getItem(id))
    localStorage.setItem(id, "enabled");
}

function playSound(id, loop) {
  if (!shouldPlay(id))
    return;

  var sound = sounds[id];
  console.log("playsound: " + id);
  if (sound && sound.src) {
    if (!sound.paused) {
      if (sound.currentTime < 0.2) {
        console.log("ignoring fast replay: " + id + "/" + sound.currentTime);
        return;
      }
      sound.pause();
      sound.currentTime = 0;
    }
    if (loop)
      sound.loop = loop;

    // Sometimes, when playing multiple times, readyState is HAVE_METADATA.
    if (sound.readyState == 0) {  // HAVE_NOTHING
      console.log("bad ready state: " + sound.readyState);
    } else if (sound.error) {
      console.log("media error: " + sound.error);
    } else {
      didPlay(id);
      sound.play();
    }
  } else {
    console.log("bad playSound: " + id);
  }
}

function stopSound(id) {
  console.log("stopSound: " + id);
  var sound = sounds[id];
  if (sound && sound.src && !sound.paused) {
    sound.pause();
    sound.currentTime = 0;
  }
}

var base_url = "https://s3.amazonaws.com/browser_sounds/";

function soundLoadError(audio, id) {
  console.log("failed to load sound: " + id + "-" + audio.src);
  audio.src = "";
  if (id == "startup")
    started = true;
}

function soundLoaded(audio, id) {
  console.log("loaded sound: " + id);
  sounds[id] = audio;
  if (id == "startup")
    playSound(id);
}

// Hack to keep a reference to the objects while we're waiting for them to load.
var notYetLoaded = {};

function loadSound(file, id) {
  if (!file.length) {
    console.log("no sound for " + id);
    return;
  }
  var audio = new Audio();
  audio.id = id;
  audio.onerror = function() { soundLoadError(audio, id); };
  audio.addEventListener("canplaythrough",
      function() { soundLoaded(audio, id); }, false);
  if (id == "startup") {
    audio.addEventListener("ended", function() { started = true; });
  }
  audio.src = base_url + file;
  audio.load();
  notYetLoaded[id] = audio;
}

// Remember the last event so that we can avoid multiple events firing
// unnecessarily (e.g. selection changed due to close).
var eventsToEat = 0;

function eatEvent(name) {
  if (eventsToEat > 0) {
    console.log("ate event: " + name);
    eventsToEat--;
    return true;
  }
  return false;
}

function soundEvent(event, name) {
  if (event) {
    var validator = eventValidator[name];
    if (validator) {
      event.addListener(function() {
        console.log("handling custom event: " + name);

        // Check this first since the validator may bump the count for future
        // events.
        var canPlay = (eventsToEat == 0);
        if (validator.apply(this, arguments)) {
          if (!canPlay) {
            console.log("ate event: " + name);
            eventsToEat--;
            return;
          }
          playSound(name);
        }
      });
    } else {
      event.addListener(function() {
        console.log("handling event: " + name);
        if (eatEvent(name)) {
          return;
        }
        playSound(name);
      });
    }
  } else {
    console.log("no event for " + name);
  }
}

var navSound;

function stopNavSound() {
  if (navSound) {
    stopSound(navSound);
    navSound = null;
  }
}

function playNavSound(id) {
  stopNavSound();
  navSound = id;
  playSound(id);
}

// function tabNavigated(tabId, changeInfo, tab) {
//   // Quick fix to catch the case where the content script doesn't have a chance
//   // to stop itself.
//   stopSound("keypress");

//   //console.log(JSON.stringify(changeInfo) + JSON.stringify(tab));
//   if (changeInfo.status != "complete") {
//     return false;
//   }
//   if (eatEvent("tabNavigated")) {
//     return false;
//   }

//   console.log(JSON.stringify(tab));

//   if (navSound)
//     stopSound(navSound);

//   var re = /https?:\/\/([^\/:]*)[^\?]*\??(.*)/i;
//   match = re.exec(tab.url);
//   if (match) {
//     if (match.length == 3) {
//       var query = match[2];
//       var parts = query.split("&");
//       for (var i in parts) {
//         if (parts[i].indexOf("q=") == 0) {
//           var q = decodeURIComponent(parts[i].substring(2));
//           q = q.replace("+", " ");
//           console.log("query == " + q);
//           var words = q.split(" ");
//           for (j in words) {
//             if (searchSounds[words[j]]) {
//               console.log("searchSound: " + words[j]);
//               playNavSound(words[j]);
//               return false;
//             }
//           }
//           break;
//         }
//       }
//     }
//     if (match.length >= 2) {
//       var hostname = match[1];
//       if (hostname) {
//         var parts = hostname.split(".");
//         if (parts.length > 1) {
//           var tld2 = parts.slice(-2).join(".");
//           var tld3 = parts.slice(-3).join(".");
//           var sound = urlSounds[tld2];
//           if (sound) {
//             playNavSound(tld2);
//             return false;
//           }
//           sound = urlSounds[tld3];
//           if (sound) {
//             playNavSound(tld3);
//             return false;
//           }
//         }
//       }
//     }
//   }

//   // Now try a direct URL match (without query string).
//   var url = tab.url;
//   var query = url.indexOf("?");
//   if (query > 0) {
//     url = tab.url.substring(0, query);
//   }
//   console.log(tab.url);
//   var sound = urlSounds[url];
//   if (sound) {
//     playNavSound(url);
//     return false;
//   }

//   return true;
// }

var selectedTabId = -1;

function tabSelectionChanged(tabId) {
  selectedTabId = tabId;
  if (eatEvent("tabSelectionChanged"))
    return false;

  var count = 7;
  chrome.tabs.get(tabId, function(tab) {
    var index = tab.index % count;
    playSound("tab" + index);
  });
  return false;
}

function tabCreated(tab) {
  if (eatEvent("tabCreated")) {
    return false;
  }
  eventsToEat++;  // tabNavigated or tabSelectionChanged
  // TODO - unfortunately, we can't detect whether this tab will get focus, so
  // we can't decide whether or not to eat a second event.
  return true;
}

function tabRemoved(tabId) {
  if (eatEvent("tabRemoved")) {
    return false;
  }
  if (tabId == selectedTabId) {
    eventsToEat++;  // tabSelectionChanged
    stopNavSound();
  }
  return true;
}

function windowCreated(window) {
  if (eatEvent("windowCreated")) {
    return false;
  }
  eventsToEat += 3;  // tabNavigated, tabSelectionChanged, windowFocusChanged
  if (window.incognito) {
    playSound("windowCreatedIncognito");
    return false;
  }
  return true;
}

var selectedWindowId = -1;

// function windowFocusChanged(windowId) {
//   if (windowId == selectedWindowId) {
//     return false;
//   }
//   selectedWindowId = windowId;
//   if (eatEvent("windowFocusChanged")) {
//     return false;
//   }
//   return true;
// }

function contentScriptHandler(request) {
  if (contentSounds[request.eventName]) {
    if (request.eventValue == "started") {
      playSound(request.eventName, true);
    } else if (request.eventValue == "stopped") {
      stopSound(request.eventName);
    } else {
      playSound(request.eventName);
    }
  }
  console.log("got message: " + JSON.stringify(request));
}


//////////////////////////////////////////////////////

// Listen for messages from content scripts.
chrome.extension.onRequest.addListener(contentScriptHandler);

// Load the sounds and register event listeners.
for (var list in soundLists) {
  for (var id in soundLists[list]) {
    loadSound(soundLists[list][id], id);
  }
}
for (var name in events) {
  soundEvent(events[name], name);
}
