import express from "express";

const router = express.Router();

// GET all caregiver agencies
router.get("/", async (req, res) => {
  try {
    const agencies = await CaregiverAgency.find();
    res.json({ success: true, data: agencies });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch caregiver agencies" });
  }
});

// ADD a new caregiver agency
router.post("/add", async (req, res) => {
  try {
    const { name, location, price, serviceType, siteUrl } = req.body;

    const agency = new CaregiverAgency({
      name,
      location,
      price,
      serviceType,
      siteUrl,
    });

    await agency.save();

    res.json({ success: true, message: "Agency added successfully" });
  } catch (error) {
    res.json({ success: false, message: "Failed to add agency" });
  }
});

export default router;