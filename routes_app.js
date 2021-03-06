const express = require('express');
const Image = require('./models/imagenes');
const image_finder_middleware = require('./middlewares/find_image');
const fs = require('fs');
const redis = require('redis');

let client = redis.createClient();

const router = express.Router();

// app.com/app/ es relativo a /
router.get('/', (req, res) => {
  Image.find({})
    .populate('creator')
    .exec(function(err, imagenes){
      if(err) console.log(err);
      res.render('app/home', { imagenes })
    })
});

/** REST CRUD */


router.get('/imagenes/new', (req, res) => {
  res.render('app/imagenes/new');
});

router.all('/imagenes/:id*', image_finder_middleware);

router.get('/imagenes/:id/edit', (req, res) => {
  res.render('app/imagenes/edit');
});

router.route('/imagenes/:id')
  .get((req, res) => {
    // client.publish('images', res.locals.imagen.toString());
    res.render('app/imagenes/show');
  })
  .put((req, res) => {
    res.locals.imagen.title = req.body.title;
    res.locals.imagen.save((err) => {
      if(!err) {
        res.render('app/imagenes/show');
      } else {
        res.render(`app/imagenes/${req.params.id}/edit`);
      }
    });
  })
  .delete((req, res) => {
    /*
      -- Aquí realiza dos queries--
      Image.findById(req.params.id, (err, imagen) => {
      // Lo que tengas que hacer con la imagen
      imagen.remove();
    }); */
    
    // Eliminar imagenes
    Image.findOneAndRemove({ _id: req.params.id }, err => {
      if(!err) {
        res.redirect('/app/imagenes')
      } else {
        console.log(err);
        res.redirect(`/app/imagenes/${req.params.id}`)
      }
    })
  })

router.route('/imagenes')
  .get((req, res) => {
    Image.find({ creator: res.locals.user._id }, (err, imagenes) => {
      if(err){ res.redirect('/app'); return; }
      res.render('app/imagenes/index', { imagenes })
    });
  })
  .post((req, res) => {
    // console.log('req.body.archivo');
    const extension = req.files.archivo.name.split('.').pop();
    const data = { 
      title: req.fields.title,
      creator: res.locals.user._id,
      extension,
    };
    const image = new Image(data);
    
    image.save((err) => {
      if(!err){

        const imgJSON = {
          "id": image._id,
          "title": image.title,
          "extension": image.extension
        };

        client.publish('images', JSON.stringify(imgJSON));
        fs.rename(req.files.archivo.path, `public/images/${image._id}.${extension}`, function (err) {
          if (err) throw err;
          console.log('renamed complete');
        });
        res.redirect(`/app/imagenes/${image._id}`);
      } else {
        res.render(err);
      }
    })
  })


module.exports = router;
