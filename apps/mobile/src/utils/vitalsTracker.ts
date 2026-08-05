// Define what a single reading looks like
export interface VitalReading {
  value: number;
  timestamp: number;
}

export class VitalsBuffer {
  private readings: VitalReading[] = [];

  // 1. Data Push Operation
  public addReading(hr: number) {
    // only valid heart rates (greater than 0) - push in array
    if (hr > 0) {
      this.readings.push({
        value: hr,
        timestamp: Date.now(),
      });
    }
  }
  // 2. Averaging & Clearing Operation
  public getAverageAndClear(): number | null {
    // if no data in 5 mins return null
    if (this.readings.length === 0) {
      return null;
    }
    // adding all values of array
    const totalSum = this.readings.reduce((sum, currentItem) => sum + currentItem.value, 0);
    // Average, and removals of decimals(Math.round)
    const average = Math.round(totalSum / this.readings.length);

    // 3. emptying array for next 5 mins
    this.readings = [];
    return average;
  }
  // checking buffer size for Testing
  public getCurrentBufferSize(): number {
    return this.readings.length;
  }
}
// Export a single instance to be used across the app
export const heartRateBuffer = new VitalsBuffer();