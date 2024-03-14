//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');

require('dotenv').config();
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => {
    console.log("Connected to todolistDB!");
    })
    .catch((err) => {
    console.log("DB Connection ERROR! ", err);
    });

const itemsSchema = {
    name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];


const listSchema = {
    name: String,
    items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res){

    // Read items from DB:-
    Item.find({}).then(function(foundItems,err){
        if (foundItems.length === 0){
            Item.insertMany(defaultItems).then(function(){
            }).catch(function (err){
                console.log(err);
            });
            res.redirect("/");
        }else{
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });   
});

app.post("/", function(req, res){
    // console.log(req.body);
    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item({
        name: itemName
    });
    if (listName === "Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName}).then(function(foundList, err){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }   
});

app.post("/delete", function(req,res){

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemId).then(function(err){
            if (!err) {
                console.log("Successfully deleted checked item!");
                res.redirect("/");
             }
        });
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(foundList, err){
            if (!err) {
               res.redirect("/" + listName);
            }
        });
    }     
});


// Handle the request for favicon.ico     
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });
app.get("/:customListName", function(req,res){
    // console.log(req.params.customListName);
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then(function(foundList,err){
        if (!err) {
            if (!foundList){
                // Create a new list
                const list = new List ({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
                
            }else{
                // Show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            } 
        }
    });      
});
  

app.listen(3000, function(){
  console.log("Server started on port 3000.");
});
