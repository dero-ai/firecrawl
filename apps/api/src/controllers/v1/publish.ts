import { Response } from "express";
import { supabaseGetJobsById } from "../../lib/supabase-jobs";
import { RequestWithAuth } from "./types";
import { getExtract, getExtractExpiry } from "../../lib/extract/extract-redis";
import { Redis } from "ioredis";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function publishController(
  req: RequestWithAuth<{ jobId: string, marketplaceName: string }, any, any>,
  res: Response,
) {
  const marketplaceName = req.params.marketplaceName;
  const extract = await getExtract(req.params.jobId);
  console.log("Publishing extract", {
    jobId: req.params.jobId,
    marketplaceName,
  });

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
    data = jobData.docs.products;

    try {
      const products = data.map((product) => {
        return {
          Source: "firecrawl",
          Name: product.name,
          Price: product.price,
          Image: product.imageLink,
          Images: product.additionalImageLinks,
          Link: product.productLink,
          Quality: product.condition,
          Description: product.description,
          OriginalCategory: product.category,
        };
      });

      const body = {
        products: products,
        marketplace:marketplaceName,
      };

      // Index in Algolia
      fetch(
        `https://lgj2ia1aee.execute-api.us-east-1.amazonaws.com/app`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      console.log(`Indexed ${products.length} products for ${marketplaceName} in Algolia`);
    } catch (e) {
      console.error(e);
    }
  }

  return res.status(200).json({
    success: extract.status === "failed" ? false : true,
    status: extract.status,
    error: extract?.error ?? undefined,
    expiresAt: (await getExtractExpiry(req.params.jobId)).toISOString(),
    steps: extract.showSteps ? extract.steps : undefined,
    llmUsage: extract.showLLMUsage ? extract.llmUsage : undefined,
  });
}
