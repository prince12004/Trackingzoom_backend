import slugify from 'slugify';

export function toSlug(value: string): string {
  return slugify(value, { lower: true, strict: true, trim: true });
}

export async function ensureUniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await exists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return slug;
}
