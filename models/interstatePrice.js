const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;


const interstatePriceSchema = mongoose.Schema(
    {
        source: {
            type: String,
            index: true,
            required: true,
            default: "admin",
            enum: ["admin", "company"],
        },
        company: {
            type: ObjectId,
            ref: "Company",
            index: true,
        },
        organization: {
            type: ObjectId,
            ref: "Organization",
            index: true,
        },
        originCountry: {
            type: String,
            index: true,
            required: true,
        },
        originState: {
            type: String,
            index: true,
            required: true,
        },
        destinationState: {
            type: String,
            index: true,
            required: true,
        },
        destinationCountry: {
            type: String,
            index: true,
            required: true,
        },
        price: {
            type: Number,
            index: true,
            required: true,
        },
        currency: {
            type: String,
            default: "NGN",
        },
    },
    {
        timestamps: true,
    }
);

const interstatePrice = mongoose.model("interstatePrice", interstatePriceSchema);

module.exports = interstatePrice;
