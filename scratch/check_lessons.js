const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLessons() {
  const lessons = await prisma.lesson.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, topic: true, date: true, scheduleId: true, courseId: true }
  });
  console.log(JSON.stringify(lessons, null, 2));
  process.exit(0);
}

checkLessons();
