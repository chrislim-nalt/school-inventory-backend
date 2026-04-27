const LibraryBook = require("../models/LibraryBook");

// Get all books (filtered by school)
exports.getBooks = async (req, res) => {
    try {
        const books = await LibraryBook.find({ school: req.user.schoolId })
            .sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        console.error("Get books error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get single book by ID
exports.getBookById = async (req, res) => {
    try {
        const book = await LibraryBook.findOne({ 
            _id: req.params.id, 
            school: req.user.schoolId 
        });
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json(book);
    } catch (error) {
        console.error("Get book by ID error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Create book (automatically adds school ID)
exports.createBook = async (req, res) => {
    try {
        console.log("Creating book for school:", req.user.schoolId);
        
        const book = new LibraryBook({
            title: req.body.title,
            subject: req.body.subject,
            bookType: req.body.bookType || "NON_CBC",
            quantity: req.body.quantity || 1,
            damagedCopies: req.body.damagedCopies || 0,
            lostCopies: req.body.lostCopies || 0,
            condition: req.body.condition || "Good",
            location: req.body.location || "Library",
            shelfNumber: req.body.shelfNumber || "",
            author: req.body.author || "",
            publisher: req.body.publisher || "",
            publicationYear: req.body.publicationYear,
            isbn: req.body.isbn || "",
            edition: req.body.edition || "",
            dateAcquired: req.body.dateAcquired || new Date(),
            unitPrice: req.body.unitPrice || 0,
            notes: req.body.notes || "",
            school: req.user.schoolId
        });
        
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        console.error("Create book error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update book (verify school ownership)
exports.updateBook = async (req, res) => {
    try {
        const book = await LibraryBook.findOneAndUpdate(
            { _id: req.params.id, school: req.user.schoolId },
            req.body,
            { new: true }
        );
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json(book);
    } catch (error) {
        console.error("Update book error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete book (verify school ownership)
exports.deleteBook = async (req, res) => {
    try {
        const book = await LibraryBook.findOneAndDelete({ 
            _id: req.params.id, 
            school: req.user.schoolId 
        });
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        console.error("Delete book error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get books by subject (filtered by school)
exports.getBooksBySubject = async (req, res) => {
    try {
        const books = await LibraryBook.find({ 
            subject: req.params.subject,
            school: req.user.schoolId 
        });
        res.json(books);
    } catch (error) {
        console.error("Get books by subject error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get books by type (filtered by school)
exports.getBooksByType = async (req, res) => {
    try {
        const books = await LibraryBook.find({ 
            bookType: req.params.bookType,
            school: req.user.schoolId 
        });
        res.json(books);
    } catch (error) {
        console.error("Get books by type error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Borrow a book (verify school ownership)
exports.borrowBook = async (req, res) => {
    try {
        const { borrowerName, dueDate } = req.body;
        
        const book = await LibraryBook.findOne({ 
            _id: req.params.id, 
            school: req.user.schoolId 
        });
        
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        
        const availableCopies = book.quantity - (book.damagedCopies || 0) - (book.lostCopies || 0);
        if (availableCopies <= 0) {
            return res.status(400).json({ message: "No copies available for borrowing" });
        }
        
        book.isAvailable = false;
        book.currentBorrower = borrowerName;
        book.borrowedDate = new Date();
        book.dueDate = dueDate;
        book.workingCopies = availableCopies - 1;
        
        await book.save();
        res.json(book);
    } catch (error) {
        console.error("Borrow book error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Return a book (verify school ownership)
exports.returnBook = async (req, res) => {
    try {
        const book = await LibraryBook.findOne({ 
            _id: req.params.id, 
            school: req.user.schoolId 
        });
        
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        
        book.isAvailable = true;
        book.currentBorrower = "";
        book.borrowedDate = null;
        book.dueDate = null;
        
        const availableCopies = book.quantity - (book.damagedCopies || 0) - (book.lostCopies || 0);
        book.workingCopies = availableCopies;
        
        await book.save();
        res.json(book);
    } catch (error) {
        console.error("Return book error:", error);
        res.status(500).json({ message: error.message });
    }
};