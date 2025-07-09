const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Booking = require('../models/bookingModel');
const Inventory = require('../models/inventoryModel');
const Activity = require('../models/activityModel');
const Admin = require('../models/adminModel');
const Settings = require('../models/settingsModel');
const PetMedicalRecord = require('../models/petMedicalRecord');
const bcrypt = require('bcrypt');

function fallback(value) {
    if (value === undefined || value === null || value === '') return 'N/A';
    return value;
}

// Get dashboard overview data
exports.getDashboardOverview = async (req, res) => {
    try {
        // Use Promise.all for parallel execution of all queries
        const [
            userCount,
            vetClinicCount,
            petCount,
            inventoryCount,
            availableVetClinics,
            lowStockItems
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'clinic' }),
            Pet.countDocuments(),
            Inventory.countDocuments(),
            User.countDocuments({ role: 'clinic', status: 'approved' }),
            Inventory.countDocuments({
                $or: [
                    { status: 'low-stock' },
                    { status: 'out-of-stock' }
                ]
            })
        ]);

        res.json({
            success: true,
            data: {
                userCount,
                vetClinicCount,
                petCount,
                inventoryCount,
                availableVetClinics,
                lowStockItems
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all vet clinics
exports.getAllVetClinics = async (req, res) => {
    try {
        const vetClinics = await VetClinic.find().select('-password');
        res.json({ success: true, data: vetClinics });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all pets
exports.getAllPets = async (req, res) => {
    try {
        const pets = await Pet.find().populate('owner', 'name email');
        res.json({ success: true, data: pets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get inventory items
exports.getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find();
        res.json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get recent activities
exports.getRecentActivities = async (req, res) => {
    try {
        const activities = await Activity.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name')
            .populate('clinic', 'name');
        res.json({ success: true, data: activities });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAdmin = async (req, res) => {
    try {
        const { username, email, password, contact } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            $or: [
                { email },
                { contact }
            ]
        });
        if (existingAdmin) {
            return res.status(400).json({
                status: 'fail',
                message: existingAdmin.email === email ?
                    'Email already in use' :
                    'Contact number already in use'
            });
        }

        // Create new admin
        const newAdmin = await Admin.create({
            username,
            email,
            password, // will be hashed by pre-save middleware
            contact
        });

        // Remove password from response
        newAdmin.password = undefined;

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('admins_updated');
        }

        res.status(201).json({
            status: 'success',
            data: {
                admin: newAdmin
            }
        });
    } catch (error) {
        console.error('Admin creation error:', error); // Add this for debugging
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
// Create a new inventory item
exports.createInventoryItem = async (req, res) => {
    try {
        const { item, category, stock, minStock, clinic, expirationDate, manufacturingDate } = req.body;

        // Create new inventory item
        const newItem = await Inventory.create({
            item,
            category,
            stock,
            minStock,
            status: stock > minStock ? 'in-stock' : 'low-stock',
            clinic,
            expirationDate,
            manufacturingDate
        });

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
        }

        res.status(201).json({
            success: true,
            data: newItem
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update system settings
exports.updateSettings = async (req, res) => {
    try {
        const { notifications, maintenanceMode } = req.body;

        // Find the settings document and update it, or create it if it doesn't exist
        let settings = await Settings.findOneAndUpdate({}, { notifications, maintenanceMode }, { new: true, upsert: true });

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update a user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, status } = req.body;

        const updatedUser = await User.findByIdAndUpdate(id, { username, email, role, status }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('users_updated');
        }

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a vet clinic
exports.updateVetClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status, email } = req.body;

        const updatedVetClinic = await VetClinic.findByIdAndUpdate(
            id, 
            { name, status, email }, 
            { new: true }
        );

        if (!updatedVetClinic) {
            return res.status(404).json({ message: 'Vet Clinic not found' });
        }

        res.json({
            success: true,
            data: updatedVetClinic
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a vet clinic
exports.deleteVetClinic = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedVetClinic = await VetClinic.findByIdAndDelete(id);

        if (!deletedVetClinic) {
            return res.status(404).json({ message: 'Vet Clinic not found' });
        }

        res.json({
            success: true,
            message: 'Vet Clinic deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a pet
exports.updatePet = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, breed, age } = req.body;

        const updatedPet = await Pet.findByIdAndUpdate(id, { name, type, breed, age }, { new: true });

        if (!updatedPet) {
            return res.status(404).json({ message: 'Pet not found' });
        }

        res.json({
            success: true,
            data: updatedPet
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a pet
exports.deletePet = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPet = await Pet.findByIdAndDelete(id);

        if (!deletedPet) {
            return res.status(404).json({ message: 'Pet not found' });
        }

        res.json({
            success: true,
            message: 'Pet deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get system settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update an inventory item
exports.updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { item, category, stock, minStock, expirationDate, manufacturingDate } = req.body;

        const inventoryItem = await Inventory.findById(id);
        if (!inventoryItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        // Update fields
        if (item) inventoryItem.item = item;
        if (category) inventoryItem.category = category;
        if (stock !== undefined) inventoryItem.stock = stock;
        if (minStock !== undefined) inventoryItem.minStock = minStock;
        if (expirationDate) inventoryItem.expirationDate = expirationDate;
        if (manufacturingDate) inventoryItem.manufacturingDate = manufacturingDate;

        await inventoryItem.save(); // This will trigger the middleware

        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
        }

        res.json({
            success: true,
            data: inventoryItem
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete an inventory item
exports.deleteInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedItem = await Inventory.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Increment or decrement inventory stock
exports.updateInventoryStock = async (req, res) => {
    try {
        const itemId = req.params.id;
        const { amount, userId } = req.body; // Optionally track who made the change
        if (typeof amount !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a number'
            });
        }
        const item = await Inventory.findById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        item.stock += amount;
        if (item.stock < 0) item.stock = 0;
        // Track subtraction history
        if (!item.subtractionHistory) item.subtractionHistory = [];
        if (amount < 0) {
            item.subtractionHistory.push({
                amount,
                date: new Date(),
                user: userId || null
            });
        }
        await item.save();
        if (req.app && req.app.get('io')) {
            req.app.get('io').emit('inventory_updated');
        }
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.resetAndSeed = async (req, res) => {
    try {
        // 1. Remove all data
        await Promise.all([
            User.deleteMany({}),
            Admin.deleteMany({}),
            Pet.deleteMany({}),
            Booking.deleteMany({}),
            Inventory.deleteMany({}),
            PetMedicalRecord.deleteMany({}),
            VetClinic.deleteMany({})
        ]);

        // 2. Create bcrypt hashes
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('user123', 10);
        const vetClinicPassword = await bcrypt.hash('vet123', 10);

        // 3. Insert one admin
        const admin = await Admin.create({
            username: 'admin',
            email: 'admin@PetEat.com',
            password: adminPassword,
            contact: '09999999999',
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 4. Insert one vet clinic
        const vetClinic = await VetClinic.create({
            name: 'PetEat Clinic',
            email: 'clinic@PetEat.com',
            password: vetClinicPassword,
            role: 'vet clinic',
            contact: '09112223333',
            address: '456 Clinic Road',
            status: 'approved',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 5. Insert one user
        const user = await User.create({
            username: 'petowner',
            email: 'user@PetEat.com',
            password: userPassword,
            role: 'pet owner',
            contactNumber: '09123456789',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 6. Insert one pet for the user
        const pet = await Pet.create({
            name: 'Buddy',
            type: 'dog',
            breed: 'Labrador',
            age: 4,
            weight: 25,
            color: 'Yellow',
            gender: 'male',
            owner: user._id,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 7. Insert one EMR for the pet
        await PetMedicalRecord.create({
            petId: pet._id.toString(),
            name: 'Buddy',
            species: 'dog',
            breed: 'Labrador',
            age: 4,
            sex: 'male',
            owner: {
                name: user.username,
                phone: user.contactNumber,
                email: user.email,
                address: '123 Pet Street'
            },
            vaccinations: [],
            medicalHistory: [],
            visitHistory: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Database reset and seeded.',
            credentials: {
                admin: { email: 'admin@PetEat.com', password: 'admin123' },
                vetClinic: { email: 'clinic@PetEat.com', password: 'vet123' },
                user: { email: 'user@PetEat.com', password: 'user123' }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const fetchDashboardData = async () => {
    try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("token")
        if (!token) {
            throw new Error("No authentication token found")
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }

        // Fetch all data in parallel using Promise.all
        const [
            overviewRes,
            usersRes,
            petsRes,
            inventoryRes,
            activitiesRes
        ] = await Promise.all([
            fetch('http://localhost:8080/api/admin/dashboard/overview', { headers }),
            fetch('http://localhost:8080/api/admin/users', { headers }),
            fetch('http://localhost:8080/api/admin/pets', { headers }),
            fetch('http://localhost:8080/api/admin/inventory', { headers }),
            fetch('http://localhost:8080/api/admin/recent-activities', { headers })
        ])

        // Check if any request failed
        if (!overviewRes.ok || !usersRes.ok || !petsRes.ok || !inventoryRes.ok || !activitiesRes.ok) {
            throw new Error('Failed to fetch dashboard data')
        }

        // Parse all responses in parallel
        const [
            overviewData,
            usersData,
            petsData,
            inventoryData,
            activitiesData
        ] = await Promise.all([
            overviewRes.json(),
            usersRes.json(),
            petsRes.json(),
            inventoryRes.json(),
            activitiesRes.json()
        ])

        setDashboardData(overviewData.data)
        setUsers(usersData.data)
        setPets(petsData.data)
        setInventory(inventoryData.data)
        setRecentActivities(activitiesData.data)
    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError(error.message)
    } finally {
        setLoading(false)
    }
}

// Get all dashboard data in a single optimized request
exports.getAllDashboardData = async (req, res) => {
    try {
        const { page = 1, limit = 20, year } = req.query;
        const skip = (page - 1) * limit;
        const analyticsYear = year ? parseInt(year) : new Date().getFullYear();
        const yearStart = new Date(Date.UTC(analyticsYear, 0, 1, 0, 0, 0));
        const yearEnd = new Date(Date.UTC(analyticsYear + 1, 0, 1, 0, 0, 0));

        // Use Promise.all for parallel execution of all queries
        const [
            overviewData,
            users,
            pets,
            inventory,
            activities
        ] = await Promise.all([
            // Overview data
            Promise.all([
                User.countDocuments(),
                User.countDocuments({ role: 'clinic' }),
                Pet.countDocuments(),
                Inventory.countDocuments(),
                User.countDocuments({ role: 'clinic', status: 'approved' }),
                Inventory.countDocuments({
                    $or: [
                        { status: 'low-stock' },
                        { status: 'out-of-stock' }
                    ]
                })
            ]),
            // Users data with pagination
            User.find().select('-password').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
            // Pets data with pagination
            Pet.find().populate('owner', 'name email').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
            // Inventory data with pagination
            Inventory.find().skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
            // Recent activities
            Activity.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('user', 'name')
                .populate('clinic', 'name')
                .lean()
        ]);
        const [userCount, vetClinicCount, petCount, inventoryCount, availableVetClinics, lowStockItems] = overviewData;
        // --- Analytics Section (similar to vetClinicController, but for all clinics) ---
        const Booking = require('../models/bookingModel');
        const allBookings = await Booking.find({
            bookingDate: { $gte: yearStart, $lt: yearEnd },
            status: { $in: ['confirmed', 'completed'] }
        });
        const appointmentsByReasonByMonth = {};
        for (let i = 0; i < 12; i++) {
            const monthBookings = allBookings.filter(b => {
                const d = new Date(b.bookingDate);
                return d.getUTCMonth() === i;
            });
            for (const b of monthBookings) {
                if (!b.reason) continue;
                if (!appointmentsByReasonByMonth[b.reason]) appointmentsByReasonByMonth[b.reason] = Array(12).fill(0);
                appointmentsByReasonByMonth[b.reason][i]++;
            }
        }
        // Inventory changes by month (all clinics)
        const inventoryDocsYear = await Inventory.find({
            $or: [
                { expirationDate: { $gte: yearStart, $lt: yearEnd } },
                { 'subtractionHistory.date': { $gte: yearStart, $lt: yearEnd } },
                { createdAt: { $gte: yearStart, $lt: yearEnd } },
                { updatedAt: { $gte: yearStart, $lt: yearEnd } }
            ]
        });
        const inventoryChangesByMonth = {
            expired: Array(12).fill(0),
            subtracted: Array(12).fill(0),
            added: Array(12).fill(0),
            removed: Array(12).fill(0)
        };
        for (let i = 0; i < 12; i++) {
            // Expired
            inventoryChangesByMonth.expired[i] = inventoryDocsYear.filter(inv => inv.expirationDate && (new Date(inv.expirationDate)).getUTCMonth() === i && (new Date(inv.expirationDate)).getUTCFullYear() === analyticsYear).length;
            // Added (created)
            inventoryChangesByMonth.added[i] = inventoryDocsYear.filter(inv => inv.createdAt && (new Date(inv.createdAt)).getUTCMonth() === i && (new Date(inv.createdAt)).getUTCFullYear() === analyticsYear).length;
            // Removed (deleted) - not tracked unless you have a deletion log, so leave as 0
            inventoryChangesByMonth.removed[i] = 0;
            // Subtracted (from subtractionHistory)
            let subCount = 0;
            for (const inv of inventoryDocsYear) {
                if (Array.isArray(inv.subtractionHistory)) {
                    for (const sub of inv.subtractionHistory) {
                        const d = new Date(sub.date);
                        if (d.getUTCMonth() === i && d.getUTCFullYear() === analyticsYear) {
                            subCount++;
                        }
                    }
                }
            }
            inventoryChangesByMonth.subtracted[i] = subCount;
        }
        // Pets admitted & status changes by month (all clinics)
        const PetsUnderTreatment = require('../models/petsUnderTreatmentModel');
        const petsUnderTreatmentYear = await PetsUnderTreatment.find({
            admissionDate: { $gte: yearStart, $lt: yearEnd }
        });
        const petsAdmittedByMonth = Array(12).fill(0);
        const petsStatusChangesByMonth = {
            Critical: Array(12).fill(0),
            Stable: Array(12).fill(0),
            Improving: Array(12).fill(0),
            Recovered: Array(12).fill(0)
        };
        for (const pet of petsUnderTreatmentYear) {
            // Count admissions
            const adm = new Date(pet.admissionDate);
            if (adm.getUTCFullYear() === analyticsYear) {
                petsAdmittedByMonth[adm.getUTCMonth()]++;
            }
            // Count status changes from treatmentHistory
            if (Array.isArray(pet.treatmentHistory)) {
                for (const hist of pet.treatmentHistory) {
                    if (hist.date) {
                        const d = new Date(hist.date);
                        if (d.getUTCFullYear() === analyticsYear) {
                            for (const status of ["Critical","Stable","Improving","Recovered"]) {
                                if (hist.notes && hist.notes.toLowerCase().includes(status.toLowerCase())) {
                                    petsStatusChangesByMonth[status][d.getUTCMonth()]++;
                                }
                            }
                        }
                    }
                }
            }
        }
        // Most subtracted inventory item (by amount) for the year
        let mostSubtractedItem = null;
        let mostSubtractedItemAmount = 0;
        const subtractedByItem = {};
        for (const inv of inventoryDocsYear) {
            if (!inv.item) continue;
            const totalSub = (inv.subtractionHistory || [])
                .filter(h => h.amount < 0 && h.date && (new Date(h.date)).getUTCFullYear() === analyticsYear)
                .reduce((sum, h) => sum + Math.abs(h.amount), 0);
            if (!subtractedByItem[inv.item]) subtractedByItem[inv.item] = 0;
            subtractedByItem[inv.item] += totalSub;
        }
        for (const [item, amt] of Object.entries(subtractedByItem)) {
            if (amt > mostSubtractedItemAmount) {
                mostSubtractedItem = item;
                mostSubtractedItemAmount = amt;
            }
        }
        // Top 5 most subtracted items
        const topSubtractedItems = Object.entries(subtractedByItem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([item, amount]) => ({ item, amount }));
        // --- New: Top 5 most subtracted items by month (12-month analytics) ---
        const topSubtractedItemsByMonth = topSubtractedItems.map(({ item }) => {
            const monthly = Array(12).fill(0);
            for (const inv of inventoryDocsYear) {
                if (inv.item !== item) continue;
                if (Array.isArray(inv.subtractionHistory)) {
                    for (const sub of inv.subtractionHistory) {
                        if (sub.amount < 0 && sub.date) {
                            const d = new Date(sub.date);
                            if (d.getUTCFullYear() === analyticsYear) {
                                monthly[d.getUTCMonth()] += Math.abs(sub.amount);
                            }
                        }
                    }
                }
            }
            return { item, monthly };
        });
        // Inventory analytics: find the category with the most subtracted
        const subtractedByCategory = {};
        for (const inv of inventoryDocsYear) {
            if (!inv.category) continue;
            const totalSub = (inv.subtractionHistory || [])
                .filter(h => h.amount < 0)
                .reduce((sum, h) => sum + Math.abs(h.amount), 0);
            if (!subtractedByCategory[inv.category]) subtractedByCategory[inv.category] = 0;
            subtractedByCategory[inv.category] += totalSub;
        }
        let mostSubtractedCategory = null;
        let mostSubtractedAmount = 0;
        for (const [cat, amt] of Object.entries(subtractedByCategory)) {
            if (amt > mostSubtractedAmount) {
                mostSubtractedCategory = cat;
                mostSubtractedAmount = amt;
            }
        }
        // Pets by status (all clinics)
        const allPets = await Pet.find();
        const petsByStatus = {
            stable: allPets.filter(pet => pet.healthStatus === 'stable').length,
            checkup: allPets.filter(pet => pet.healthStatus === 'checkup').length,
            critical: allPets.filter(pet => pet.healthStatus === 'critical').length
        };
        res.json({
            success: true,
            data: {
                overview: {
                    userCount,
                    vetClinicCount,
                    petCount,
                    inventoryCount,
                    availableVetClinics,
                    lowStockItems
                },
                users,
                pets,
                inventory,
                activities,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: userCount
                },
                // --- Analytics fields ---
                appointmentsByReasonByMonth,
                inventoryChangesByMonth,
                petsAdmittedByMonth,
                petsStatusChangesByMonth,
                mostSubtractedItem,
                mostSubtractedItemAmount,
                topSubtractedItems,
                topSubtractedItemsByMonth, // <-- Add this to the response
                mostSubtractedCategory,
                mostSubtractedAmount,
                petsByStatus
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};