"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomepageSection = void 0;
const mongoose_1 = require("mongoose");
const homepageSectionSchema = new mongoose_1.Schema({
    key: {
        type: String,
        enum: [
            'hero',
            'services',
            'product_showcase',
            'categories',
            'featured_products',
            'gps_products',
            'accessories',
            'stats',
            'best_sellers',
            'new_arrivals',
            'offers',
            'how_it_works',
            'why_choose_us',
            'trust_badges',
            'app_promotion',
            'expert_reviews',
            'customer_reviews',
            'compatibility',
            'blogs',
            'callback',
        ],
        required: true,
        unique: true,
    },
    title: String,
    subtitle: String,
    image: String,
    buttonText: String,
    buttonLink: String,
    config: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    enabled: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true });
exports.HomepageSection = (0, mongoose_1.model)('HomepageSection', homepageSectionSchema);
//# sourceMappingURL=HomepageSection.js.map