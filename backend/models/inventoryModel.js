const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    item: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Medication', 'Supplies', 'Equipment', 'Food']
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    minStock: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['in-stock', 'low-stock', 'out-of-stock'],
        default: 'in-stock'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware to update status based on stock levels
inventorySchema.pre('save', function(next) {
    if (this.stock === 0) {
        this.status = 'out-of-stock';
    } else if (this.stock <= this.minStock) {
        this.status = 'low-stock';
    } else {
        this.status = 'in-stock';
    }
    this.lastUpdated = new Date();
    next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory; 