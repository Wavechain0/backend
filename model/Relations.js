const Product = require('./Product.js');
const User = require('./User.js');

function Relations(){
    Product.belongsTo(User, {foreignKey: 'userid'})
    User.hasMany(Product, {foreignKey: 'userid'})
}

module.exports = Relations
