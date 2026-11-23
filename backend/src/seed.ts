import dotenv from "dotenv";
dotenv.config();

import { connectDatabase } from "./config/db";
import { Exam } from "./models/Exam";

async function seed() {
  await connectDatabase();

  await Exam.deleteMany({
    name: "RBSE Class 12 Physics Demo",
  });

  const exam =
    await Exam.create({
      name:
        "RBSE Class 12 Physics Demo",

      subject: "Physics",

      answerSheet: {
        width: 697.68,
        height: 1044,
      },

      questions: [
        {
          qNo: "1(i)",
          title: "Question 1 (i)",
          maxMarks: 1,
        },
        {
          qNo: "1(ii)",
          title: "Question 1 (ii)",
          maxMarks: 2,
        },
        {
          qNo: "1(iii)",
          title: "Question 1 (iii)",
          maxMarks: 2,
        },
        {
          qNo: "1(iv)",
          title: "Question 1 (iv)",
          maxMarks: 2,
        },
        {
          qNo: "1(v)",
          title: "Question 1 (v)",
          maxMarks: 2,
        },
        {
          qNo: "1(vi)",
          title: "Question 1 (vi)",
          maxMarks: 2,
        },
        {
          qNo: "2",
          title: "Question 2",
          maxMarks: 3,
        },
        {
          qNo: "3",
          title: "Question 3",
          maxMarks: 4,
        },
        {
          qNo: "4",
          title: "Question 4",
          maxMarks: 5,
        },
        {
          qNo: "5",
          title: "Question 5",
          maxMarks: 5,
        },
        {
          qNo: "6",
          title: "Question 6",
          maxMarks: 5,
        },
        {
          qNo: "7",
          title: "Question 7",
          maxMarks: 3,
        },
        {
          qNo: "8",
          title: "Question 8",
          maxMarks: 4,
        },
        {
          qNo: "9",
          title: "Question 9",
          maxMarks: 5,
        },
        {
          qNo: "10",
          title: "Question 10",
          maxMarks: 5,
        },
      ],
    });

  console.log(
    "Exam created:",
    exam._id.toString()
  );

  process.exit(0);
}

seed();