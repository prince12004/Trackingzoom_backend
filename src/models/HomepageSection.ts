import { Schema, model, Document } from 'mongoose';

export type HomepageSectionKey =
  | 'hero'
  | 'services'
  | 'product_showcase'
  | 'categories'
  | 'featured_products'
  | 'gps_products'
  | 'accessories'
  | 'stats'
  | 'best_sellers'
  | 'new_arrivals'
  | 'offers'
  | 'how_it_works'
  | 'why_choose_us'
  | 'trust_badges'
  | 'app_promotion'
  | 'expert_reviews'
  | 'customer_reviews'
  | 'compatibility'
  | 'blogs'
  | 'callback';

export interface IHomepageSection extends Document {
  key: HomepageSectionKey;
  title?: string;
  subtitle?: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  config: Record<string, unknown>;
  enabled: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const homepageSectionSchema = new Schema<IHomepageSection>(
  {
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
    config: { type: Schema.Types.Mixed, default: {} },
    enabled: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const HomepageSection = model<IHomepageSection>('HomepageSection', homepageSectionSchema);
