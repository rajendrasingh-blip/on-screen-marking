import {
  Worker,
  Job,
} from "bullmq";

import {
  redisConnection,
} from "../config/redis";

import {
  ANSWER_SHEET_QUEUE,
} from "../queues/answerSheet.queue";

import {
  processAnswerSheet,
} from "../services/processing/answerSheetProcessor";

import { connectDatabase } from "../config/db";

interface AnswerSheetJob {
  answerSheetId: string;
  pdfId: string;
  studentId: string;
  examId: string;
}

async function startWorker() {
  await connectDatabase();

  console.log("MongoDB connected");

  const worker = new Worker<AnswerSheetJob>(
    ANSWER_SHEET_QUEUE,
    async (job) => {
      await processAnswerSheet(job.data.answerSheetId, job);
      return { success: true };
    },
    {
      connection: redisConnection,
      concurrency: 1,

      lockDuration: 300000,      // 5 min
      stalledInterval: 60000,    // 1 min
      maxStalledCount: 3,
    }
  );

  worker.on(
    "completed",
    (job) => {
      console.log(
        `Job completed: ${job.id}`
      );
    }
  );

  worker.on(
    "failed",
    (job, error) => {
      console.error(
        `Job failed: ${job?.id}`,
        error
      );
    }
  );

  worker.on(
    "error",
    (error) => {
      console.error(
        "Worker error:",
        error
      );
    }
  );

  console.log(
    "Answer sheet worker started"
  );
}

startWorker().catch((error) => {
  console.error(
    "Worker startup failed:",
    error
  );

  process.exit(1);
});