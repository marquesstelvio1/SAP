export class Weight {
  private constructor(
    readonly value: number,
    readonly unit: "kg" | "ton",
  ) {}

  static kilograms(value: number): Weight {
    if (value <= 0 || value > 1_000_000) {
      throw new Error("capacity.weight.invalid");
    }

    return new Weight(value, "kg");
  }

  static tons(value: number): Weight {
    if (value <= 0 || value > 10_000) {
      throw new Error("capacity.weight.invalid");
    }

    return new Weight(value, "ton");
  }

  toKilograms(): number {
    return this.unit === "ton" ? this.value * 1000 : this.value;
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: Weight): boolean {
    return this.toKilograms() === other.toKilograms();
  }
}

export class Volume {
  private constructor(readonly value: number) {}

  static cubicMeters(value: number): Volume {
    if (value <= 0 || value > 100_000) {
      throw new Error("capacity.volume.invalid");
    }

    return new Volume(value);
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: Volume): boolean {
    return this.value === other.value;
  }
}

export class Route {
  private constructor(
    readonly origin: string,
    readonly destination: string,
  ) {}

  static create(origin: string, destination: string): Route {
    const trimmedOrigin = origin.trim();
    const trimmedDestination = destination.trim();

    if (trimmedOrigin.length < 2 || trimmedDestination.length < 2) {
      throw new Error("capacity.route.invalid_length");
    }

    if (trimmedOrigin.toUpperCase() === trimmedDestination.toUpperCase()) {
      throw new Error("capacity.route.same_origin_destination");
    }

    return new Route(trimmedOrigin, trimmedDestination);
  }

  equals(other: Route): boolean {
    return (
      this.origin.toUpperCase() === other.origin.toUpperCase() &&
      this.destination.toUpperCase() === other.destination.toUpperCase()
    );
  }
}
