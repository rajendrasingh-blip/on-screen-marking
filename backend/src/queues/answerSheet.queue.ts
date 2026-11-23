import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const ANSWER_SHEET_QUEUE =
  "answer-sheet-processing";

export const answerSheetQueue =
  new Queue(
    ANSWER_SHEET_QUEUE,
    {
      connection:
        redisConnection,

      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 10000,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60,
        },
      }
    }
  );