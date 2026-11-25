import { answerSheetQueue } from "../queues/answerSheet.queue";

async function clearQueue() {
  try {
    // Queue ke active jobs bhi delete karne ki permission
    await answerSheetQueue.obliterate({
      force: true,
    });

    console.log("Answer sheet queue cleared successfully");
  } catch (error) {
    console.error("Queue clear error:", error);
  } finally {
    await answerSheetQueue.close();
  }
}

clearQueue();