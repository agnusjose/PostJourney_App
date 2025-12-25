import mongoose from "mongoose";

// Equipment inside a store
const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    siteUrl: { type: String, default: "" },
    imageUrl: { type: String },  
    available: { type: Boolean, default: true }
  },
  { _id: false } // prevents extra _id for each equipment item (optional but clean)
);

// Equipment Store
const storeSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true },
    location: { type: String, default: "" },
    equipments: { type: [equipmentSchema], default: [] }
  },
  { timestamps: true }
);

// ✅ DEFAULT EXPORT (THIS IS CRITICAL)
const EquipmentStore = mongoose.model("EquipmentStore", storeSchema);
export default EquipmentStore;