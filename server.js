
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var Comment = require("./models/Comment.js");
var Article = require("./models/Article.js");
var request = require("request");
var cheerio = require("cheerio");
mongoose.Promise = Promise;

var app = express();

app.use(express.static("public"));

mongoose.connect("mongodb://localhost/rtNews");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

app.get("/scrape", function(req, res) {
request("https://www.rt.com/usa/", function(error, response, html) {

  var $ = cheerio.load(html);

  $("strong.card__header").each(function(i, element) {
var result = {};

    result.headline = $(element).children().text().trim();

    result.link = "https://www.rt.com/usa" + $(element).children().attr("href");
    result.summary = $(element).next().text().trim();

  
var entry = new Article(result);

      entry.save(function(err, doc) {

        if (err) {
          console.log(err);
        }

        else {
          console.log(doc);
        }
      });

    });
  });

  res.send("Scrape Complete");
});


app.get("/articles", function(req, res) {

  Article.find({}, function(error, docs) {

    if (error) {
      console.log(error);
    }
    else {
      res.json(docs);
    }
  });
});


app.get("/articles/:id", function(req, res) {

  Article.findById(req.params.id)
 
  .populate("comment")

  .exec(function(error, doc) {

    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});

// Create a new note or replace an existing note
app.delete("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newComment = new Comment(req.body);

  // And save the new note the db
  newComment.remove(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "comment": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});



app.post("/articles/:id", function(req, res) {

  var newComment = new Comment(req.body);


  newComment.save(function(error, doc) {

    if (error) {
      console.log(error);
    }

    else {
  
        Article.findOneAndUpdate({ "_id": req.params.id }, { "comment": doc._id })

      .exec(function(err, doc) {
    
        if (err) {
          console.log(err);
        }
        else {
   
          res.send(doc);
        }
      });
    }
  });
});

app.listen(3000, function() {
  console.log("App running on port 3000!");
});
