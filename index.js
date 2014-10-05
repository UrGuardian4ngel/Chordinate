var express = require('express'),
    app = express();

var path = require('path');

var twig = require('twig');
twig.cache(false);
app.engine('twig', twig.renderFile);

app.use('/scripts', express.static(path.join(__dirname, '/scripts')));
app.use('/stylesheets', express.static(path.join(__dirname, '/stylesheets')));
app.use('/vendor', express.static(path.join(__dirname, '/vendor')));

var router = express.Router();

router.get('/', function (req, res) {
  res.render('chord.twig');
});

router.get('/files/:artist/:song.:ext', function (req, res, next) {
  var artist = req.params.artist,
      song   = req.params.song,
      extension = req.params.ext;

  var directory;
  switch (extension) {
    case 'pdf':
      directory = '/path/to/pdf/folder';
      break;

    case 'chopro':
    case 'pro':
      directory = '/path/to/chordpro/folder';
      break;

    default:
      next();
      return;
  }

  var fs = require("fs");

  var filepath = directory + '/' + artist + '/' + song + '.' + extension;

  if (!fs.existsSync(filepath)) {
    res.status(404).send('Not found.');
    return;
  }

  fs.readFile(filepath, function (err, data) {
    if (err) throw err;

    if (extension !== 'pdf') {
      // Response will be text based.
      data = data.toString();
    }

    res.send(data);
  });
});

app.use('/library', router);


app.listen(8080);
