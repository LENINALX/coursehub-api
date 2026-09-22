import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseStudentIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException('Student ID must be a positive integer');
    }

    const id = Number(value);

    if (!Number.isSafeInteger(id)) {
      throw new BadRequestException('Student ID must be a positive integer');
    }

    return id;
  }
}