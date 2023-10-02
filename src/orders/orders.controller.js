const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// validation middleware

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Order must include a ${propertyName}` });
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

function dishesValidator(req, res, next) {
    const {dishes = []} = req.body.data;
    if (!Array.isArray(dishes) || dishes.length === 0) {
        next({ status: 400, message: "Order must include at least one dish" })
    } else {
        next();
    }
}

function quantityValidator(req, res, next) {
    const {dishes = []} = req.body.data;
    for (let i=0; i < dishes.length; i++) {
        const {quantity} = dishes[i];
        if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0) {
            next({ status: 400, message: `Dish ${i} must have a valid quantity that is a number greater than 0` })
        }
    }
    return next();
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const index = orders.findIndex(order => order.id === orderId);
    if (index > -1) {
      res.locals.order = orders[index];
      res.locals.index = index;
      return next();
    }
    next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  };

function idMatchesBody(req, res, next) {
    const { id } = req.body.data;
    const {orderId} = req.params;
    if (id && id !== orderId) {
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
        })
    } else {
        next();
    }
}

function validateStatus(req, res, next) {
    const { status } = req.body.data;
    const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"]
    if (!status || status.length === 0 || !validStatuses.includes(status)) {
        next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
        })
    } else if (res.locals.order.status === "delivered") {
        next({
            status: 400,
            message: "A delivered order cannot be changed",
        })
    } else {
        next();
    }
}

function validateDeleteStatus(req, res, next) {
    const { status } = res.locals.order;
    if (status !== "pending") {
        next({
            status: 400,
            message: "An order cannot be deleted unless it is pending.",
        })
    } else {
        next();
    }
}

// CRUD

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const id = nextId();
    const newOrder = {
      id: id,
      deliverTo,
      mobileNumber,
      dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  }

  function list(req, res) {
    res.json({ data: orders });
  }

  function read(req, res) {
    const order = res.locals.order;
    res.json({ data: order });
  }


  function update(req, res) {
    const order = res.locals.order;
    const { data: { status, deliverTo, mobileNumber } = {} } = req.body;
    order.deliverTo = deliverTo,
    order.mobileNumber = mobileNumber,
    order.status = status;
  
    res.json({ data: order });
  
  }


  function destroy(req, res) {
    const index = res.locals.index
    orders.splice(index, 1);
    res.sendStatus(204);
  }


// exports

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        stringPropertyIsValid("deliverTo"),
        stringPropertyIsValid("mobileNumber"),
        dishesValidator,
        quantityValidator,
        create
    ],
    list,
    read: [orderExists, read],
    update: [
        orderExists,
        idMatchesBody,
        validateStatus,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        stringPropertyIsValid("deliverTo"),
        stringPropertyIsValid("mobileNumber"),
        dishesValidator,
        quantityValidator,
        update
    ],
    delete: [orderExists, validateDeleteStatus, destroy]
}
