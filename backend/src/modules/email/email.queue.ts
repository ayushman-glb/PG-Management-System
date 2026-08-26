export class EmailQueue {
  private static queue: any[] = [];

  public static enqueue(job: { to: string; subject: string; html: string; pdfBuffer?: Buffer }): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.queue.push({ id: jobId, ...job, queuedAt: new Date() });
    return jobId;
  }

  public static size(): number {
    return this.queue.length;
  }

  public static clear(): void {
    this.queue.length = 0;
  }
}
