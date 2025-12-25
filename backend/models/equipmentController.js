export const getAllStoresWithEquipment = async (req, res) => {
  try {
    const stores = await EquipmentStore.find().lean();
    res.json({ success: true, data: stores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not fetch equipment providers" });
  }
};
