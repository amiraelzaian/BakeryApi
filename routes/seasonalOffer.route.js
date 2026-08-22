const express = require("express");
const { protect, allowedTo } = require("../controllers/auth.controller");
const {
  createSeasonalOfferValidator,
  updateSeasonalOfferValidator,
  getSeasonalOfferValidator,
  deleteSeasonalOfferValidator,
} = require("../validators/seasonalOffer.validator");
const {
  createSeasonalOffer,
  getAllSeasonalOffers,
  updateSeasonalOffer,
  getSeasonalOffer,
  deleteSeasonalOffer,
} = require("../controllers/seasonalOffer.controller");
const { logAction } = require("../middlewares/logAction");

const router = express.Router();

router
  .route("/")
  .post(
    protect,
    allowedTo("admin"),
    createSeasonalOfferValidator,
    logAction("CREATE_SEASONAL_OFFER", "SeasonalOffer", (req) => ({
      changes: req.body,
    })),
    createSeasonalOffer,
  )
  .get(protect, allowedTo("admin"), getAllSeasonalOffers);
router
  .route("/:id")
  .patch(
    protect,
    allowedTo("admin"),
    updateSeasonalOfferValidator,
    logAction("UPDATE_SEASONAL_OFFER", "SeasonalOffer", (req) => ({
      changes: req.body,
    })),
    updateSeasonalOffer,
  )
  .get(protect, allowedTo("admin"), getSeasonalOfferValidator, getSeasonalOffer)
  .delete(
    protect,
    allowedTo("admin"),
    deleteSeasonalOfferValidator,
    logAction("DELETE_SEASONAL_OFFER", "SeasonalOffer", (req) => ({
      changes: req.body,
    })),
    deleteSeasonalOffer,
  );

module.exports = router;
