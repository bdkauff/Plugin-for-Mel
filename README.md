Plugin-for-Mel
==============
This is a Chrome Extension I built for a friend of mine, for my class Appropriating Interaction Technology. Its based on the Chrome API's example of incorporating sound into the browsing experience. 

We had to build am extension for a specific person, and I ended up choosing one of my best friends, Mel, because he has hilariously bad browsing habits (sorry, Mel). Basically this amounts to constantly cruising the interwebz with like, 200 tabs open at all times, downloading a million things at once, and general squeezing every drop of juice from the browsing experience. Mel is also happens to be an amazing musician. We've been in multiple bands together and he's the type of guy who can make amazing music with anything, and it always sounds like him.

I decided that making an extension that allowed Mel to play the browser as a musical instrument was my task, and if I could bring a little awareness to his habits, I would mix that into the experience a bit too. 

As if now, the features are as follows:

1) A note plays when the extension is loaded, so he knows its working.

2) Any time a new tab is opened, a song plays. It happens to be by Stars of the Lid, one of his favorite bands. If a new tab is opened before the song is over though, the song restarts. This is supposed to be an annoying feature to encourage Mel to not open new tabs indiscriminately. 

3) Anytime he closes a tab, a field recording of birds plays; Mel loves field recordings.

4) Opening a new browser window (which Mel often has many of at any given time), the sound of a jackhammer plays.

5) Moving from tab to tab plays musical notes; this is just fun!

NB:All sound files are served from an Amazon S3 bucket.

To try it out:

1) Git clone or download this repo.
2) Go to the Extensions tab of your Chrome preferences and make sure the Developer mode box in the top right corner is checked.
3) Click the "Load unpacked Extension" button and select the directory.
