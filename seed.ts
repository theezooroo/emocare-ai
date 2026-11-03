import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialExercises = [
  { category: 'Hand Therapy', name: 'Finger & Hand Movement', duration: '2 min', difficulty: 'Beginner' },
  { category: 'Hand Therapy', name: 'Wrist Mobility', duration: '2 min', difficulty: 'Intermediate' },
  { category: 'Leg Therapy', name: 'Knee Movement', duration: '2 min', difficulty: 'Beginner' },
  { category: 'Leg Therapy', name: 'Ankle Mobility', duration: '2 min', difficulty: 'Beginner' },
  { category: 'Shoulder Therapy', name: 'Shoulder Rotation', duration: '2 min', difficulty: 'Beginner' },
  { category: 'Shoulder Therapy', name: 'Arm Movement', duration: '2 min', difficulty: 'Intermediate' },
  { category: 'Back Therapy', name: 'Lower Back Stretch', duration: '2 min', difficulty: 'Beginner' },
  { category: 'Back Therapy', name: 'Spinal Mobility', duration: '2 min', difficulty: 'Intermediate' },
  { category: 'Knee Therapy', name: 'Knee Flexion', duration: '2 min', difficulty: 'Beginner' },
  { category: 'Foot Therapy', name: 'Ankle & Foot Exercise', duration: '2 min', difficulty: 'Beginner' }
];

async function main() {
  console.log('Start seeding ...');
  
  const existingRecords = await prisma.exercise.count();
  if (existingRecords === 0) {
    for (const ex of initialExercises) {
      await prisma.exercise.create({
        data: {
          category: ex.category,
          name: ex.name,
          duration: ex.duration,
          difficulty: ex.difficulty,
          description: "Follow your physiotherapist's instructions. If you experience pain or discomfort, stop and seek professional advice."
        }
      });
    }
    console.log('Seeded initial exercises.');
  } else {
    console.log('Exercises already exist. Skipping seed.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
