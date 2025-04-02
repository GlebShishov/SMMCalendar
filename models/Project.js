import mongoose from 'mongoose';

const DayContentSchema = new mongoose.Schema({
  socialNetwork: {
    type: String,
    default: '',
  },
  images: {
    type: [String],
    default: [],
  },
  text: {
    type: String,
    default: '',
  },
});

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a project name'],
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  days: {
    type: [DayContentSchema],
    default: Array(7).fill({
      socialNetwork: '',
      images: [],
      text: '',
    }),
  },
  companyName: {
    type: String,
    default: '',
  },
  companyDescription: {
    type: String,
    default: '',
  },
  companyWebsite: {
    type: String,
    default: '',
  },
  socialLinks: {
    type: Map,
    of: String,
    default: {},
  },
  imagePrompt: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
