export class SessionName {
  private constructor(readonly value: string) {}

  static create(value: string): SessionName {
    const trimmed = value.trim();

    if (trimmed.length < 3 || trimmed.length > 120) {
      throw new Error("planning.session_name.invalid_length");
    }

    return new SessionName(trimmed);
  }

  static from(value: string): SessionName {
    return new SessionName(value);
  }

  equals(other: SessionName): boolean {
    return this.value === other.value;
  }
}

export class AllocationPriority {
  private constructor(readonly value: number) {}

  static create(value: number): AllocationPriority {
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      throw new Error("planning.allocation_priority.invalid");
    }

    return new AllocationPriority(value);
  }

  equals(other: AllocationPriority): boolean {
    return this.value === other.value;
  }

  toNumber(): number {
    return this.value;
  }
}
