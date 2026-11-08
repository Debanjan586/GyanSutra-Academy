import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', ''],
      default: '',
    },
    duration: {
      type: String,
      trim: true,
      default: '',
    },
    regularPrice: {
      type: Number,
      required: [true, 'Regular price is required'],
      min: [0, 'Price cannot be negative'],
    },
    offerPrice: {
      type: Number,
      default: null,
      min: [0, 'Offer price cannot be negative'],
      validate: {
        validator(val) {
          // null/undefined is allowed; if set must be < regularPrice
          if (val == null) return true;
          return val < this.regularPrice;
        },
        message: 'Offer price must be less than the regular price',
      },
    },
    image: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator(val) {
          if (!val) return true;
          try {
            const url = new URL(val);
            return url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        message: 'Image must be a valid HTTPS URL',
      },
    },
    published: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for fast published lookups sorted by displayOrder
courseSchema.index({ published: 1, displayOrder: 1 });

export const Course = mongoose.model('Course', courseSchema);