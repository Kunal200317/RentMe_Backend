export const verifyOwner = (req, res, next) => {
  if (req.role !== "owner") {
    return res.status(403).json({ success: false, message: "Only owners can add vehicles" });
  }
  next();
};
