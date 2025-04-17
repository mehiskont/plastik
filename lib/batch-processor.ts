export class BatchProcessor<T, R> {
  private batch: Array<{
    item: T
    resolve: (value: R) => void
    reject: (error: any) => void
  }> = []
  private processing = false
  private timer: NodeJS.Timeout | null = null

  constructor(
    private readonly processFn: (items: T[]) => Promise<R[]>,
    private readonly options: {
      maxBatchSize?: number
      maxWaitTime?: number
    } = {},
  ) {}

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.batch.push({ item, resolve, reject })

      if (this.batch.length >= (this.options.maxBatchSize || 10)) {
        this.process()
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.process(), this.options.maxWaitTime || 1000)
      }
    })
  }

  private async process(): Promise<void> {
    if (this.processing || this.batch.length === 0) return

    this.processing = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    const currentBatch = [...this.batch]
    this.batch = []

    try {
      const items = currentBatch.map(({ item }) => item)
      const results = await this.processFn(items)

      // Match results with their promises
      results.forEach((result, index) => {
        currentBatch[index].resolve(result)
      })
    } catch (error) {
      // Reject all promises in the batch
      currentBatch.forEach(({ reject }) => {
        reject(error)
      })
    } finally {
      this.processing = false

      // Process any remaining items
      if (this.batch.length > 0) {
        this.process()
      }
    }
  }
}

