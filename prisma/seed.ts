import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default categories
  const categories = [
    {
      name: 'Music',
      description: 'Musical compositions and songs',
      color: '#EF4444',
      subcategories: [
        { name: 'Rock' },
        { name: 'Pop' },
        { name: 'Jazz' },
        { name: 'Classical' },
        { name: 'Electronic' },
        { name: 'Hip Hop' },
        { name: 'Country' },
        { name: 'Blues' },
      ]
    },
    {
      name: 'Podcasts',
      description: 'Audio content and discussions',
      color: '#10B981',
      subcategories: [
        { name: 'Technology' },
        { name: 'Business' },
        { name: 'Education' },
        { name: 'Entertainment' },
        { name: 'News' },
        { name: 'Health' },
        { name: 'Sports' },
        { name: 'Comedy' },
      ]
    },
    {
      name: 'Audiobooks',
      description: 'Spoken word books and literature',
      color: '#3B82F6',
      subcategories: [
        { name: 'Fiction' },
        { name: 'Non-Fiction' },
        { name: 'Biography' },
        { name: 'History' },
        { name: 'Science' },
        { name: 'Philosophy' },
        { name: 'Self-Help' },
        { name: 'Children' },
      ]
    },
    {
      name: 'Sound Effects',
      description: 'Audio effects and ambient sounds',
      color: '#8B5CF6',
      subcategories: [
        { name: 'Nature' },
        { name: 'Urban' },
        { name: 'Animals' },
        { name: 'Weather' },
        { name: 'Machines' },
        { name: 'Human' },
        { name: 'Fantasy' },
        { name: 'Sci-Fi' },
      ]
    },
    {
      name: 'Voice Recordings',
      description: 'Personal voice memos and recordings',
      color: '#F59E0B',
      subcategories: [
        { name: 'Notes' },
        { name: 'Interviews' },
        { name: 'Presentations' },
        { name: 'Meetings' },
        { name: 'Lectures' },
        { name: 'Personal' },
        { name: 'Work' },
        { name: 'Creative' },
      ]
    },
    {
      name: 'Meditation',
      description: 'Relaxation and mindfulness audio',
      color: '#EC4899',
      subcategories: [
        { name: 'Guided' },
        { name: 'Nature Sounds' },
        { name: 'Binaural Beats' },
        { name: 'Breathing' },
        { name: 'Sleep' },
        { name: 'Stress Relief' },
        { name: 'Focus' },
        { name: 'Healing' },
      ]
    }
  ];

  for (const categoryData of categories) {
    const { subcategories, ...categoryFields } = categoryData;
    
    const category = await prisma.category.upsert({
      where: { name: categoryFields.name },
      update: {},
      create: categoryFields,
    });

    console.log(`✅ Created category: ${category.name}`);

    // Create subcategories for this category
    for (const subcategoryData of subcategories) {
      await prisma.subcategory.upsert({
        where: {
          name_categoryId: {
            name: subcategoryData.name,
            categoryId: category.id,
          },
        },
        update: {},
        create: {
          ...subcategoryData,
          categoryId: category.id,
        },
      });
    }

    console.log(`✅ Created ${subcategories.length} subcategories for ${category.name}`);
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
