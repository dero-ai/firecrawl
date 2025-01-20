import { Response } from "express";
import { supabaseGetJobsById } from "../../lib/supabase-jobs";
import { RequestWithAuth } from "./types";
import { getExtract, getExtractExpiry } from "../../lib/extract/extract-redis";
import { Redis } from "ioredis";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
export async function extractStatusController(
  req: RequestWithAuth<{ jobId: string }, any, any>,
  res: Response,
) {
  const extract = await getExtract(req.params.jobId);

  if (!extract) {
    return res.status(404).json({
      success: false,
      error: "Extract job not found",
    });
  }

  let data: any[] = [];

  if (extract.status === "completed") {
    const jobResult = await redisConnection.get(`job_result:${req.params.jobId}`);
    if (!jobResult) {
      return res.status(404).json({
        success: false,
        error: "Job not found", 
      });
    }

    const jobData = JSON.parse(jobResult);
    data = jobData.docs;
  }

  return res.status(200).json({
    success: extract.status === "failed" ? false : true,
    data: data,
    status: extract.status,
    error: extract?.error ?? undefined,
    expiresAt: (await getExtractExpiry(req.params.jobId)).toISOString(),
    steps: extract.showSteps ? extract.steps : undefined,
    llmUsage: extract.showLLMUsage ? extract.llmUsage : undefined,
  });
}
