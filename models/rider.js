const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const Jwt = require("jsonwebtoken");
const config = require("config");

const GuarantorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    },
    phoneNumber: {
      type: String,
      maxlength: 11,
      required: true
    },
    address: {
      type: String,
    },
    relationship: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);


const riderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: 30,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      unique: true,
      index: true,
      maxlength: 11,
    },
    password: {
      type: String,
      maxlength: 225,
    },
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "inactive",
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
      required: true,
    },
    phoneNumberVerified: {
      type: Boolean,
      default: false,
      index: true,
      required: true,
    },
    company: {
      type: ObjectId,
      ref: "Company",
      default: null,
    },
    vehicle: {
      type: ObjectId,
      ref: "Vehicle",
      required: true,
    },
    createdBy: {
      type: String,
      default: "company",
      enum: ["company", "self"],
    },
    onlineStatus: {
      type: Boolean,
      default: false,
      index: true,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    latitude: {
      type: Number,
      default: 0.0,
    },
    longitude: {
      type: Number,
      default: 0.0,
    },
    locationDate: {
      type: Date,
      default: new Date()
    },
    FCMToken: {
      type: String,
      default: null,
    },
    policyNumber: {
      type: String,
    },
    DOB: Date,
    POI: String,
    POIExpiringDate: Date,
    img: String,
    plateNumber: String,
    ECName: String, //emergency contact name
    ECPhone: String,
    ECEmail: String,
    deleted: {
      type: Boolean,
      default: false,
      index: true,
      // required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: ObjectId,
      ref: "Admin",
      default: null,
    },
    rememberToken: {
      token: {
        type: String,
        default: null,
      },
      expiredDate: {
        type: Date,
        default: null,
      },
    },
     // new fields
    BVN: String,
    NIN: String,
    POA: String, // Prooof of Address
    LASDRIID: String, // LASDRI ID
    POVO: String, // Proof of Vehicle Ownership
    designation: {
      type: String,
      enum: ["exalt","freelance"],
      default: "exalt"
    },
    guarantors: [GuarantorSchema],
    postalCode: String,
    address: String

  },
  {
    timestamps: true,
  }
);

riderSchema.methods.generateToken = function () {
  return Jwt.sign(
    {
      id: this._id,
      email: this.email,
      companyId: this.company,
      type: "rider",
    },
    config.get("application.jwt.key"),
    { expiresIn: "16w" }
  );
};


const Rider = mongoose.model("Rider", riderSchema);

module.exports = Rider;
