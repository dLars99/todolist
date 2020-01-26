//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Initialize mongoose and disable deprecation warnings
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

// Set up default items
const item1 = new Item({
  name: "Here is today's To-Do List"
});

const item2 = new Item({
  name: "Hit the + to add an item to the list"
});

const item3 = new Item({
  name: "Check off an item to remove it from the list"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  // Check for default items and add them if this is the first time the list is run
  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });


});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const listEntry = new Item({
      name: itemName
  });

  // Post new item to the appropriate list
  if (listName === "Today") {

    listEntry.save();
    res.redirect("/");

  } else {

    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(listEntry);
      foundList.save();
      res.redirect("/" + listName);
    });

  };

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
  Item.findByIdAndRemove(checkedItemId, function(err){
    if (!err) {
      console.log("Successfully removed checked item");
      res.redirect("/");
    };
  });
} else {
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if (!err) {
      res.redirect("/" + listName);
    };
  });
};
});

app.get("/:listTitle", function(req, res) {
  const customListName = _.capitalize(req.params.listTitle);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {

      if (!foundList) {

        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        res.redirect("/" + customListName);
        list.save();
      } else {

        // Show an existing list
        res.render("list", {listTitle: foundList.name,
        newListItems: foundList.items})
      };

    };
  });


});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
