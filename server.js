const app = require("./src/app");
const prisma = require("./src/database");

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log("Prisma connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
});
