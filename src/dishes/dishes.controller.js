const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass


// validation middleware

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
  }

function stringPropertyIsValid(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName].length > 0) {
          return next();
        }
        next({ status: 400, message: `Dish must include a ${propertyName}` });
      };
    }

function priceIsValidNumber(req, res, next){
    const { data: { price }  = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        });
    }
    next();
  }

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  };

  function idMatchesBody(req, res, next) {
    const { id } = req.body.data;
    const {dishId} = req.params;
    if (id && id !== dishId) {
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
        });
    } else {
        next();
    }
}

// CRUD

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const id = nextId();
    const newDish = {
      id: id,
      name,
      description,
      price,
      image_url
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
  }


  function list(req, res) {
    res.json({ data: dishes });
  }


function read(req, res) {
    const dish = res.locals.dish;
    res.json({ data: dish });
  }


function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
  
    res.json({ data: dish });
  
  }


  // exports

  module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        stringPropertyIsValid("name"),
        stringPropertyIsValid("description"),
        stringPropertyIsValid("image_url"),
        priceIsValidNumber,
        create
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        idMatchesBody,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        stringPropertyIsValid("name"),
        stringPropertyIsValid("description"),
        stringPropertyIsValid("image_url"),
        priceIsValidNumber,
        update
    ]
  }