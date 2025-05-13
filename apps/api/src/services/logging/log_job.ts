import { ExtractorOptions } from "./../../lib/entities";
import { FirecrawlJob } from "../../types";
import { posthog } from "../posthog";
import "dotenv/config";
import { logger } from "../../lib/logger";
import { configDotenv } from "dotenv";
import { Redis } from "ioredis";
configDotenv();

const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function cleanOfNull<T>(x: T): T {
  if (Array.isArray(x)) {
    return x.map((x) => cleanOfNull(x)) as T;
  } else if (typeof x === "object" && x !== null) {
    return Object.fromEntries(
      Object.entries(x).map(([k, v]) => [k, cleanOfNull(v)]),
    ) as T;
  } else if (typeof x === "string") {
    return x.replaceAll("\u0000", "") as T;
  } else {
    return x;
  }
}

export async function logJob(job: FirecrawlJob, force: boolean = false) {
  try {
    const jobData = {
      job_id: job.job_id ? job.job_id : null,
      success: job.success,
      message: job.message,
      num_docs: job.num_docs,
      docs: cleanOfNull(job.docs),
      time_taken: job.time_taken,
      team_id: job.team_id === "preview" ? null : job.team_id,
      mode: job.mode,
      url: job.url,
      crawler_options: job.crawlerOptions,
      page_options: job.scrapeOptions,
      origin: job.origin,
      num_tokens: job.num_tokens,
      retry: !!job.retry,
      crawl_id: job.crawl_id,
      tokens_billed: job.tokens_billed,
      created_at: new Date().toISOString()
    };

    console.log("================================", jobData);

    if (force) {
      let i = 0,
        done = false;
      while (i++ <= 10) {
        try {
          await redisConnection.set(`job_result:${job.job_id}`, JSON.stringify(jobData));
          done = true;
          break;
        } catch (error) {
          logger.error(
            "Failed to log job to Redis -- trying again",
            { error, scrapeId: job.job_id },
          );
          await new Promise<void>((resolve) => setTimeout(() => resolve(), 75));
        }
      }
      if (done) {
        logger.debug("Job logged successfully to Redis!", { scrapeId: job.job_id });
      } else {
        logger.error("Failed to log job to Redis!", { scrapeId: job.job_id });
      }
    } else {
      try {
        await redisConnection.set(`job_result:${job.job_id}`, JSON.stringify(jobData));
        logger.debug("Job logged successfully to Redis!", { scrapeId: job.job_id });
      } catch (error) {
        logger.error(`Error logging job to Redis: ${error.message}`, {
          error,
          scrapeId: job.job_id,
        });
      }
    }

    if (process.env.POSTHOG_API_KEY && !job.crawl_id) {
      let phLog = {
        distinctId: "from-api", //* To identify this on the group level, setting distinctid to a static string per posthog docs: https://posthog.com/docs/product-analytics/group-analytics#advanced-server-side-only-capturing-group-events-without-a-user
        ...(job.team_id !== "preview" && {
          groups: { team: job.team_id },
        }), //* Identifying event on this team
        event: "job-logged",
        properties: {
          success: job.success,
          message: job.message,
          num_docs: job.num_docs,
          time_taken: job.time_taken,
          team_id: job.team_id === "preview" ? null : job.team_id,
          mode: job.mode,
          url: job.url,
          crawler_options: job.crawlerOptions,
          page_options: job.scrapeOptions,
          origin: job.origin,
          num_tokens: job.num_tokens,
          retry: job.retry,
          tokens_billed: job.tokens_billed,
        },
      };
      if (job.mode !== "single_urls") {
        posthog.capture(phLog);
      }
    }
  } catch (error) {
    logger.error(`Error logging job: ${error.message}`);
  }
}
