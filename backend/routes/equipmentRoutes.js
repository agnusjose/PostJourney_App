import express from "express";
import mongoose from "mongoose";
import EquipmentStore from "../models/EquipmentStore.js";

const router = express.Router();

/* =========================
   GET ALL EQUIPMENT STORES
========================= */
router.get("/", async (req, res) => {
  try {
    const stores = await EquipmentStore.find();
    res.json({ success: true, data: stores });
  } catch (error) {
    console.error("GET /equipment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch equipment stores",
    });
  }
});

/* =========================
   SEARCH EQUIPMENT
========================= */
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Query param q is required" });
    }

    const stores = await EquipmentStore.find({
      "equipments.name": { $regex: q, $options: "i" },
    });

    res.json({ success: true, data: stores });
  } catch (error) {
    console.error("GET /equipment/search error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

/* =========================
   GET STORE BY ID
========================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid store id" });
    }

    const store = await EquipmentStore.findById(id);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    res.json({ success: true, data: store });
  } catch (error) {
    console.error("GET /equipment/:id error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch store" });
  }
});

/* =========================
   CREATE NEW STORE
========================= */
router.post("/add", async (req, res) => {
  try {
    const { storeName, location = "", equipments = [] } = req.body;

    if (!storeName) {
      return res
        .status(400)
        .json({ success: false, message: "storeName is required" });
    }

    const store = new EquipmentStore({ storeName, location, equipments });
    await store.save();

    res.status(201).json({ success: true, data: store });
  } catch (error) {
    console.error("POST /equipment/add error:", error);
    res.status(500).json({ success: false, message: "Failed to create store" });
  }
});

/* =========================
   ADD EQUIPMENT
========================= */
router.post("/:storeId/add-equipment", async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid store id" });
    }

    const { name, price = 0, stock = 0, imageUrl = "" } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Equipment name is required" });
    }

    const store = await EquipmentStore.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    store.equipments.push({
      name,
      price,
      stock,
      imageUrl,
      available: true,
    });

    await store.save();

    res.json({
      success: true,
      message: "Product added successfully",
      data: store,
    });
  } catch (error) {
    console.error("POST add-equipment error:", error);
    res.status(500).json({ success: false, message: "Failed to add equipment" });
  }
});

/* =========================
   UPDATE EQUIPMENT (STEP 6A)
========================= */
router.put("/:storeId/update-equipment/:equipmentId", async (req, res) => {
  try {
    const { storeId, equipmentId } = req.params;
    const { name, price, stock, imageUrl } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(storeId) ||
      !mongoose.Types.ObjectId.isValid(equipmentId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID" });
    }

    const store = await EquipmentStore.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    const equipment = store.equipments.id(equipmentId);
    if (!equipment) {
      return res
        .status(404)
        .json({ success: false, message: "Equipment not found" });
    }

    equipment.name = name;
    equipment.price = price;
    equipment.stock = stock;
    equipment.imageUrl = imageUrl;

    await store.save();

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("PUT update-equipment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update product" });
  }
});

/* ✅ EXPORT ROUTER */
export default router;