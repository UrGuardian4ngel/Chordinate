# Chordinate

## About Chordinate

### What?

**Chordinate** is a library application, written for musicians <small>(like myself)</small>.  
It supports* both _ChordPro_ text files and _PDF_ sheet music, consolidated in a single easy-to-manage library.

The application is web based (served by [ExpressJS](http://expressjs.com/)).

<p style="text-align: right; font-size: smaller; color: #666;">
* At least, that's where I'm aiming for.<br />
It's a work in progress, and currently there is only support for ChordPro text files.
</p>


### Why?

I've been trying a lot of applications lately, like [ChordPro Buddy](http://www.gfapps.com/chordprobuddy/) and [SongBook](https://linkesoft.com/songbook/).  
Those applications are really awesome, but sometimes I feel like a particular feature is just missing.

That's why I decided to create my own solution, specific for my own needs.

As I'm trying to improve my skills in Javascript, this is the perfect _"spare time project"_ to fiddle around with Javascript-based platforms and frameworks like:

- [NodeJS](http://nodejs.org/) (for the backend)
- [Angular](https://angularjs.org/) (for the frontend)
- and other fun stuff


## Requirements

- node
- bower
- compass

## Installation

Clone the repository:

    git clone https://github.com/UrGuardian4ngel/Chordinate
    cd Chordinate


Install dependencies:

    npm install
    bower install


Compile stylesheets:

    compass compile


Update configuration:

```js
// index.js
switch (extension) {
  case 'pdf':
    // Update this path to the root of your pdf folder.
    directory = '/path/to/pdf/folder';
    break;

  case 'chopro':
  case 'pro':
    // Update this path to the root of your chordpro folder.
    directory = '/path/to/chordpro/folder';
    break;

  default:
    next();
    return;
}
```


Run the server:

    node index.js


Open your webbrowser:  [http://localhost:8080/library](http://localhost:8080/library)