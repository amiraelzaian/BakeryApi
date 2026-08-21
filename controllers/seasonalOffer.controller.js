const factory = require("./factory");
const SeasonalOffer = require("../models/seasonalOffers.model");

exports.createSeasonalOffer = factory.createOne(SeasonalOffer);

exports.getSeasonalOffer = factory.getOne(SeasonalOffer);

exports.getAllSeasonalOffers = factory.getAll(SeasonalOffer);

exports.updateSeasonalOffer = factory.updateOne(SeasonalOffer);

exports.deleteSeasonalOffer = factory.deleteOne(SeasonalOffer);
