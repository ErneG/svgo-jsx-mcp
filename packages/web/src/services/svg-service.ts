import { optimizeSvg, type OptimizeResult as SharedOptimizeResult } from "@svgo-jsx/shared";
import { requestRepository, statsRepository } from "@/repositories";

export interface OptimizeRequest {
  content: string;
  filename?: string;
  camelCase?: boolean;
}

export interface ServiceOptimizeResult {
  success: true;
  data: SharedOptimizeResult;
}

export interface ServiceOptimizeError {
  success: false;
  error: string;
}

export type ServiceOptimizeResponse = ServiceOptimizeResult | ServiceOptimizeError;

export interface BatchItem {
  content: string;
  filename?: string;
}

export interface BatchResult {
  success: boolean;
  filename?: string;
  data?: SharedOptimizeResult;
  error?: string;
}

export class SvgService {
  /**
   * Optimize a single SVG
   */
  async optimizeSingle(
    request: OptimizeRequest,
    apiKeyId: string
  ): Promise<ServiceOptimizeResponse> {
    const camelCase = request.camelCase ?? true;

    try {
      const result = optimizeSvg({
        content: request.content,
        filename: request.filename,
        camelCase,
        sanitize: true,
      });

      // Record the request
      await requestRepository.create({
        apiKeyId,
        filename: request.filename,
        originalSize: result.optimization.originalSize,
        optimizedSize: result.optimization.optimizedSize,
        savedBytes: result.optimization.savedBytes,
        camelCase,
        success: true,
      });

      // Update global stats
      await statsRepository.incrementSuccess(result.optimization.savedBytes);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Record the failed request
      await requestRepository.create({
        apiKeyId,
        filename: request.filename,
        originalSize: request.content.length,
        optimizedSize: 0,
        savedBytes: 0,
        camelCase,
        success: false,
        errorMessage,
      });

      // Update global stats
      await statsRepository.incrementError();

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Optimize multiple SVGs in batch
   */
  async optimizeBatch(
    items: BatchItem[],
    apiKeyId: string,
    options?: { camelCase?: boolean }
  ): Promise<BatchResult[]> {
    const camelCase = options?.camelCase ?? true;
    const results: BatchResult[] = [];

    let totalBytesSaved = 0;
    let successCount = 0;
    let errorCount = 0;

    const requestRecords: Array<{
      apiKeyId: string;
      filename?: string;
      originalSize: number;
      optimizedSize: number;
      savedBytes: number;
      camelCase: boolean;
      success: boolean;
      errorMessage?: string;
    }> = [];

    for (const item of items) {
      try {
        const result = optimizeSvg({
          content: item.content,
          filename: item.filename,
          camelCase,
          sanitize: true,
        });

        results.push({
          success: true,
          filename: item.filename,
          data: result,
        });

        requestRecords.push({
          apiKeyId,
          filename: item.filename,
          originalSize: result.optimization.originalSize,
          optimizedSize: result.optimization.optimizedSize,
          savedBytes: result.optimization.savedBytes,
          camelCase,
          success: true,
        });

        totalBytesSaved += result.optimization.savedBytes;
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        results.push({
          success: false,
          filename: item.filename,
          error: errorMessage,
        });

        requestRecords.push({
          apiKeyId,
          filename: item.filename,
          originalSize: item.content.length,
          optimizedSize: 0,
          savedBytes: 0,
          camelCase,
          success: false,
          errorMessage,
        });

        errorCount++;
      }
    }

    // Bulk insert request records
    await requestRepository.createMany(requestRecords);

    // Update global stats in one operation
    await statsRepository.incrementBatch(successCount, errorCount, totalBytesSaved);

    return results;
  }

  /**
   * Optimize SVG without recording (for preview/editor)
   */
  optimizePreview(content: string, options?: { camelCase?: boolean }): ServiceOptimizeResponse {
    try {
      const result = optimizeSvg({
        content,
        camelCase: options?.camelCase ?? true,
        sanitize: true,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const svgService = new SvgService();
