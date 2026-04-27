const mongoose = require("mongoose");

const libraryBookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, enum: ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "ENGLISH", "HISTORY", "GEOGRAPHY", "ECONOMICS", "COMPUTER SCIENCE", "ENTREPRENEURSHIP", "KINYARWANDA", "KISWAHILI", "FRENCH", "RELIGION", "GENERAL STUDIES", "ICT", "LITERATURE"] },
    bookType: { type: String, enum: ["NON_CBC", "CBC", "TEACHER_GUIDE", "PUPIL_BOOK", "SCRIPTED_LESSONS", "EXPERIMENTAL_GUIDE"], default: "NON_CBC" },
    quantity: { type: Number, default: 1 },
    damagedCopies: { type: Number, default: 0 },
    lostCopies: { type: Number, default: 0 },
    condition: { type: String, enum: ["New", "Good", "Fair", "Poor", "Damaged", "Needs Repair"], default: "Good" },
    location: { type: String, default: "Library" },
    shelfNumber: { type: String, default: "" },
    author: { type: String, default: "" },
    publisher: { type: String, default: "" },
    publicationYear: { type: Number },
    isbn: { type: String, default: "" },
    edition: { type: String, default: "" },
    dateAcquired: { type: Date, default: Date.now },
    unitPrice: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
    currentBorrower: { type: String, default: "" },
    borrowedDate: { type: Date },
    dueDate: { type: Date },
    workingCopies: { type: Number, default: 0 },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

libraryBookSchema.virtual('availableCopies').get(function() {
  return this.quantity - (this.damagedCopies || 0) - (this.lostCopies || 0);
});

libraryBookSchema.set('toJSON', { virtuals: true });
libraryBookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("LibraryBook", libraryBookSchema);