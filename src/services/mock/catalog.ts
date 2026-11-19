import type { Category, SubCategory } from '@/types/models';
import { artwork } from './helpers';

const cat = (key: string, name: string): Category => ({
  _id: `cat_${key}`,
  name,
  category_image: artwork(`cat-${key}`, 400),
});

export const categories: Category[] = [
  cat('sermons', 'Sermons'),
  cat('worship', 'Worship'),
  cat('bible', 'Bible Study'),
  cat('prayer', 'Prayer'),
  cat('youth', 'Youth'),
  cat('family', 'Family & Marriage'),
  cat('testimonies', 'Testimonies'),
  cat('devotionals', 'Devotionals'),
];

const sub = (category: string, key: string, name: string): SubCategory => ({
  _id: `sub_${key}`,
  category: `cat_${category}`,
  name,
  image: artwork(`sub-${key}`, 300),
});

export const subCategories: SubCategory[] = [
  sub('sermons', 'sunday', 'Sunday Service'),
  sub('sermons', 'faith', 'Faith'),
  sub('sermons', 'grace', 'Grace'),
  sub('sermons', 'leadership', 'Leadership'),
  sub('worship', 'live-worship', 'Live Worship'),
  sub('worship', 'acoustic', 'Acoustic'),
  sub('bible', 'old-testament', 'Old Testament'),
  sub('bible', 'gospels', 'The Gospels'),
  sub('bible', 'epistles', 'Epistles'),
  sub('prayer', 'morning-prayer', 'Morning Prayer'),
  sub('prayer', 'intercession', 'Intercession'),
  sub('youth', 'campus', 'Campus'),
  sub('youth', 'identity', 'Identity'),
  sub('family', 'marriage', 'Marriage'),
  sub('family', 'parenting', 'Parenting'),
  sub('testimonies', 'healing', 'Healing'),
  sub('testimonies', 'restoration', 'Restoration'),
  sub('devotionals', 'daily-word', 'Daily Word'),
];

export const categoryById = (id: string) => categories.find((c) => c._id === id);
export const subCategoryById = (id: string) => subCategories.find((s) => s._id === id);
