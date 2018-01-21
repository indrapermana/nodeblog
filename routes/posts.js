var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: './public/images' });

var mongo = require('mongodb');
var db = require('monk')('localhost/nodeblog');

router.get('/show/:id', function (req, res, next) {
    var posts = db.get('posts');

    posts.findOne({'_id':req.params.id}, function(err, post) {
        res.render('show', {
            'post': post
        });
    });
});

router.get('/add', function(req, res, next) {
    var categories = db.get('categories');

    categories.find({}, {}, function(err, categories) {
        res.render('addpost', {
            'title': 'Add Post',
            'categories': categories
        });
    });
});

router.post('/add', upload.single('mainimage'), function(req, res, next) {
    var title = req.body.title;
    var category = req.body.category;
    var body = req.body.body;
    var author = req.body.author;
    var date = new Date();

    // if the file uploaded
    if (req.file) {
        var mainimage = req.file.filename;
    } else {
        var mainimage = 'no-image.jpg';
    }

    req.checkBody('title', 'Title field is required').notEmpty();
    req.checkBody('body', 'Body field is required').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        res.render('addpost', {
            "errors": errors
        });
    } else {
        var posts = db.get('posts');
        posts.insert({
            "title": title,
            "body": body,
            "category": category,
            "date": date,
            "author": author,
            "mainimage": mainimage
        }, function(err, post) {
            if (err) {
                res.send(err);
            } else {
                req.flash('success', 'Post added');
                res.location('/');
                res.redirect('/');
            }
        });
    }
});

router.post('/addcomment', function(req, res, next) {
    var name = req.body.name;
    var email = req.body.email;
    var body = req.body.body;
    var commentdate = new Date();
    var postid = req.body.postid;

    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required but never display').notEmpty();
    req.checkBody('email', 'Email is not formatted properly').isEmail();
    req.checkBody('body', 'Body field is required').notEmpty();

    var errors = req.validationErrors();
    var posts = db.get('posts');
    if (errors) {
        posts.findOne({'_id':postid}, function(err, post) {
            res.render('show', {
                'errors': errors,
                'post': post
            });
        });
    } else {
        var comment = {
            "name": name,
            "email": email,
            "body": body,
            "commentdate": commentdate
        }

        posts.update({
            "_id": postid
        }, {
            $push: {
                "comments": comment
            }
        }, function(err, doc){
            if(err){
                throw err;
            } else {
                req.flash('success', 'Comment added');
                res.location('/posts/show/'+postid);
                res.redirect('/posts/show/'+postid);
            }
        });
    }
});

module.exports = router;
