import { faker } from "@faker-js/faker";
import { db } from "../db";
import { comments, posts, postTags, users } from "../schema";

const TOTAL_USERS = 10000;
const TOTAL_POSTS = 500000;
const TOTAL_COMMENTS = 2000000;
const TOTAL_TAGS = 50;

async function seedUsers() {
  const batch = [];
const emails = faker.helpers.uniqueArray(
  () => faker.internet.email(),
  TOTAL_USERS
);

  for (let i = 0; i < TOTAL_USERS; i++) {
    batch.push({
      name: faker.person.fullName(),
      email: `${faker.internet.displayName()}${i}@example.com`,
      role: faker.helpers.arrayElement(['admin', 'user', 'guest']),
      isActive: faker.datatype.boolean(),
      createdAt: faker.date.past({ years: 3 })
    });

    if (batch.length === 1000) {
      await db.insert(users).values(batch);
      batch.length = 0;
    }
  }



  for (let i = 0; i < TOTAL_POSTS; i += 1000) {
    const batch = [];

    for (let j = 0; j < 1000; j++) {
      batch.push({
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraphs(3),
        authorId: faker.number.int({ min: 1, max: TOTAL_USERS }),
        published: faker.datatype.boolean(),
        createdAt: faker.date.past({ years: 2 })
      });
    }

    await db.insert(posts).values(batch);
    console.log("posts inserted:", i);
  }




  for (let i = 0; i < TOTAL_COMMENTS; i += 1000) {
    const batch = [];

    for (let j = 0; j < 1000; j++) {
      batch.push({
        postId: faker.number.int({ min: 1, max: TOTAL_POSTS }),
        authorId: faker.number.int({ min: 1, max: TOTAL_USERS }),
        content: faker.lorem.sentences(2),
        createdAt: faker.date.recent({ days: 1000 })
      });
    }

    await db.insert(comments).values(batch);

    console.log("comments inserted:", i);
  }




  for (let i = 1; i <= TOTAL_POSTS; i++) {
    
    const tagCount = faker.number.int({ min: 1, max: 5 });

    const batch = [];

    for (let j = 0; j < tagCount; j++) {
      batch.push({
        postId: i,
        tagId: faker.number.int({ min: 1, max: TOTAL_TAGS })
      });
    }

    await db.insert(postTags).values(batch);
  }
}

seedUsers()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error seeding data:", err);
    process.exit(1);
  });