const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    item: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Medication', 'Supplies', 'Equipment', 'Food', 'Vaccine']
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
    },
    expirationDate: {
        type: Date,
        required: false
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subtractionHistory: [
        {
            amount: { type: Number, required: true }, // always negative
            date: { type: Date, default: Date.now },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // optional: who subtracted
        }
    ]
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

// Add indexes for better query performance
inventorySchema.index({ status: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ stock: 1 });
inventorySchema.index({ createdAt: -1 });
inventorySchema.index({ status: 1, stock: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory; 